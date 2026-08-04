/**
 * Validación estricta del Front Matter de los documentos de contenido.
 *
 * Cada documento se valida con zod ANTES de incorporarse al registry. Si un
 * campo obligatorio falta o tiene un tipo incorrecto, se lanza un error que
 * indica el archivo afectado y detiene la compilación (el contenido no se
 * admite parcialmente válido).
 */
import { z } from 'zod';
import type { ContentKind } from './types';

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const seoSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
    ogType: z.string().optional(),
  })
  .optional();

/** Campos transversales comunes a todos los documentos. */
const baseSchema = z.object({
  kind: z.string(),
  slug: z
    .string()
    .regex(SLUG_RE, 'slug inválido (solo minúsculas, números y guiones)'),
  title: z.string().min(1, 'title es obligatorio'),
  description: z.string().optional(),
  status: z.enum(['draft', 'review', 'published', 'archived']),
  locale: z.string().default('es'),
  translations: z.record(z.string(), z.string()).optional(),
  version: z.number().int().min(1).optional(),
  versionSummary: z.string().optional(),
  order: z.number().int().min(0).optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  level: z.string().optional(),
  audience: z.array(z.string()).optional(),
  icon: z.string().optional(),
  gradient: z.string().optional(),
  image: z.string().optional(),
  seo: seoSchema,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const PRODUCT_LEVELS = [
  'lead-magnet',
  'entrada',
  'media',
  'alta',
  'b2b',
  'recurrente',
  'extra',
] as const;

/** Formatos de contenido de producto (SUBFASE 12.3). */
export const PRODUCT_FORMATS = [
  'curso',
  'ebook',
  'pdf',
  'guia',
  'checklist',
  'plantilla',
  'audio',
  'meditacion',
  'podcast',
  'recurso',
  'workshop',
  'clase-en-vivo',
] as const;

/** Tipos de archivo de un asset descargable (SUBFASE 12.3). */
export const PRODUCT_ASSET_TYPES = [
  'pdf',
  'audio',
  'video',
  'zip',
  'plantilla',
  'otro',
] as const;

/** Monedas soportadas (SUBFASE 12.3). */
export const PRODUCT_CURRENCIES = ['USD', 'ARS'] as const;

const blogSchema = baseSchema.extend({
  kind: z.literal('blog'),
  excerpt: z.string().min(1, 'excerpt es obligatorio'),
  date: z.string().min(1, 'date es obligatorio'),
  category: z.string().min(1, 'category es obligatorio'),
  readTime: z.string().min(1, 'readTime es obligatorio'),
});

const podcastSchema = baseSchema.extend({
  kind: z.literal('podcast'),
  description: z.string().min(1, 'description es obligatorio'),
  duration: z.string().optional(),
  series: z.enum(['mindfulness', 'meditaciones-pine']).optional(),
  embedUrl: z.string().nullable().optional(),
  spotifyUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
});

const productAssetSchema = z.object({
  slug: z.string().min(1, 'asset.slug es obligatorio'),
  title: z.string().min(1, 'asset.title es obligatorio'),
  fileName: z.string().min(1, 'asset.fileName es obligatorio'),
  mime: z.string().min(1, 'asset.mime es obligatorio'),
  sizeBytes: z.number().nonnegative('asset.sizeBytes no puede ser negativo'),
  type: z.enum(PRODUCT_ASSET_TYPES, {
    invalid_type_error: 'asset.type no es un tipo de asset válido',
  }),
  version: z.number().int().min(1).default(1),
  sortOrder: z.number().int().min(0).default(0),
});

const productSchema = baseSchema.extend({
  kind: z.literal('product'),
  subtitle: z.string().min(1, 'subtitle es obligatorio'),
  price: z
    .number({ invalid_type_error: 'price debe ser un número' })
    .nonnegative('price no puede ser negativo'),
  currency: z.enum(PRODUCT_CURRENCIES).default('USD'),
  priceArs: z.number().nonnegative('priceArs no puede ser negativo').optional(),
  taxRate: z
    .number()
    .min(0, 'taxRate no puede ser menor a 0')
    .max(100, 'taxRate no puede superar 100')
    .default(0),
  sku: z.string().optional(),
  format: z.enum(PRODUCT_FORMATS, {
    invalid_type_error: 'format no es un formato de producto válido',
  }).optional(),
  shortDescription: z.string().optional(),
  author: z.string().optional(),
  duration: z.string().optional(),
  banner: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  related: z.array(z.string()).optional(),
  assets: z.array(productAssetSchema).optional(),
  compareAt: z.number().optional(),
  interval: z.enum(['monthly']).optional(),
  level: z.enum(PRODUCT_LEVELS, {
    invalid_type_error: 'level no es un nivel válido de producto',
  }),
  productType: z.enum(['simple', 'bundle', 'membership']).default('simple'),
  components: z.array(z.string()).optional(),
  badge: z.string().optional(),
  recommended: z.boolean().optional(),
  features: z.array(z.string()).default([]),
  includes: z.array(z.string()).default([]),
});

const newsletterSchema = baseSchema.extend({
  kind: z.literal('newsletter'),
  description: z.string().min(1, 'description es obligatorio'),
  date: z.string().optional(),
});

const SCHEMAS: Record<Exclude<ContentKind, 'course'>, z.ZodType<unknown>> = {
  blog: blogSchema,
  podcast: podcastSchema,
  product: productSchema,
  newsletter: newsletterSchema,
};

/**
 * Valida el front matter de un documento. Lanza un error con el archivo
 * afectado y la lista de problemas si el documento no es válido.
 */
export function validateFrontmatter(
  kind: Exclude<ContentKind, 'course'>,
  data: Record<string, unknown>,
  filePath: string
): Record<string, unknown> {
  const schema = SCHEMAS[kind];
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.') || '(raíz)'}: ${i.message}`)
      .join('; ');
    throw new Error(`[Contenido inválido] ${filePath} — ${issues}`);
  }
  return result.data as Record<string, unknown>;
}
