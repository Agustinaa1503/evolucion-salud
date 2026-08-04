/**
 * Catálogo de productos (SUBFASE 12.3).
 *
 * Resuelve consultas de catálogo sobre la copia compilada (`generated/`), que
 * es segura para client components (sin filesystem). No conoce el CMS ni los
 * pagos: `getProductBySlug` y las consultas por formato/nivel alimentan la
 * tienda, el buscador y la biblioteca (12.5).
 */
import type {
  Product,
  ProductFormat,
  ProductLevel,
  ProductType,
} from '@/lib/content/types';
import { getProduct, products } from '@/lib/data/products';

/** Todos los productos públicos (solo `published` ya en `generated/`). */
export const getPublicProducts = (): Product[] => products;

/** Busca un producto por slug. */
export const getProductBySlug = (slug: string): Product | undefined =>
  getProduct(slug);

/** Productos de un formato dado (guía, audio, checklist…). */
export function productsByFormat(format: ProductFormat): Product[] {
  return products.filter((p) => p.format === format);
}

/** Productos de un nivel de la escalera. */
export function productsByLevel(level: ProductLevel): Product[] {
  return products.filter((p) => p.level === level);
}

/** Productos de un tipo comercial (simple/bundle/membership). */
export function productsByProductType(productType: ProductType): Product[] {
  return products.filter((p) => p.productType === productType);
}

/**
 * Productos relacionados: primero la curaduría explícita del front matter
 * (`related`); si no hay, fallback por afinidad (mismo nivel y luego misma
 * categoría). Nunca devuelve el propio producto.
 */
export function relatedProducts(product: Product, limit = 3): Product[] {
  const curated = (product.related ?? [])
    .map(getProductBySlug)
    .filter((p): p is Product => p !== undefined && p.slug !== product.slug);
  if (curated.length > 0) return curated.slice(0, limit);

  const sameLevel = products.filter(
    (p) => p.slug !== product.slug && p.level === product.level
  );
  const productCategories = product.categories ?? [];
  const sameCategory = products.filter(
    (p) =>
      p.slug !== product.slug &&
      p.level !== product.level &&
      (p.categories ?? []).some((c) => productCategories.includes(c))
  );
  return [...sameLevel, ...sameCategory].slice(0, limit);
}
