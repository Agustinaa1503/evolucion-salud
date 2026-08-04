/**
 * Tipos del motor de contenido unificado de Evolución Salud (FASE 12).
 *
 * Un solo modelo para todo el contenido del sitio (cursos, blog, podcast,
 * productos, recursos y newsletter). La fuente de verdad son los archivos
 * Markdown de `Contenido/` (cursos se mantienen en `Cursos/`); este módulo
 * define la forma tipada de cada documento (ContentDoc) y los tipos legados
 * que consumen las páginas (BlogPost, Product, Episode, NewsletterEdition),
 * que se mantienen idénticos a los históricos para no romper compatibilidad.
 *
 * Solo se importa desde server components / scripts de build; nunca desde un
 * componente cliente (el parser/registry leen el filesystem).
 */
import type { ContentStatus as TaxonomyStatus } from '@/lib/taxonomy/types';

/** Tipos de contenido soportados por el motor. */
export type ContentKind =
  | 'course'
  | 'blog'
  | 'podcast'
  | 'product'
  | 'newsletter';

/** Estados editoriales (ciclo Borrador → Revisión → Publicado → Archivado). */
export type EditorialStatus = 'draft' | 'review' | 'published' | 'archived';

/** Metadatos SEO/OpenGraph de un documento. */
export type ContentSeo = {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: string;
};

/**
 * Front Matter común a todo documento. El parser valida estos campos con
 * zod (schemas.ts) antes de incorporar el documento al registry; un documento
 * inválido detiene la compilación indicando el archivo afectado.
 */
