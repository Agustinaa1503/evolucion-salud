/**
 * Taxonomía unificada de Evolución Salud (FASE 10).
 *
 * Un solo sistema de clasificación para todos los tipos de contenido:
 * cursos, blog, podcast, recursos (PDF/ebooks/guias/checklists), newsletter
 * y futuros productos digitales. Nada de filtros hardcodeados en
 * componentes: todo se deriva de estos datos.
 */

/** Tipos de contenido soportados por la taxonomía. */
export type ContentType =
  | 'course'
  | 'blog'
  | 'podcast'
  | 'resource'
  | 'newsletter';

/** Estados posibles de un contenido. */
export type ContentStatus =
  | 'published'
  | 'in-development'
  | 'upcoming'
  | 'draft';

/** Categoría del catálogo fijo. */
export type Category = {
  slug: string;
  name: string;
  description?: string;
  /** Grupo para organizar el índice de categorías (dato, no código). */
  group: string;
};

/** Tag libre (no hay lista fija; se deriva del contenido). */
export type Tag = {
  slug: string;
  name: string;
};

/** Nivel de formación. */
export type Level = {
  slug: string;
  name: string;
  sortOrder: number;
};

/** Audiencia objetivo. */
export type Audience = {
  slug: string;
  name: string;
};

/**
 * Ítem unificado de contenido. Cualquier recurso del sitio (curso, artículo,
 * episodio, descargable, edición de newsletter) se expresa con esta forma
 * para poder clasificarse, filtrarse y recomendarse igual.
 */
export type TaxonomyItem = {
  /** `id` estable = `${contentType}:${slug}` (clave de las páginas de tags). */
  id: string;
  contentType: ContentType;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  /** URL pública del ítem. */
  url: string;
  /** Slugs de categorías del catálogo fijo. */
  categories: string[];
  /** Tags libres normalizados a slug. */
  tags: string[];
  /** Slug del nivel (si aplica). */
  level?: string;
  /** Slugs de audiencias. */
  audience: string[];
  status: ContentStatus;
  /** Subclasificación propia del tipo (free/paid/upcoming, product level, etc.). */
  subtype: string;
  featured?: boolean;
  date?: string;
  icon?: string;
  gradient?: string;
  image?: string;
  /** Referencia al dato original (Course, BlogPost, Episode, Product). */
  data: unknown;
};

/** Opciones de filtrado del catálogo unificado. */
export type CatalogFilters = {
  category?: string;
  level?: string;
  audience?: string;
  type?: ContentType | 'all';
  status?: ContentStatus | 'all';
  query?: string;
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  course: 'Cursos',
  blog: 'Blog',
  podcast: 'Podcast',
  resource: 'Recursos',
  newsletter: 'Newsletter',
};

/** Normaliza un tag a slug seguro para URLs. */
export const slugifyTag = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-+/g, '-');

/** Normaliza una categoría/nombre a slug. */
export const slugify = (value: string): string => slugifyTag(value);
