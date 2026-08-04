/**
 * Búsqueda global (FASE 9 + SUBFASE 12.3.3): cursos, blog y productos.
 * Funciones puras, sin dependencias del entorno, testeadas con Vitest.
 */

import type { Course } from '@/lib/courses/types';
import type { BlogPost } from '@/lib/data/blog';
import type { Product } from '@/lib/content/types';

export type CourseSearchHit = {
  type: 'course';
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level?: string;
  course: Course;
};

export type BlogSearchHit = {
  type: 'post';
  slug: string;
  title: string;
  description: string;
  category: string;
  post: BlogPost;
};

export type ProductSearchHit = {
  type: 'product';
  slug: string;
  title: string;
  description: string;
  category: string;
  product: Product;
};

export type SearchHit = CourseSearchHit | BlogSearchHit | ProductSearchHit;

/** Normaliza para buscar: minúsculas y sin acentos (sirve para español). */
export function normalizeSearchTerm(term: string): string {
  return term
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function tokenize(value?: string | null): string {
  return normalizeSearchTerm(value ?? '');
}

/** ¿El término aparece en algún campo del curso? */
export function courseMatches(course: Course, term: string): boolean {
  const haystack = [
    course.title,
    course.subtitle,
    course.description,
    course.category,
    course.level,
    course.difficulty,
    course.author,
    ...(course.seo.keywords ?? []),
    ...course.objectives,
    ...course.learning,
    ...course.audience,
    ...course.teachers.map((t) => t.name),
    ...course.modules.flatMap((m) => [
      m.title,
      ...(m.lessons ?? []).map((l) => l.title),
    ]),
  ];
  return haystack.some((value) => tokenize(value).includes(term));
}

/** ¿El término aparece en algún campo del artículo? */
export function blogPostMatches(post: BlogPost, term: string): boolean {
  const haystack = [post.title, post.excerpt, post.category];
  return haystack.some((value) => tokenize(value).includes(term));
}

/** ¿El término aparece en algún campo del producto? */
export function productMatches(product: Product, term: string): boolean {
  const haystack = [
    product.title,
    product.subtitle,
    product.description,
    product.shortDescription,
    product.author,
    product.format,
    product.level,
    ...(product.categories ?? []),
    ...(product.tags ?? []),
    ...(product.features ?? []),
    ...(product.includes ?? []),
  ];
  return haystack.some((value) => tokenize(value).includes(term));
}

/** Busca en el catálogo de cursos y devuelve los que coinciden. */
export function searchCourses(courses: Course[], query: string): CourseSearchHit[] {
  const term = normalizeSearchTerm(query);
  if (!term) return [];
  return courses
    .filter((course) => courseMatches(course, term))
    .map((course) => ({
      type: 'course' as const,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      category: course.category,
      level: course.level,
      course,
    }));
}

/** Busca en los artículos del blog y devuelve los que coinciden. */
export function searchBlogPosts(posts: BlogPost[], query: string): BlogSearchHit[] {
  const term = normalizeSearchTerm(query);
  if (!term) return [];
  return posts
    .filter((post) => blogPostMatches(post, term))
    .map((post) => ({
      type: 'post' as const,
      slug: post.slug,
      title: post.title,
      description: post.excerpt,
      category: post.category,
      post,
    }));
}

/** Busca en el catálogo de productos y devuelve los que coinciden. */
export function searchProducts(productList: Product[], query: string): ProductSearchHit[] {
  const term = normalizeSearchTerm(query);
  if (!term) return [];
  return productList
    .filter((product) => productMatches(product, term))
    .map((product) => ({
      type: 'product' as const,
      slug: product.slug,
      title: product.title,
      description: product.shortDescription ?? product.description,
      category: product.categories?.[0] ?? product.level,
      product,
    }));
}

/** Búsqueda combinada (cursos + blog + productos) para la página /buscar. */
export function searchAll(
  courses: Course[],
  posts: BlogPost[],
  query: string,
  productList?: Product[]
): { courses: CourseSearchHit[]; posts: BlogSearchHit[]; products: ProductSearchHit[] } {
  return {
    courses: searchCourses(courses, query),
    posts: searchBlogPosts(posts, query),
    products: searchProducts(productList ?? [], query),
  };
}
