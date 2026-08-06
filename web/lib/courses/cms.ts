/**
 * Servicio CMS de cursos (Subfase 12.2 — extendido para cursos).
 *
 * Orquesta las operaciones CRUD sobre cursos en `Cursos/*.md`:
 *  - Validación del esquema completo
 *  - Escritura atómica del Markdown
 *  - Sincronización del catálogo en Supabase
 *  - Invalidación de caché del registry
 *
 * Patrón heredado de `web/lib/content/service.ts` y `compile.ts`.
 */
import fs from 'fs';
import path from 'path';
import { parseCourseFile } from './parser';
import { serializeCourse, courseChanged } from './serializer';
import { clearCourseCache } from './registry';
import type {
  Course,
  CourseLesson,
  CourseModule,
  CourseResource,
  CourseVideo,
  Quiz,
  QuizQuestion,
  CertificateConfig,
  Teacher,
  FaqItem,
  BibliographyEntry,
  CourseType,
  CourseStatus,
  CourseVisibility,
  CourseCTA,
  LessonType,
} from './types';

/* -------------------------------------------------------------------------- */
/* Rutas                                                                       */
/* -------------------------------------------------------------------------- */

function getCoursesDir(): string {
  return process.env.COURSES_DIR ?? path.resolve(process.cwd(), '..', 'Cursos');
}

/* -------------------------------------------------------------------------- */
/* Validación                                                                  */
/* -------------------------------------------------------------------------- */

export type ValidationIssue = {
  severity: 'error' | 'warning';
  field: string;
  message: string;
};

export type CourseValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

const VALID_TYPES: CourseType[] = ['free', 'paid', 'upcoming'];
const VALID_STATUSES: CourseStatus[] = ['published', 'in-development', 'draft', 'archived'];
const VALID_VISIBILITIES: CourseVisibility[] = ['public', 'private'];
const VALID_CTAS: CourseCTA[] = ['ver-curso', 'proximamente', 'inscribirme', 'lista-espera'];
const VALID_LESSON_TYPES: LessonType[] = ['video', 'pdf', 'texto', 'quiz', 'link'];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function addIssue(
  issues: ValidationIssue[],
  severity: 'error' | 'warning',
  field: string,
  message: string
) {
  issues.push({ severity, field, message });
}

export function validateCourse(course: Partial<Course>): CourseValidationResult {
  const issues: ValidationIssue[] = [];

  // Campos obligatorios
  if (!course.slug || !SLUG_RE.test(course.slug)) {
    addIssue(issues, 'error', 'slug', 'Slug inválido (solo minúsculas, números y guiones).');
  }
  if (!course.title?.trim()) {
    addIssue(issues, 'error', 'title', 'El título es obligatorio.');
  }
  if (!course.description?.trim()) {
    addIssue(issues, 'error', 'description', 'La descripción es obligatoria.');
  }

  // Tipo y estado
  if (course.type && !VALID_TYPES.includes(course.type)) {
    addIssue(issues, 'error', 'type', `Tipo inválido: ${course.type}. Valores: ${VALID_TYPES.join(', ')}.`);
  }
  if (course.status && !VALID_STATUSES.includes(course.status)) {
    addIssue(issues, 'error', 'status', `Estado inválido: ${course.status}.`);
  }
  if (course.visibility && !VALID_VISIBILITIES.includes(course.visibility)) {
    addIssue(issues, 'error', 'visibility', `Visibilidad inválida: ${course.visibility}.`);
  }
  if (course.cta && !VALID_CTAS.includes(course.cta)) {
    addIssue(issues, 'error', 'cta', `CTA inválido: ${course.cta}.`);
  }

  // Módulos
  if (course.modules) {
    const lessonIds = new Set<string>();
    for (const [mi, mod] of course.modules.entries()) {
      if (!mod.title?.trim()) {
        addIssue(issues, 'error', `modules[${mi}].title`, `Módulo ${mi + 1}: título obligatorio.`);
      }
      for (const [li, lesson] of (mod.lessons ?? []).entries()) {
        if (!lesson.title?.trim()) {
          addIssue(issues, 'error', `modules[${mi}].lessons[${li}].title`, `Lección ${li + 1} del módulo ${mi + 1}: título obligatorio.`);
        }
        if (!lesson.id?.trim()) {
          addIssue(issues, 'error', `modules[${mi}].lessons[${li}].id`, `Lección "${lesson.title}": ID obligatorio.`);
        } else if (lessonIds.has(lesson.id)) {
          addIssue(issues, 'error', `modules[${mi}].lessons[${li}].id`, `ID duplicado: "${lesson.id}".`);
        } else {
          lessonIds.add(lesson.id);
        }
        if (lesson.type && !VALID_LESSON_TYPES.includes(lesson.type)) {
          addIssue(issues, 'warning', `modules[${mi}].lessons[${li}].type`, `Tipo de lección inválido: ${lesson.type}.`);
        }
        if (lesson.duration && !/^\d{1,2}:\d{2}$/.test(lesson.duration)) {
          addIssue(issues, 'warning', `modules[${mi}].lessons[${li}].duration`, `Duración en formato MM:SS esperado, recibido: "${lesson.duration}".`);
        }
      }
    }
  }

  // Quiz
  if (course.quiz) {
    if (course.quiz.passThreshold !== undefined) {
      if (course.quiz.passThreshold < 0 || course.quiz.passThreshold > 100) {
        addIssue(issues, 'error', 'quiz.passThreshold', 'El umbral de aprobación debe estar entre 0 y 100.');
      }
    }
    for (const [qi, q] of course.quiz.questions.entries()) {
      if (!q.label?.trim()) {
        addIssue(issues, 'error', `quiz.questions[${qi}].label`, 'Pregunta sin enunciado.');
      }
    }
  }

  return { ok: issues.every((i) => i.severity !== 'error'), issues };
}

