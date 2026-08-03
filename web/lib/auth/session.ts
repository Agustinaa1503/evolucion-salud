import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import type { Database } from '@/lib/supabase/types';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { canAccessAdmin, hasPermission } from '@/lib/admin/rbac';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Cliente de Supabase del lado servidor, consciente de la sesión del usuario
 * (cookies). Se usa en Server Components y Server Actions. Respeta la RLS:
 * los queries con este cliente ven solo lo que permite la sesión.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component sin mutación de cookies: se ignora silenciosamente
          // (el middleware refresca la sesión al navegar).
        }
      },
    },
  });
}

export type AuthProfile = {
  id: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  avatar_url: string | null;
  rol: string;
  estado: string;
  last_sign_in_at: string | null;
  created_at: string;
};

export type AuthSession = {
  user: {
    id: string;
    email: string;
    email_confirmed_at: string | null;
  } | null;
  profile: AuthProfile | null;
};

export type AuthUser = {
  user: {
    id: string;
    email: string;
    email_confirmed_at: string | null;
  };
  profile: AuthProfile | null;
};

/** Devuelve el usuario y su perfil si hay sesión activa (sin redirección). */
export const getAuthSession = cache(async (): Promise<AuthSession> => {
  if (!isSupabaseConfigured) return { user: null, profile: null };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, email, avatar_url, rol, estado, last_sign_in_at, created_at')
    .eq('id', user.id)
    .single();

  return {
    user: {
      id: user.id,
      email: user.email ?? '',
      email_confirmed_at: user.email_confirmed_at ?? null,
    },
    profile: profile ?? null,
  };
});

/** Exige sesión activa; si no la hay redirige a /login. */
export async function requireUser(): Promise<AuthUser> {
  const session = await getAuthSession();
  if (!session.user) {
    redirect('/login');
  }
  return { user: session.user, profile: session.profile };
}

/** Exige sesión activa con rol administrador. */
export async function requireAdmin(): Promise<AuthUser> {
  const session = await requireUser();
  if (!canAccessAdmin(session.profile?.rol) || session.profile?.estado !== 'activo') {
    redirect('/cursos');
  }
  return session;
}

/**
 * Exige sesión activa con rol de administración (acceso al BackOffice) y,
 * opcionalmente, un permiso específico del módulo. Redirige a /login si no hay
 * sesión, a /cursos si el rol no tiene acceso al BackOffice y a /admin si el
 * rol no tiene el permiso requerido.
 */
export async function requireAdminRole(permission?: string): Promise<AuthUser> {
  const session = await requireAdmin();
  if (permission && !hasPermission(session.profile?.rol, permission)) {
    redirect('/admin');
  }
  return session;
}
