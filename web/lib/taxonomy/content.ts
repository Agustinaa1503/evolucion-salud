/**
 * Agregación de todo el contenido de Evolución Salud a la taxonomía unificada.
 *
 * Cursos (Cursos/*.md → registry), artículos del blog, episodios del podcast,
 * recursos de la tienda (PDF, ebooks, guías, checklists, plantillas) y
 * ediciones de newsletter se expresan como `TaxonomyItem`. Este módulo es la
 * base de las páginas /categorias, /tags y /biblioteca, y de las
 * recomendaciones por afinidad.
 *
 * IMPORTANTE: solo usarlo en server components / build (el registry de cursos
 * lee el filesystem).
 */
import { getAllCourses } from '@/lib/courses/registry';
import type { Course } from '@/lib/courses/types';
import { blogPosts, type BlogPost } from '@/lib/data/blog';
import { podcast, type Episode } from '@/lib/data/podcast';
import { products, type Product } from '@/lib/data/products';
import { newsletterEditions, type NewsletterEdition } from '@/lib/data/newsletter';
import {
  slugify,
  slugifyTag,
  type CatalogFilters,
  type ContentStatus,
  type ContentType,
  type TaxonomyItem,
} from './types';
import { getAllCategories, getCategory } from './categories';
import { getAllAudiences, getAllLevels, getLevel } from './levels-audiences';

const isDefined = <T>(x: T | undefined): x is T => x !== undefined;

/* -------------------------------------------------------------------------- */
/* Conversión de cada tipo de contenido a TaxonomyItem                        */
/* -------------------------------------------------------------------------- */

function courseToItem(course: Course): TaxonomyItem {
  const levelSlug = getLevel(slugify(course.difficulty ?? course.level ?? ''))?.slug;
  return {
    id: `course:${course.slug}`,
    contentType: 'course',
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    description: course.description,
    url: `/cursos/${course.slug}`,
    categories: [slugify(course.category), ...(course.tags ?? [])]
      .map((s) => (getCategory(s) ? s : undefined))
      .filter(isDefined),
    tags: (course.tags ?? []).map(slugifyTag),
    level: levelSlug,
    audience: audienceLabelsToSlugs(course.audience),
    status: course.status === 'in-development' ? 'in-development' : course.type === 'upcoming' ? 'upcoming' : 'published',
    subtype: course.type,
    featured: course.featured,
    date: course.createdAt,
    icon: course.icon,
    gradient: course.gradient,
    image: course.thumbnail,
    data: course,
  };
}

function blogToItem(post: BlogPost): TaxonomyItem {
  return {
    id: `blog:${post.slug}`,
    contentType: 'blog',
    slug: post.slug,
    title: post.title,
    description: post.excerpt,
    url: `/blog/${post.slug}`,
    categories: post.categories ?? [],
    tags: (post.tags ?? []).map(slugifyTag),
    level: post.level,
    audience: audienceLabelsToSlugs(post.audience ?? []),
    status: 'published',
    subtype: 'blog',
    date: post.date,
    icon: post.icon,
    gradient: post.gradient,
    image: post.image,
    data: post,
  };
}

function episodeToItem(episode: Episode): TaxonomyItem {
  return {
    id: `podcast:${episode.slug}`,
    contentType: 'podcast',
    slug: episode.slug,
    title: episode.title,
    description: episode.description,
    url: `/podcast#${episode.slug}`,
    categories: episode.categories ?? [],
    tags: (episode.tags ?? []).map(slugifyTag),
    level: episode.level,
    audience: audienceLabelsToSlugs(episode.audience ?? []),
    status: 'published',
    subtype: 'episode',
    icon: episode.icon,
    gradient: episode.gradient,
    image: episode.image,
    data: episode,
  };
}

function productToItem(product: Product): TaxonomyItem {
  const levelSlug = getLevel(slugify(product.level))?.slug;
  return {
    id: `resource:${product.slug}`,
    contentType: 'resource',
    slug: product.slug,
    title: product.title,
    subtitle: product.subtitle,
    description: product.description,
    url: `/tienda/${product.slug}`,
    categories: product.categories ?? [],
    tags: (product.tags ?? []).map(slugifyTag),
    level: levelSlug,
    audience: audienceLabelsToSlugs(product.audience ?? []),
    status: 'published',
    subtype: product.level,
    featured: product.recommended,
    icon: product.icon,
    gradient: product.gradient,
    image: product.image,
    data: product,
  };
}

