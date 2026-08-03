/**
 * Acceso a datos del BackOffice.
 *
 * Todo el BackOffice consulta con el cliente service_role (los datos de
 * terceros no son visibles para el propio usuario por RLS); el guard de rol
 * corre ANTES en el layout/página. Si Supabase no está configurado, devuelve
 * valores vacíos para que las páginas rendericen en modo demo.
 */
import { getServerSupabaseClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

export type AdminTable =
  | 'profiles'
  | 'newsletter_subscribers'
  | 'course_waitlist'
  | 'certificates'
  | 'user_quiz_attempts'
  | 'courses'
  | 'user_courses'
  | 'admin_audit_logs'
  | 'roles';

export const adminDb = (): SupabaseClient<Database> | null => {
  if (!isServerSupabaseConfigured) return null;
  return getServerSupabaseClient();
};

export async function countWhere(
  sb: SupabaseClient<Database> | null,
  table: AdminTable,
  column?: string,
  value?: unknown
): Promise<number> {
  if (!sb) return 0;
  // El acceso dinámico a tablas con `column`/`value` escapa al tipado estático
  // de Postgrest; se resuelve en runtime con el cliente service_role.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = sb.from(table).select('*', { count: 'exact', head: true });
  const query = column && value !== undefined ? builder.eq(column, value) : builder;
  const { count } = await query;
  return count ?? 0;
}

/** Agrupa fechas ISO en buckets de N días terminando hoy (para gráficos). */
export function bucketByDay(isoDates: string[], days: number): { label: string; value: number }[] {
  const buckets: { label: string; start: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    buckets.push({
      label: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
      start: d.getTime(),
    });
  }
  const values = buckets.map(() => 0);
  for (const iso of isoDates) {
    const t = new Date(iso).getTime();
    for (let i = 0; i < buckets.length; i++) {
      if (t >= buckets[i].start && (i === buckets.length - 1 || t < buckets[i + 1].start)) {
        values[i] += 1;
        break;
      }
    }
  }
  return buckets.map((b, i) => ({ label: b.label, value: values[i] }));
}

/** Agrupa fechas ISO en buckets semanales (últimas N semanas, lunes a lunes). */
export function bucketByWeek(isoDates: string[], weeks: number): { label: string; value: number }[] {
  const buckets: { label: string; start: number; end: number }[] = [];
  const now = new Date();
  const currentMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = (currentMonday.getDay() + 6) % 7;
  currentMonday.setDate(currentMonday.getDate() - dow);
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(currentMonday);
    start.setDate(currentMonday.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    buckets.push({
      label: start.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
      start: start.getTime(),
      end: end.getTime(),
    });
  }
  const values = buckets.map(() => 0);
  for (const iso of isoDates) {
    const t = new Date(iso).getTime();
    for (let i = 0; i < buckets.length; i++) {
      if (t >= buckets[i].start && t < buckets[i].end) {
        values[i] += 1;
        break;
      }
    }
  }
  return buckets.map((b, i) => ({ label: b.label, value: values[i] }));
}
