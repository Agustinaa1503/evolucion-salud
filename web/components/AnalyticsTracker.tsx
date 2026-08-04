'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analyticsEnabled, SESSION_STORAGE_KEY, newSessionId } from '@/lib/analytics/events';

type TrackFn = (payload: {
  event: string;
  path?: string;
  referrer?: string;
  source?: string;
  sessionId?: string;
  meta?: Record<string, unknown>;
}) => void;

export type AnalyticsTrackerProps = {
  enabled?: boolean;
  source?: string;
};

const getSessionId = (): string => {
  try {
    let id = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = newSessionId();
      window.localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return newSessionId();
  }
};

/** Punto de envío compartido (también lo usan acciones de cliente si lo importan). */
export const sendAnalyticsEvent: TrackFn = (payload) => {
  const enabled =
    typeof window !== 'undefined' &&
    analyticsEnabled(process.env.NODE_ENV ?? '', process.env.NEXT_PUBLIC_ANALYTICS);
  if (!enabled) return;
  try {
    void fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        ...payload,
        sessionId: payload.sessionId ?? getSessionId(),
        referrer: (payload.referrer ?? document.referrer) || undefined,
      }),
    });
  } catch {
    /* sin tracking */
  }
};

/**
 * Tracker global: registra un pageview por ruta. Se monta una vez en el layout
 * raíz y escucha los cambios de ruta del router de Next.
 */
export default function AnalyticsTracker({ enabled, source }: AnalyticsTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (enabled === false) return;
    if (typeof window === 'undefined') return;
    if (!analyticsEnabled(process.env.NODE_ENV ?? '', process.env.NEXT_PUBLIC_ANALYTICS)) return;

    const path = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
    if (lastPath.current === path) return;
    lastPath.current = path;

    sendAnalyticsEvent({ event: 'pageview', path, source });
  }, [pathname, searchParams, enabled, source]);

  return null;
}
