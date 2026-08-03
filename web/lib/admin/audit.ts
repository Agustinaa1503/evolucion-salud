/**
 * Registro de eventos de auditoría del BackOffice.
 *
 * Usa la RPC `log_admin_event` (security definer) con el cliente de sesión del
 * administrador autenticado: el actor queda en `auth.uid()`. La escritura en
 * `admin_audit_logs` solo es posible por esta vía (o service_role), y la
 * lectura queda restringida a roles con `admin.logs.read` por RLS.
 */
import { createServerSupabaseClient } from '@/lib/auth/session';

export type AdminAuditEvent = {
  action: 'login' | 'admin_change' | 'publish' | 'settings' | 'export' | 'error';
  category: string;
  targetType?: string | null;
  targetId?: string | null;
  detail?: Record<string, unknown>;
};

export async function logAdminEvent(ev: AdminAuditEvent): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc('log_admin_event', {
      p_action: ev.action,
      p_category: ev.category,
      p_target_type: ev.targetType ?? undefined,
      p_target_id: ev.targetId ?? undefined,
      p_detail: (ev.detail ?? {}) as never,
    });
    return !error;
  } catch {
    return false;
  }
}
