/**
 * Dominio producto (SUBFASE 12.3) — entrada pública.
 *
 * Solo se usa para funciones puras/catálogo client-safe. Las operaciones con
 * storage (assets) viven en server actions de `lib/products/assets.ts` (12.3.2).
 */
export * from './types';
export * from './pricing';
export * from './catalog';