export type ContentMeta = {
  kind: ContentKind;
  slug: string;
  title: string;
  description?: string;
  status: EditorialStatus;
  /** Idioma del documento (preparación i18n; por defecto `es`). */
  locale?: string;
  /** Mapa locale → slug del documento traducido (preparación i18n). */
  translations?: Record<string, string>;
  /** Versión del documento (la incrementa el CMS al guardar). */
  version?: number;
  versionSummary?: string;
  /** Orden de presentación dentro de su tipo (0 = primero). */
  order?: number;
  /** Slugs de categorías de la taxonomía unificada. */
  categories?: string[];
  /** Tags libres. */
  tags?: string[];
  /** Nivel de la taxonomía. */
  level?: string;
  /** Audiencias de la taxonomía. */
  audience?: string[];
  icon?: string;
  gradient?: string;
  image?: string;
  seo?: ContentSeo;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Documento parseado: metadatos validados + cuerpo Markdown crudo + el
 * front matter original (preserva el orden de los campos para el serializer).
 */
export type ContentDoc = ContentMeta & {
  body: string;
  frontmatter: Record<string, unknown>;
};

/** Mapea el estado editorial a los estados que conoce la taxonomía (FASE 10). */
export const toTaxonomyStatus = (status: EditorialStatus): TaxonomyStatus =>
  status === 'published' ? 'published' : 'draft';

/* -------------------------------------------------------------------------- */
/* Tipos legados (idénticos a los históricos de lib/data)                      */
/* -------------------------------------------------------------------------- */

export type BlogSection = {
  heading?: string;
  paragraphs: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  /** Slugs de categorías de la taxonomía (FASE 10). */
  categories?: string[];
  /** Tags libres (FASE 10). */
  tags?: string[];
  /** Nivel de la taxonomía (FASE 10). */
  level?: string;
  /** Audiencias de la taxonomía (FASE 10). */
  audience?: string[];
  readTime: string;
  icon: string;
  gradient: string;
  image: string;
  sections: BlogSection[];
};

export type Episode = {
  slug: string;
  title: string;
  description: string;
  duration?: string;
  /**
   * Serie a la que pertenece el episodio (Mindfulness o Meditaciones PINE).
   * Usado para agrupar en la página /podcast y elegir la imagen de portada.
   */
  series?: 'mindfulness' | 'meditaciones-pine';
  embedUrl?: string | null;
  spotifyUrl?: string;
  youtubeUrl?: string;
  /** Slugs de categorías de la taxonomía (FASE 10). */
  categories?: string[];
  /** Tags libres (FASE 10). */
  tags?: string[];
  /** Nivel de la taxonomía (FASE 10). */
  level?: string;
  /** Audiencias de la taxonomía (FASE 10). */
  audience?: string[];
  icon: string;
  image: string;
  gradient: string;
};

export type ProductLevel =
  | 'lead-magnet'
  | 'entrada'
  | 'media'
  | 'alta'
  | 'b2b'
  | 'recurrente'
  | 'extra';

/** Tipo de producto: simple, bundle (expande componentes) o membresía. */
export type ProductType = 'simple' | 'bundle' | 'membership';

/** Moneda canónica de un producto (SUBFASE 12.3). El `price` siempre es USD. */
export type ProductCurrency = 'USD' | 'ARS';

/**
 * Formato del contenido de un producto (SUBFASE 12.3).
 * Es distinto de `ProductType` (estructura comercial): describe el tipo de
 * contenido (guía, audio, checklist…) mientras `productType` describe cómo se
 * vende (simple / bundle / membresía).
 */
export type ProductFormat =
  | 'curso'
  | 'ebook'
  | 'pdf'
  | 'guia'
  | 'checklist'
  | 'plantilla'
  | 'audio'
  | 'meditacion'
  | 'podcast'
  | 'recurso'
  | 'workshop'
  | 'clase-en-vivo';

/** Tipo de archivo de un asset descargable (SUBFASE 12.3). */
export type ProductAssetType = 'pdf' | 'audio' | 'video' | 'zip' | 'plantilla' | 'otro';

/**
 * Asset descargable de un producto (metadatos; el objeto físico vive en el
 * bucket privado `product-assets`, SUBFASE 12.3.2).
 */
export type ProductAsset = {
  /** Slug único del asset dentro del producto. */
  slug: string;
  /** Título para el usuario. */
  title: string;
  /** Nombre del archivo subido. */
  fileName: string;
  /** Tipo MIME. */
  mime: string;
  /** Tamaño en bytes. */
  sizeBytes: number;
  type: ProductAssetType;
  /** Versión del asset (incrementa al re-subir). */
  version: number;
  /** Orden de presentación (0 = primero). */
  sortOrder: number;
};

export type Product = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  /** Precio canónico (siempre USD). */
  price: number;
  /** Moneda del `price` (default USD). */
  currency?: ProductCurrency;
  /** Precio de display en ARS (override; si falta se usa la conversión). */
  priceArs?: number;
  /** Tasa de impuestos en % (0-100). Default 0. */
  taxRate?: number;
  /** Código SKU; si falta se deriva del slug (`EVS-<SLUG>`). */
  sku?: string;
  /** Formato del contenido (SUBFASE 12.3). */
  format?: ProductFormat;
  /** Resumen corto para tarjetas y listados. */
  shortDescription?: string;
  /** Autor/a del producto. */
  author?: string;
  /** Duración (audios, workshops, clases). */
  duration?: string;
  /** Imagen de banner (hero). */
  banner?: string;
  /** Galería de imágenes. */
  gallery?: string[];
  /** Slugs de productos relacionados (curaduría). */
  related?: string[];
  /** Assets descargables (metadatos; entrega en 12.5). */
  assets?: ProductAsset[];
  compareAt?: number;
  interval?: 'monthly';
  level: ProductLevel;
  productType: ProductType;
  /** Slugs de componentes (bundle/membresía). Se puebla en FASES 12.3/12.5. */
  components?: string[];
  badge?: string;
  /** Slugs de categorías de la taxonomía (FASE 10). */
  categories?: string[];
  /** Tags libres (FASE 10). */
  tags?: string[];
  /** Audiencias de la taxonomía (FASE 10). */
  audience?: string[];
  features: string[];
  includes: string[];
  icon: string;
  gradient: string;
  image: string;
  recommended?: boolean;
};

export type NewsletterEdition = {
  slug: string;
  title: string;
  description: string;
  date?: string;
  /** Slugs de categorías de la taxonomía (FASE 10). */
  categories?: string[];
  /** Tags libres (FASE 10). */
  tags?: string[];
  /** Nivel de la taxonomía (FASE 10). */
  level?: string;
  /** Audiencias de la taxonomía (FASE 10). */
  audience?: string[];
  status?: TaxonomyStatus;
  icon?: string;
  gradient?: string;
};
