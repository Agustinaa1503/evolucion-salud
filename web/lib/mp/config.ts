/**
 * Configuración de Mercado Pago (solo servidor).
 * La tasa ARS es pública (se usa para mostrar precios aproximados al cliente);
 * el access token y el secreto del webhook NUNCA se exponen al navegador.
 */

const arsRateRaw = process.env.NEXT_PUBLIC_MP_ARS_RATE ?? '';

export const mpConfig = {
  currency: 'ARS',
  accessToken: process.env.MP_ACCESS_TOKEN ?? '',
  webhookSecret: process.env.MP_WEBHOOK_SECRET ?? '',
  notificationUrl:
    process.env.MP_NOTIFICATION_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '',
  publicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? '',
};

export const isMpConfigured = Boolean(mpConfig.accessToken);

export const arsRate = Number(arsRateRaw) || 0;

export function usdToArs(usd: number): number {
  if (!arsRate) return usd;
  return Math.round(usd * arsRate);
}
