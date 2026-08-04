import { NextResponse } from 'next/server';
import { recordAnalyticsEvent } from '@/lib/analytics/server';
import { normalizeAnalyticsPayload } from '@/lib/analytics/events';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const payload = normalizeAnalyticsPayload(body);
  if (!payload) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ok = await recordAnalyticsEvent(payload);
  return NextResponse.json({ ok });
}
