import { createHmac, timingSafeEqual } from 'node:crypto';
import { mpConfig } from './config';

const MP_API = 'https://api.mercadopago.com';

export type MpPreferenceItem = {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
};

export type MpPreference = {
  id: string;
  init_point: string;
  sandbox_init_point: string;
};

export type MpPayment = {
  id: number;
  status: string;
  status_detail: string;
  external_reference?: string | null;
  date_approved?: string | null;
};

function headers(token: string, extra?: Record<string, string>) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Idempotency-Key': crypto.randomUUID(),
    ...extra,
  };
}

function resolveInitPoint(pref: MpPreference, sandbox: boolean): string {
  const point = sandbox ? pref.sandbox_init_point : pref.init_point;
  return point || pref.init_point;
}

export async function createCheckoutPreference(input: {
  externalReference: string;
  items: MpPreferenceItem[];
  currency: string;
  buyerEmail: string;
  buyerName: string;
  successUrl: string;
  pendingUrl: string;
  failureUrl: string;
}): Promise<{ preference: MpPreference; initPoint: string }> {
  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: headers(mpConfig.accessToken),
    body: JSON.stringify({
      external_reference: input.externalReference,
      items: input.items.map((i) => ({
        id: i.id,
        title: i.title,
        quantity: i.quantity,
        unit_price: i.unit_price,
        currency_id: input.currency,
      })),
      payer: { email: input.buyerEmail, name: input.buyerName },
      back_urls: {
        success: input.successUrl,
        pending: input.pendingUrl,
        failure: input.failureUrl,
      },
      auto_return: 'approved',
      statement_descriptor: 'Evolucion Salud',
      ...(mpConfig.notificationUrl && !mpConfig.notificationUrl.includes('localhost')
        ? { notification_url: mpConfig.notificationUrl }
        : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MP create_preference ${res.status}: ${body.slice(0, 300)}`);
  }

  const preference = (await res.json()) as MpPreference;
  const sandbox = mpConfig.accessToken.startsWith('TEST-');
  return { preference, initPoint: resolveInitPoint(preference, sandbox) };
}

export async function getMpPayment(paymentId: number | string): Promise<MpPayment> {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: headers(mpConfig.accessToken),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MP get_payment ${res.status}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as MpPayment;
}

export async function searchPaymentByExternalReference(
  externalReference: string
): Promise<MpPayment | null> {
  const url = `${MP_API}/v1/payments/search?external_reference=${encodeURIComponent(
    externalReference
  )}&sort=date_created&criteria=desc&limit=1`;
  const res = await fetch(url, { headers: headers(mpConfig.accessToken) });
  if (!res.ok) return null;
  const data = (await res.json()) as { results: MpPayment[] };
  return data.results?.[0] ?? null;
}

export function mpStatusToOrderStatus(mpStatus: string): 'paid' | 'pending' | 'failed' {
  switch (mpStatus) {
    case 'approved':
      return 'paid';
    case 'rejected':
    case 'cancelled':
    case 'refunded':
    case 'charged_back':
      return 'failed';
    default:
      return 'pending';
  }
}

/**
 * Verifica la firma del webhook de Mercado Pago (headers x-signature /
 * x-request-id). Si no hay secreto configurado, acepta (dev) y queda claro
 * que en producción hay que setear MP_WEBHOOK_SECRET.
 */
export function verifyWebhookSignature(
  body: Record<string, unknown>,
  xSignature: string | null,
  xRequestId: string | null
): boolean {
  if (!mpConfig.webhookSecret) return true;
  if (!xSignature || !xRequestId) return false;

  const parts = Object.fromEntries(
    xSignature.split(',').map((kv) => {
      const [k, ...rest] = kv.split('=');
      return [k.trim(), rest.join('=').trim()];
    })
  );
  const ts = parts['ts'];
  const v1 = parts['v1'];
  if (!ts || !v1) return false;

  const dataId = String(body?.data && typeof body.data === 'object' ? (body.data as { id?: string }).id ?? '' : '');
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts}`;
  const hmac = createHmac('sha256', mpConfig.webhookSecret)
    .update(manifest)
    .digest('hex');

  try {
    const a = Buffer.from(hmac, 'hex');
    const b = Buffer.from(v1, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
