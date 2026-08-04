/**
 * Pricing de productos (SUBFASE 12.3).
 *
 * Funciones puras, sin dependencias del entorno ni del filesystem, testeadas
 * con Vitest. Regla de precios:
 *  - `price` es SIEMPRE el precio canónico en USD (compat con el checkout actual).
 *  - `currency` indica la moneda de presentación preferida (default USD).
 *  - `priceArs` es un override directo en ARS; si falta, se usa la conversión
 *    con la tasa `arsRate` (solo display).
 *  - `taxRate` es un porcentaje (0-100) que se aplica para cálculo de display.
 *  - `sku` se auto-deriva del slug (`EVS-<SLUG>`) si no está definido.
 */
import type { Product, ProductCurrency } from '@/lib/content/types';

export const DEFAULT_CURRENCY: ProductCurrency = 'USD';
export const SKU_PREFIX = 'EVS-';

export type PricingOptions = {
  /** Moneda de presentación. Default: la moneda del producto. */
  currency?: ProductCurrency;
  /** Tasa ARS para conversión de display (se ignora si hay override). */
  arsRate?: number;
};

export type EffectivePrice = {
  amount: number;
  currency: ProductCurrency;
};

/** Moneda canónica del producto (default USD). */
export const productCurrency = (product: Product): ProductCurrency =>
  product.currency === 'ARS' ? 'ARS' : DEFAULT_CURRENCY;

/** ¿Es un producto gratuito? */
export const isFree = (product: Product): boolean => product.price === 0;

/** Precio canónico en USD. */
export const priceUsd = (product: Product): number => product.price;

/** Tasa de impuestos en porcentaje (0-100). */
export const taxRatePct = (product: Product): number => product.taxRate ?? 0;

/** Precio USD con impuestos aplicados (display). */
export const priceWithTaxUsd = (product: Product): number =>
  round2(priceUsd(product) * (1 + taxRatePct(product) / 100));

/** Convierte un monto USD a ARS con la tasa dada (redondeo entero). */
export function usdToArsAmount(usd: number, arsRate: number): number {
  if (!arsRate || arsRate <= 0) return 0;
  return Math.round(usd * arsRate);
}

/** Override de precio en ARS, si está definido. */
export const priceArsOverride = (product: Product): number | undefined =>
  product.priceArs;

/** Precio en ARS: override si existe; si no, conversión con la tasa. */
export function priceInArs(product: Product, arsRate: number): number {
  const override = priceArsOverride(product);
  if (override !== undefined) return override;
  return usdToArsAmount(priceUsd(product), arsRate);
}

/**
 * Precio efectivo en la moneda pedida. Si se pide ARS pero no hay override ni
 * tasa, cae a USD (evita mostrar "ARS 0").
 */
export function effectivePrice(
  product: Product,
  options: PricingOptions = {}
): EffectivePrice {
  const currency = options.currency ?? productCurrency(product);
  if (currency === 'ARS') {
    const override = priceArsOverride(product);
    const rate = options.arsRate ?? 0;
    if (override !== undefined || rate > 0) {
      return { amount: priceInArs(product, rate), currency: 'ARS' };
    }
  }
  return { amount: priceUsd(product), currency: 'USD' };
}

/** Deriva un SKU a partir del slug del producto (`EVS-<SLUG>`). */
export function deriveSku(slug: string): string {
  const clean = slug
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${SKU_PREFIX}${clean}`;
}

/** SKU efectivo del producto (definido o derivado). */
export const productSku = (product: Product): string =>
  product.sku ?? deriveSku(product.slug);

/** Etiqueta de precio para display («Gratis», «USD 19.00», «ARS 5.000», «/ mes»). */
export function priceLabel(
  product: Product,
  options: PricingOptions = {}
): string {
  if (isFree(product)) return 'Gratis';
  const { amount, currency } = effectivePrice(product, options);
  const base =
    currency === 'ARS'
      ? new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
          maximumFractionDigits: 0,
        }).format(amount)
      : `USD ${amount.toFixed(2)}`;
  return product.interval === 'monthly' ? `${base} / mes` : base;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
