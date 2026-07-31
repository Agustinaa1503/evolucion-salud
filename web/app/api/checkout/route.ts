import { NextResponse } from 'next/server';
import { getProduct } from '@/lib/data/products';
import { createCheckoutPreference } from '@/lib/mp/api';
import { isMpConfigured, usdToArs, mpConfig } from '@/lib/mp/config';
import { createOrder, setOrderPreference } from '@/lib/orders';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!isMpConfigured) {
    return NextResponse.json(
      { error: 'MERCADOPAGO_NOT_CONFIGURED' },
      { status: 503 }
    );
  }

  let body: { items?: { slug: string; qty: number }[]; email?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? '';
  const name = body.name?.trim() ?? '';
  const items = Array.isArray(body.items) ? body.items : [];

  if (!EMAIL_RE.test(email) || !name) {
    return NextResponse.json(
      { error: 'Datos de contacto incompletos' },
      { status: 400 }
    );
  }
  if (items.length === 0) {
    return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 });
  }

  const lines = items.flatMap((it) => {
    const product = getProduct(it.slug);
    const qty = Math.max(1, Math.min(99, Number(it.qty) || 1));
    if (!product || product.price <= 0) return [];
    return [{ product, qty }];
  });

  if (lines.length === 0) {
    return NextResponse.json(
      { error: 'No hay productos válidos para pagar' },
      { status: 400 }
    );
  }

  const subtotalUsd = lines.reduce((acc, l) => acc + l.product.price * l.qty, 0);
  const subtotalArs = usdToArs(subtotalUsd);

  const order = await createOrder({
    email,
    customerName: name,
    items: lines.map((l) => ({ slug: l.product.slug, qty: l.qty, price: l.product.price })),
    subtotalUsd,
    currency: mpConfig.currency,
  });
  if (!order) {
    return NextResponse.json(
      { error: 'No se pudo crear la orden' },
      { status: 500 }
    );
  }

  try {
    const { preference, initPoint } = await createCheckoutPreference({
      externalReference: order.id,
      currency: mpConfig.currency,
      items: lines.map((l) => ({
        id: l.product.slug,
        title: l.product.title,
        quantity: l.qty,
        unit_price: usdToArs(l.product.price * l.qty) / l.qty,
      })),
      buyerEmail: email,
      buyerName: name,
      successUrl: `${appUrl}/checkout/resultado?estado=success`,
      pendingUrl: `${appUrl}/checkout/resultado?estado=pending`,
      failureUrl: `${appUrl}/checkout/resultado?estado=failure`,
    });

    await setOrderPreference(order.id, preference.id);

    return NextResponse.json({
      orderId: order.id,
      initPoint,
      totals: {
        usd: subtotalUsd,
        ars: subtotalArs,
        currency: mpConfig.currency,
        rate: usdToArs(1),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al crear el pago' },
      { status: 502 }
    );
  }
}
