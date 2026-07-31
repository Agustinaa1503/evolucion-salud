'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Chrome } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { createBrowserSupabaseClient } from '@/lib/auth/client';
import { isProviderEnabled } from '@/lib/auth/config';

const PROVIDERS = [
  { id: 'google' as const, label: 'Google', Icon: Chrome },
  { id: 'github' as const, label: 'GitHub', Icon: null },
  { id: 'facebook' as const, label: 'Facebook', Icon: null },
];

export default function OAuthButtons() {
  const { demoMode } = useAuth();
  const searchParams = useSearchParams();

  const available = PROVIDERS.filter((p) => isProviderEnabled(p.id));
  if (available.length === 0) return null;

  async function handleProvider(provider: 'google' | 'github' | 'facebook') {
    if (demoMode) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const next = searchParams.get('next') ?? '/profile';
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}${next}` },
    });
  }

  return (
    <div className="grid gap-3">
      {available.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => void handleProvider(id)}
          className="btn-outline w-full"
          aria-label={`Continuar con ${label}`}
        >
          {Icon ? (
            <Icon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <span className="flex h-4 w-4 items-center justify-center text-[10px] font-extrabold uppercase">
              {id.slice(0, 1)}
            </span>
          )}
          Continuar con {label}
        </button>
      ))}
      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          o con email
        </span>
        <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
      </div>
    </div>
  );
}
