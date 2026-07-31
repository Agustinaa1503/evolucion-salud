import { getServerSupabaseClient } from './supabase/server';
import {
  getMpPayment,
  mpStatusToOrderStatus,
  searchPaymentByExternalReference,
  type MpPayment,
} from './mp/api';

export type OrderRow = {
  id: string;
  email: string;
  customer_name: string;
  items: unknown;
  subtotal: number;
  payment_method: string;
  status: 'pending' | 'paid' | 'failed';
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  mp_status: string | null;
  currency: string;
  paid_at: string | null;
  created_at: string;
};

export type NewOrderInput = {
  email: string;
  customerName: string;
  items: { slug: string; qty: number; price: number }[];
  subtotalUsd: number;
  currency: string;
};

export async function createOrder(
  input: NewOrderInput
): Promise<{ id: string } | null> {
  const sb = getServerSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from('orders')
    .insert({
      email: input.email,
      customer_name: input.customerName,
      items: input.items,
      subtotal: input.subtotalUsd,
      payment_method: 'mercadopago',
      currency: input.currency,
      status: 'pending',
    })
    .select('id')
    .single();
  if (error) return null;
  return { id: data.id };
}

export async function setOrderPreference(orderId: string, preferenceId: string) {
  const sb = getServerSupabaseClient();
  if (!sb) return false;
  const { error } = await sb
    .from('orders')
    .update({ mp_preference_id: preferenceId })
    .eq('id', orderId);
  return !error;
}

export async function getOrder(orderId: string): Promise<OrderRow | null> {
  const sb = getServerSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  if (error || !data) return null;
  return data as unknown as OrderRow;
}

export async function applyPaymentToOrder(
  orderId: string,
  payment: MpPayment
): Promise<OrderRow | null> {
  const status = mpStatusToOrderStatus(payment.status);
  const sb = getServerSupabaseClient();
  if (!sb) return null;

  const patch: {
    mp_payment_id?: string;
    mp_status?: string;
    status?: 'pending' | 'paid' | 'failed';
    paid_at?: string | null;
  } = {
    mp_payment_id: String(payment.id),
    mp_status: payment.status,
    status,
  };
  if (payment.date_approved) patch.paid_at = payment.date_approved;

  const { data, error } = await sb
    .from('orders')
    .update(patch)
    .eq('id', orderId)
    .select('*')
    .single();
  if (error || !data) return null;
  return data as unknown as OrderRow;
}

/**
 * Consulta el pago real en Mercado Pago y sincroniza la orden.
 * Se usa desde el webhook (con payment id) y desde el endpoint de estado
 * (buscando por external_reference) para no depender solo del webhook.
 */
export async function refreshOrderFromMp(
  orderId: string,
  knownPaymentId?: string
): Promise<OrderRow | null> {
  let payment: MpPayment | null = null;
  if (knownPaymentId) {
    payment = await getMpPayment(knownPaymentId).catch(() => null);
  } else {
    payment = await searchPaymentByExternalReference(orderId);
  }
  if (!payment) return getOrder(orderId);

  const order = await getOrder(orderId);
  if (!order) return null;

  if (order.mp_payment_id !== String(payment.id) || order.mp_status !== payment.status) {
    return applyPaymentToOrder(orderId, payment);
  }
  return order;
}

/**
 * Desde el webhook: recibe solo el id de pago, obtiene el pago real en MP,
 * lo liga a la orden por external_reference y actualiza su estado.
 */
export async function refreshOrderFromPaymentId(
  paymentId: string
): Promise<OrderRow | null> {
  const payment = await getMpPayment(paymentId).catch(() => null);
  if (!payment?.external_reference) return null;
  const order = await getOrder(payment.external_reference);
  if (!order) return null;
  if (order.mp_payment_id !== String(payment.id) || order.mp_status !== payment.status) {
    return applyPaymentToOrder(order.id, payment);
  }
  return order;
}
