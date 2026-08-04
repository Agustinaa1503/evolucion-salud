/**
 * Analytics — capa de servidor. Inserta eventos en `analytics_events` con el
 * cliente service_role (los eventos de conversión también pueden venir de
 * server actions / webhooks). Nunca lanza: falla en silencio para no romper el
 * flujo de compra.
 */
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { normalizeAnalyticsPayload, type AnalyticsPayload } from './events';

export type RecordEventInput = {
  event: AnalyticsPayload['event'];
  path?: string;
  source?: string;
  sessionId?: string;
  userId?: string;
  meta?: Record<string, unknown>;
};

export async function recordAnalyticsEvent(input: RecordEventInput): Promise<boolean> {
  const sb = getServerSupabaseClient();
  if (!sb) return false;
  try {
    const payload = normalizeAnalyticsPayload(input);
    if (!payload) return false;
    const { error } = await sb.from('analytics_events').insert({
      event: payload.event,
      path: payload.path ?? null,
      referrer: payload.referrer ?? null,
      source: payload.source ?? null,
      ua: null,
      session_id: payload.sessionId ?? null,
      user_id: input.userId ?? null,
      meta: (payload.meta as Record<string, never>) ?? {},
    });
    return !error;
  } catch {
    return false;
  }
}

/** Conveniencia: registra un evento en fire-and-forget (no espera). */
export function trackLater(input: RecordEventInput): void {
  void recordAnalyticsEvent(input);
}