function newsletterToItem(edition: NewsletterEdition): TaxonomyItem {
  return {
    id: `newsletter:${edition.slug}`,
    contentType: 'newsletter',
    slug: edition.slug,
    title: edition.title,
    description: edition.description,
    url: `/newsletter`,
    categories: edition.categories ?? [],
    tags: (edition.tags ?? []).map(slugifyTag),
    level: edition.level,
    audience: audienceLabelsToSlugs(edition.audience ?? []),
    status: edition.status ?? 'published',
    subtype: 'edition',
    date: edition.date,
    icon: edition.icon,
    gradient: edition.gradient,
    data: edition,
  };
}

/** Mapea etiquetas de audiencia (texto libre) a slugs canónicos. */
const AUDIENCE_ALIASES: Record<string, string[]> = {
  'publico general': ['publico-general'],
  'publico': ['publico-general'],
  'todo publico': ['publico-general'],
  'profesionales de la salud': ['profesionales-de-la-salud'],
  'profesionales': ['profesionales-de-la-salud'],
  'profesionales de salud': ['profesionales-de-la-salud'],
  'psicologos': ['psicologos'],
  'psicologos y neuropsicologos': ['psicologos'],
  'medicos': ['medicos'],
  'nutricionistas': ['nutricionistas'],
  'coaches': ['coaches'],
  'docentes': ['docentes'],
  'empresas': ['empresas'],
};

export function audienceLabelsToSlugs(labels: string[]): string[] {
  const result = new Set<string>();
  for (const label of labels) {
    const key = slugify(label);
    const mapped = AUDIENCE_ALIASES[key];
    if (mapped) mapped.forEach((s) => result.add(s));
  }
  return Array.from(result);
}

/* -------------------------------------------------------------------------- */
/* Agregación y consultas                                                      */
/* -------------------------------------------------------------------------- */

/** Todos los ítems clasificados del catálogo. */
export function getAllItems(): TaxonomyItem[] {
  const items: TaxonomyItem[] = [];
  for (const course of getAllCourses()) items.push(courseToItem(course));
  for (const post of blogPosts) items.push(blogToItem(post));
  for (const episode of podcast.episodes) items.push(episodeToItem(episode));
  for (const product of products) items.push(productToItem(product));
  for (const edition of newsletterEditions) items.push(newsletterToItem(edition));
  return items;
}

/** Ítems públicos (excluye draft). */
export function getPublicItems(): TaxonomyItem[] {
  return getAllItems().filter((i) => i.status !== 'draft');
}

export const getItemById = (id: string): TaxonomyItem | undefined =>
  getAllItems().find((i) => i.id === id);

/** Ítems de una categoría. */
export const getItemsByCategory = (slug: string): TaxonomyItem[] =>
  getPublicItems().filter((i) => i.categories.includes(slug));

/** Ítem de taxonomía para un curso (para recomendaciones en la página de curso). */
export const courseItem = (course: Course): TaxonomyItem => courseToItem(course);

/** Ítems de un tag. */
export const getItemsByTag = (slug: string): TaxonomyItem[] =>
  getPublicItems().filter((i) => i.tags.includes(slug));

/** Cantidad de contenido por categoría. */
export function getCategoryCounts(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of getPublicItems()) {
    for (const c of item.categories) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return counts;
}

/** Tags libres derivados del contenido, con su cantidad de usos. */
export function getAllTags(): { slug: string; name: string; count: number }[] {
  const bySlug = new Map<string, { slug: string; name: string; count: number }>();
  for (const item of getPublicItems()) {
    for (const tagSlug of item.tags) {
      const name = item.data && typeof item.data === 'object' && 'tags' in item.data
        ? tagNameFromSource(item, tagSlug)
        : tagSlug;
      const entry = bySlug.get(tagSlug) ?? { slug: tagSlug, name, count: 0 };
      entry.count += 1;
      bySlug.set(tagSlug, entry);
    }
  }
  return Array.from(bySlug.values()).sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}

function tagNameFromSource(item: TaxonomyItem, slug: string): string {
  const data = item.data as { tags?: string[] } | null | undefined;
  const tag = (data?.tags ?? []).find((t) => slugifyTag(t) === slug);
  return tag ?? slug;
}

export const getTag = (slug: string): { slug: string; name: string; count: number } | undefined =>
  getAllTags().find((t) => t.slug === slug);

