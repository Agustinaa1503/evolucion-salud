import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types';
import { isSupabaseConfigured } from '@/lib/supabase/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Cliente de Supabase del navegador (gestiona cookies de sesión + refresh
 * automático de tokens). Se usa en componentes cliente. Si no hay credenciales
 * configuradas devuelve null y la plataforma opera en modo demo.
 */
export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
