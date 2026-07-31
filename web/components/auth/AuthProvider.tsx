'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from '@/lib/auth/client';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { AuthProfile } from '@/lib/auth/session';
import type { Json } from '@/lib/supabase/types';

type UserSettings = {
  receive_newsletter: boolean;
  notification_email: boolean;
  preferences: Json;
};

type AuthContextValue = {
  user: User | null;
  profile: AuthProfile | null;
  settings: UserSettings | null;
  loading: boolean;
  /** True si la plataforma no tiene Supabase configurado (modo demo). */
  demoMode: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  settings: null,
  loading: true,
  demoMode: true,
  refresh: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const current = session?.user ?? null;
    setUser(current);

    if (current) {
      const { data: p } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, email, avatar_url, rol, estado, last_sign_in_at, created_at')
        .eq('id', current.id)
        .single();
      setProfile(p ?? null);

      const { data: s } = await supabase
        .from('user_settings')
        .select('receive_newsletter, notification_email, preferences')
        .eq('user_id', current.id)
        .single();
      setSettings(s ?? null);
    } else {
      setProfile(null);
      setSettings(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    void refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null;
      setUser(next);
      if (!next) {
        setProfile(null);
        setSettings(null);
      } else {
        void refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [refresh]);

  const signOut = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSettings(null);
    router.refresh();
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, settings, loading, demoMode: !isSupabaseConfigured, refresh, signOut }),
    [user, profile, settings, loading, refresh, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
