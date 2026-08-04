/**
 * Catálogo de productos de Evolución Salud (puente).
 *
 * Los productos viven en `Contenido/product/` (motor unificado FASE 12) y su
 * copia compilada en `generated/products.ts`. Este módulo re-exporta los datos y los
 * tipos, y mantiene `levelLabel` (etiqueta legible del nivel, configuración
 * de presentación, no contenido).
 */
import type { Product, ProductLevel } from '@/lib/content/types';

export {
  featuredProducts,
  getProduct,
  products,
} from './generated/products';

export type { Product, ProductLevel };

export const levelLabel: Record<ProductLevel, string> = {
  'lead-magnet': 'Gratis',
  entrada: 'Entrada',
  media: 'Media',
  alta: 'Alta',
  b2b: 'Profesionales',
  recurrente: 'Recurrente',
  extra: 'Extra',
};

export { formatLabel } from '@/lib/products/types';
export { priceLabel, productSku } from '@/lib/products/pricing';
