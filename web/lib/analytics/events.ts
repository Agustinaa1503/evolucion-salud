/**
 * Analytics ligero de Evolución Salud (Iteración 1).
 *
 * Registra eventos de producto (pageviews y conversiones) en la tabla
 * `analytics_events` para alimentar el BackOffice y medir el embudo de venta:
 * pageview → order_created → order_paid → descarga. Sin cookies de terceros:
 * la sesión es un id generado en el cliente (localStorage), los eventos se
 * envían a nuestra propia API.
 *
 * Módulo 100% puro (testeable sin BD).
 */

export type AnalyticsEvent =
  | 'pageview'
  | 'order_created'
  | 'order_paid'
  | 'signup'
  | 'waitlist'
  | 'library_download'
  | 'favorite'
  | 'search';

export const ANALYTICS_EVENTS: readonly AnalyticsEvent[] = [
  'pageview',
  'order_created',
  'order_paid',
  'signup',
  'waitlist',
  'library_download',
  'favorite',
  'search',
];

export type AnalyticsPayload = {
  event: AnalyticsEvent;
  path?: string;
  referrer?: string;
  source?: string;
  sessionId?: string;
  meta?: Record<string, unknown>;
};

export const MAX_LEN = {
  path: 2048,
  referrer: 2048,
  source: 128,
  sessionId: 128,
} as const;

export function isValidEvent(value: unknown): value is AnalyticsEvent {
  return typeof value === 'string' && (ANALYTICS_EVENTS as string[]).includes(value);
}

export function sanitizeString(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  const v = value.trim();
  return v.length > max ? v.slice(0, max) : v;
}

/**
 * Normaliza un payload de analytics: valida el evento, recorta los campos a
 * sus límites y descarta los metadatos no serializables. Devuelve `null` si el
 * evento no es válido.
 */
export function normalizeAnalyticsPayload(input: unknown): AnalyticsPayload | null {
  if (!input || typeof input !== 'object') return null;
  const record = input as Record<string, unknown>;
  const event = record.event;
  if (!isValidEvent(event)) return null;

  const meta =
    record.meta && typeof record.meta === 'object'
      ? (record.meta as Record<string, unknown>)
      : undefined;

  return {
    event,
    path: sanitizeString(record.path, MAX_LEN.path) || undefined,
    referrer: sanitizeString(record.referrer, MAX_LEN.referrer) || undefined,
    source: sanitizeString(record.source, MAX_LEN.source) || undefined,
    sessionId: sanitizeString(record.sessionId, MAX_LEN.sessionId) || undefined,
    meta,
  };
}

/** ¿Está habilitado el tracking? Solo en producción, salvo flag explícito. */
export function analyticsEnabled(env: string, flag?: string): boolean {
  if (flag === 'enabled') return true;
  if (flag === 'disabled') return false;
  return env === 'production';
}

export const SESSION_STORAGE_KEY = 'evolucion-analytics-sid';

export function newSessionId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
