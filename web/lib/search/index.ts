/**
 * Búsqueda global (FASE 9): cursos (catálogo Markdown) y artículos de blog.
 * Funciones puras, sin dependencias, testeadas con Vitest.
 */

import type { Course } from '@/lib/courses/types';
import type { BlogPost } from '@/lib/data/blog';

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

export type SearchHit = CourseSearchHit | BlogSearchHit;

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

/** Búsqueda combinada (cursos + blog) para la página /buscar. */
export function searchAll(
  courses: Course[],
  posts: BlogPost[],
  query: string
): { courses: CourseSearchHit[]; posts: BlogSearchHit[] } {
  return {
    courses: searchCourses(courses, query),
    posts: searchBlogPosts(posts, query),
  };
}