/** Counts por tipo de contenido para los índices. */
export function getTypeCounts(): Record<ContentType, number> {
  const counts: Record<ContentType, number> = {
    course: 0, blog: 0, podcast: 0, resource: 0, newsletter: 0,
  };
  for (const item of getPublicItems()) counts[item.contentType] += 1;
  return counts;
}

/** Opciones disponibles para los filtros del catálogo (datos, no hardcode). */
export function getFilterOptions() {
  const items = getPublicItems();
  const levels = new Set<string>();
  const statuses = new Set<string>();
  for (const item of items) {
    if (item.level) levels.add(item.level);
    statuses.add(item.status);
  }
  return {
    categories: getCategoryGroupsWithCounts(),
    levels: getAllLevels(),
    audiences: getAllAudiencesWithCounts(),
    types: (['course', 'blog', 'podcast', 'resource', 'newsletter'] as ContentType[]).filter(
      (t) => items.some((i) => i.contentType === t)
    ),
    statuses: Array.from(statuses) as ContentStatus[],
  };
}

/** Categorías con su cantidad de contenido, agrupadas (para índices y filtros). */
export function getCategoryGroupsWithCounts() {
  const counts = getCategoryCounts();
  const map = new Map<string, { slug: string; name: string; count: number }[]>();
  for (const c of getAllCategories()) {
    const count = counts.get(c.slug) ?? 0;
    if (!map.has(c.group)) map.set(c.group, []);
    map.get(c.group)?.push({ slug: c.slug, name: c.name, count });
  }
  return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
}

function getAllAudiencesWithCounts() {
  const items = getPublicItems();
  const countBySlug = new Map<string, number>();
  for (const item of items) for (const a of item.audience) countBySlug.set(a, (countBySlug.get(a) ?? 0) + 1);
  return getAllAudiences().map((a) => ({ ...a, count: countBySlug.get(a.slug) ?? 0 }));
}

/* -------------------------------------------------------------------------- */
/* Filtrado del catálogo unificado                                            */
/* -------------------------------------------------------------------------- */

export function filterItems(items: TaxonomyItem[], filters: CatalogFilters): TaxonomyItem[] {
  const q = (filters.query ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return items.filter((item) => {
    if (filters.category && !item.categories.includes(filters.category)) return false;
    if (filters.level && item.level !== filters.level) return false;
    if (filters.audience && !item.audience.includes(filters.audience)) return false;
    if (filters.type && filters.type !== 'all' && item.contentType !== filters.type) return false;
    if (filters.status && filters.status !== 'all' && item.status !== filters.status) return false;
    if (q) {
      const haystack =
        `${item.title} ${item.subtitle ?? ''} ${item.description} ${item.tags.join(' ')}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/* -------------------------------------------------------------------------- */
/* Recomendaciones por afinidad (categorías + tags compartidos)               */
/* -------------------------------------------------------------------------- */

export function recommendItems(
  item: TaxonomyItem,
  options: { limit?: number; excludeTypes?: ContentType[] } = {}
): TaxonomyItem[] {
  const { limit = 3, excludeTypes = [] } = options;
  const others = getPublicItems().filter(
    (c) => c.id !== item.id && !excludeTypes.includes(c.contentType)
  );

  const scored = others
    .map((candidate) => {
      const sharedCategories = candidate.categories.filter((c) => item.categories.includes(c)).length;
      const sharedTags = candidate.tags.filter((t) => item.tags.includes(t)).length;
      const sameLevel = candidate.level === item.level ? 1 : 0;
      const score = sharedCategories * 3 + sharedTags * 2 + sameLevel;
      return { candidate, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.title.localeCompare(b.candidate.title));

  return scored.slice(0, limit).map(({ candidate }) => candidate);
}

/** Cursos relacionados por categorías/tags compartidos (para tarjetas). */
export function recommendCourses(item: TaxonomyItem, limit = 3): TaxonomyItem[] {
  return recommendItems(item, { limit, excludeTypes: ['course'] }).filter(
    (i) => i.contentType === 'course'
  );
}

/** Artículos del blog relacionados. */
export function recommendBlogPosts(item: TaxonomyItem, limit = 3): TaxonomyItem[] {
  return recommendItems(item, { limit, excludeTypes: ['blog'] }).filter(
    (i) => i.contentType === 'blog'
  );
}
