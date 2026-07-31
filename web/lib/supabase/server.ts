import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

/**
 * Cliente de servidor (API routes / webhooks / backoffice).
 * Usa la service_role key: se ejecuta solo en el servidor y evita la RLS.
 * Nunca importar este archivo desde un componente cliente.
 */
export const isServerSupabaseConfigured = Boolean(supabaseUrl && serviceRoleKey);

export function getServerSupabaseClient(): SupabaseClient<Database> | null {
  if (!isServerSupabaseConfigured) return null;
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
