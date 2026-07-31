import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/mp/api';
import { isMpConfigured } from '@/lib/mp/config';
import { refreshOrderFromPaymentId } from '@/lib/orders';

export const dynamic = 'force-dynamic';

/**
 * Webhook de Mercado Pago. Recibe notificaciones de pago y sincroniza la
 * orden en Supabase. Devuelve 200 rápido; la confirmación real se hace
 * consultando la API de MP (nunca se confía en el payload).
 */
export async function POST(request: Request) {
  if (!isMpConfigured) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');

  if (!verifyWebhookSignature(body, xSignature, xRequestId)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const type = body.type ?? body.action ?? '';
  const data = (body.data ?? {}) as { id?: number | string };

  if (type === 'payment' && data.id) {
    await refreshOrderFromPaymentId(String(data.id)).catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