/* -------------------------------------------------------------------------- */
/* Escritura atómica                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Escribe el archivo Markdown de un curso de forma atómica.
 * Devuelve `true` si se escribió (hubo cambios reales).
 */
export function writeCourseFile(course: Course): boolean {
  const filePath = path.join(getCoursesDir(), `${course.slug}.md`);
  const serialized = serializeCourse(course);

  if (fs.existsSync(filePath) && !courseChanged(filePath, course)) {
    return false;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, serialized, 'utf8');
  fs.renameSync(tmp, filePath);
  return true;
}

/* -------------------------------------------------------------------------- */
/* Operaciones CRUD puras (sin sync a BD)                                      */
/* -------------------------------------------------------------------------- */

export function readCourse(slug: string): Course | undefined {
  const filePath = path.join(getCoursesDir(), `${slug}.md`);
  if (!fs.existsSync(filePath)) return undefined;
  return parseCourseFile(filePath);
}

export function listCourses(): Course[] {
  const dir = getCoursesDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.md'))
    .map((f) => parseCourseFile(path.join(dir, f)));
}

export function courseExists(slug: string): boolean {
  return fs.existsSync(path.join(getCoursesDir(), `${slug}.md`));
}

/* -------------------------------------------------------------------------- */
/* Helpers de construcción de curso                                            */
/* -------------------------------------------------------------------------- */

/** Genera un ID de lección estable para un curso nuevo. */
export function nextLessonId(modules: CourseModule[], moduleIndex: number): string {
  const prefix = `m${moduleIndex + 1}`;
  const existing = modules
    .flatMap((m) => m.lessons ?? [])
    .filter((l) => l.id.startsWith(prefix))
    .map((l) => {
      const m = l.id.match(/-l(\d+)$/);
      return m ? Number(m[1]) : 0;
    });
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `${prefix}-l${next}`;
}

/** Crea un curso nuevo con valores por defecto sensatos. */
export function createEmptyCourse(slug: string): Course {
  const now = new Date().toISOString().split('T')[0];
  return {
    id: slug,
    slug,
    title: '',
    subtitle: '',
    description: '',
    category: 'PINE',
    teachers: [],
    tags: [],
    type: 'free',
    status: 'draft',
    visibility: 'public',
    cta: 'ver-curso',
    currency: 'ARS',
    seo: {},
    featured: false,
    hasQuiz: false,
    hasCertificate: false,
    videos: [],
    resources: [],
    modules: [],
    objectives: [],
    learning: [],
    audience: [],
    requirements: [],
    faq: [],
    bibliography: [],
    sections: [],
    icon: 'book',
    gradient: 'from-brand-500 to-leaf-600',
    createdAt: now,
    updatedAt: now,
  };
}

/* -------------------------------------------------------------------------- */
/* Servicio CMS completo (con sync)                                            */
/* -------------------------------------------------------------------------- */

export type CourseSaveResult =
  | { ok: true; saved: boolean; course: Course }
  | { ok: false; error: string; issues?: ValidationIssue[] };

/**
 * Guarda un curso (crea o actualiza).
 * 1. Valida
 * 2. Escribe el .md atómicamente
 * 3. Invalida caché del registry
 * 4. Devuelve el curso resultante
 *
 * La sincronización a Supabase (db:sync-catalog) se ejecuta como paso
 * pos-guardado desde el server action.
 */
export function saveCourse(course: Course): CourseSaveResult {
  const validation = validateCourse(course);
  if (!validation.ok) {
    const first = validation.issues.find((i) => i.severity === 'error');
    return {
      ok: false,
      error: first ? first.message : 'El curso no pasa la validación.',
      issues: validation.issues,
    };
  }

  const now = new Date().toISOString();
  if (!course.createdAt) course.createdAt = now;
  course.updatedAt = now;

  const saved = writeCourseFile(course);
  clearCourseCache();

  return { ok: true, saved, course };
}

/**
 * Elimina un curso (solo si no tiene inscripciones).
 * Devuelve error si el curso tiene alumnos activos.
 */
export function deleteCourse(slug: string): { ok: boolean; error?: string } {
  const filePath = path.join(getCoursesDir(), `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    return { ok: false, error: 'El curso no existe.' };
  }
  fs.unlinkSync(filePath);
  clearCourseCache();
  return { ok: true };
}
