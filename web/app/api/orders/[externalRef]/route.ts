import { NextResponse } from 'next/server';
import { getOrder, refreshOrderFromMp } from '@/lib/orders';
import { deliverIfPaid } from '@/lib/shop/licenses';

export const dynamic = 'force-dynamic';

/**
 * Estado de una orden para la página de resultado del checkout.
 * Si la orden sigue pendiente, consulta Mercado Pago en vivo para no
 * depender del webhook.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ externalRef: string }> }
) {
  const { externalRef } = await params;

  const stored = await getOrder(externalRef);
  if (!stored) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
  }

  const order =
    stored.status === 'pending' && stored.mp_preference_id
      ? await refreshOrderFromMp(externalRef)
      : stored;

  // Entrega automática: red de seguridad del webhook (idempotente).
  if (order?.status === 'paid') {
    await deliverIfPaid(order).catch(() => null);
  }

  return NextResponse.json({
    orderId: order?.id,
    status: order?.status ?? stored.status,
    mpStatus: order?.mp_status ?? stored.mp_status,
    currency: stored.currency,
    subtotalUsd: Number(stored.subtotal),
    email: stored.email,
  });
}
