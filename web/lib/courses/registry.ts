import fs from 'fs';
import path from 'path';
import { parseCourseFile } from './parser';
import {
  isFreeCourse,
  isPublicCourse,
  isUpcomingCourse,
  type Course,
} from './types';

/**
 * Registro dinámico de cursos.
 *
 * Escanea la carpeta `/Cursos` (fuente oficial) y transforma cada archivo
 * Markdown en un `Course`. Para agregar un curso nuevo solo hay que crear
 * un `.md` con Front Matter; este módulo lo detecta automáticamente.
 *
 * La ruta se configura con `COURSES_DIR` (por defecto `../Cursos` respecto
 * de `web/`). Solo se usa en server components / funciones de build: nunca
 * importar este módulo desde un componente cliente.
 */

const COURSES_DIR =
  process.env.COURSES_DIR ?? path.resolve(process.cwd(), '..', 'Cursos');

let cache: { signature: string; courses: Course[] } | null = null;

/** Invalida la caché del registro (llamar tras escribir/eliminar un .md). */
export function clearCourseCache(): void {
  cache = null;
}

function dirSignature(): string {
  const entries = fs.readdirSync(COURSES_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.md'))
    .map((e) => `${e.name}:${fs.statSync(path.join(COURSES_DIR, e.name)).mtimeMs}`)
    .join('|');
}

/** Devuelve todos los cursos parseados (con caché por mtime de la carpeta). */
export function getAllCourses(): Course[] {
  if (!fs.existsSync(COURSES_DIR)) return [];

  const signature = dirSignature();
  if (cache && cache.signature === signature) return cache.courses;

  const courses = fs
    .readdirSync(COURSES_DIR)
    .filter((f) => f.toLowerCase().endsWith('.md'))
    .map((f) => parseCourseFile(path.join(COURSES_DIR, f)))
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
    });

  cache = { signature, courses };
  return courses;
}

/** Cursos visibles en el sitio público (excluye borradores y archivados). */
export function getPublicCourses(): Course[] {
  return getAllCourses().filter(isPublicCourse);
}

/** Cursos gratuitos y disponibles. */
export function getFreeCourses(): Course[] {
  return getPublicCourses().filter(isFreeCourse);
}

/** Cursos en desarrollo / próximamente (posiblemente de pago). */
export function getUpcomingCourses(): Course[] {
  return getPublicCourses().filter(isUpcomingCourse);
}

export function getCourse(slug: string): Course | undefined {
  return getAllCourses().find((c) => c.slug === slug);
}

export function getRelatedCourses(course: Course, limit = 3): Course[] {
  const all = getPublicCourses().filter((c) => c.slug !== course.slug);
  const sameCategory = all.filter((c) => c.category === course.category);
  const others = all.filter((c) => c.category !== course.category);
  return [...sameCategory, ...others].slice(0, limit);
}
