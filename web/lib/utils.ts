export function formatPrice(
  price: number,
  interval?: 'monthly' | 'one-time'
): string {
  if (price === 0) return 'Gratis';
  const base = `USD ${price.toFixed(2)}`;
  return interval === 'monthly' ? `${base} / mes` : base;
}

export function getArsRate(): number {
  const n = Number(process.env.NEXT_PUBLIC_MP_ARS_RATE);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function usdToArsDisplay(usd: number): number {
  const rate = getArsRate();
  return rate ? Math.round(usd * rate) : 0;
}

export function formatARS(ars: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(ars);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
