'use server';

/**
 * Server actions del CMS de cursos.
 *
 * CRUD completo para cursos, módulos, lecciones y evaluaciones.
 * Patrón heredado de `web/lib/content/content-actions.ts`.
 *
 * Permisos: `admin.content.read` para leer y `admin.content.write` para
 * guardar/eliminar. Log de auditoría en cada operación.
 */
import { revalidatePath } from 'next/cache';
import { requireAdminRole } from '@/lib/auth/session';
import { logAdminEvent } from '@/lib/admin/audit';
import {
  readCourse,
  listCourses,
  saveCourse,
  deleteCourse,
  courseExists,
  createEmptyCourse,
  nextLessonId,
  validateCourse,
} from './cms';
import { clearCourseCache } from './registry';
import type {
  Course,
  CourseModule,
  CourseLesson,
  Quiz,
  QuizQuestion,
  CourseResource,
  CourseVideo,
  LessonPlatform,
} from './types';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function revalidateCourse(slug: string): void {
  revalidatePath('/admin/cursos', 'layout');
  revalidatePath(`/admin/cursos/${slug}`, 'layout');
  revalidatePath('/admin/cursos', 'page');
  revalidatePath(`/admin/cursos/${slug}`, 'page');
  revalidatePath('/cursos', 'layout');
  revalidatePath(`/cursos/${slug}`, 'layout');
  revalidatePath('/', 'layout');
}

/* -------------------------------------------------------------------------- */
/* Lectura                                                                     */
/* -------------------------------------------------------------------------- */

/** Lista todos los cursos (incluye borradores). */
export async function cmsListCourses(): Promise<Course[]> {
  await requireAdminRole('admin.content.read');
  return listCourses();
}

/** Devuelve un curso por slug (o null). */
export async function cmsGetCourse(slug: string): Promise<Course | null> {
  await requireAdminRole('admin.content.read');
  return readCourse(slug) ?? null;
}

/* -------------------------------------------------------------------------- */
/* Curso completo                                                              */
/* -------------------------------------------------------------------------- */

export type CourseSaveInput = {
  slug: string;
  course: Course;
  summary?: string | null;
};

/** Guarda un curso completo (metadatos + módulos + lecciones + quiz). */
export async function cmsSaveCourse(input: CourseSaveInput): Promise<{
  ok: boolean;
  error?: string;
  issues?: { severity: string; field: string; message: string }[];
  saved?: boolean;
}> {
  const session = await requireAdminRole('admin.content.write');
  const result = saveCourse(input.course);

  if (result.ok) {
    await logAdminEvent({
      action: 'admin_change',
      category: 'courses',
      targetType: 'course',
      targetId: input.slug,
      detail: {
        action: 'save',
        slug: input.slug,
        modules: input.course.modules.length,
        by: session.user.email,
        summary: input.summary ?? null,
      },
    });
    revalidateCourse(input.slug);
  }

  return result;
}

/** Crea un curso nuevo (solo slug; el resto se edita después). */
export async function cmsCreateCourse(slug: string): Promise<{
  ok: boolean;
  error?: string;
  course?: Course;
  issues?: { severity: string; field: string; message: string }[];
}> {
  const session = await requireAdminRole('admin.content.write');
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { ok: false, error: 'Slug inválido (solo minúsculas, números y guiones).' };
  }
  if (courseExists(slug)) {
    return { ok: false, error: 'Ya existe un curso con ese slug.' };
  }

  const course = createEmptyCourse(slug);
  const result = saveCourse(course);

  if (result.ok) {
    await logAdminEvent({
      action: 'admin_change',
      category: 'courses',
      targetType: 'course',
      targetId: slug,
      detail: { action: 'create', slug, by: session.user.email },
    });
    revalidateCourse(slug);
    return { ok: true, course: result.course };
  }

  return { ok: false, error: result.error, issues: result.issues };
}

/** Elimina un curso (solo si no tiene inscripciones en BD). */
export async function cmsDeleteCourse(slug: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const session = await requireAdminRole('admin.content.write');
  const result = deleteCourse(slug);

  if (result.ok) {
    await logAdminEvent({
      action: 'admin_change',
      category: 'courses',
      targetType: 'course',
      targetId: slug,
      detail: { action: 'delete', slug, by: session.user.email },
    });
    revalidateCourse(slug);
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/* Módulos                                                                     */
/* -------------------------------------------------------------------------- */

export type ModuleInput = {
  courseSlug: string;
  moduleIndex: number;
  module: CourseModule;
};

/** Agrega un módulo al final del curso. */
export async function cmsAddModule(input: {
  courseSlug: string;
  title: string;
  description?: string;
}): Promise<{ ok: boolean; error?: string; course?: Course }> {
  const session = await requireAdminRole('admin.content.write');
  const course = readCourse(input.courseSlug);
  if (!course) return { ok: false, error: 'Curso no encontrado.' };

  course.modules.push({
    title: input.title,
    description: input.description,
    lessons: [],
  });

  const result = saveCourse(course);
  if (result.ok) {
    await logAdminEvent({
      action: 'admin_change',
      category: 'courses',
      targetType: 'module',
      targetId: input.courseSlug,
      detail: { action: 'add_module', title: input.title, by: session.user.email },
    });
    revalidateCourse(input.courseSlug);
  }
  return result;
}

/** Actualiza un módulo existente (título, descripción). */
export async function cmsUpdateModule(input: ModuleInput): Promise<{
  ok: boolean;
  error?: string;
  course?: Course;
}> {
  const session = await requireAdminRole('admin.content.write');
  const course = readCourse(input.courseSlug);
  if (!course) return { ok: false, error: 'Curso no encontrado.' };
  if (!course.modules[input.moduleIndex]) return { ok: false, error: 'Módulo no encontrado.' };

  // Conservar las lecciones existentes del módulo
  const existingLessons = course.modules[input.moduleIndex].lessons ?? [];
  course.modules[input.moduleIndex] = {
    ...input.module,
    lessons: existingLessons,
  };

  const result = saveCourse(course);
  if (result.ok) {
    await logAdminEvent({
      action: 'admin_change',
      category: 'courses',
      targetType: 'module',
      targetId: input.courseSlug,
      detail: { action: 'update_module', moduleIndex: input.moduleIndex, by: session.user.email },
    });
    revalidateCourse(input.courseSlug);
  }
  return result;
}

/** Elimina un módulo (solo si está vacío de lecciones). */
export async function cmsDeleteModule(input: {
  courseSlug: string;
  moduleIndex: number;
}): Promise<{ ok: boolean; error?: string; course?: Course }> {
  const session = await requireAdminRole('admin.content.write');
  const course = readCourse(input.courseSlug);
  if (!course) return { ok: false, error: 'Curso no encontrado.' };
  const mod = course.modules[input.moduleIndex];
  if (!mod) return { ok: false, error: 'Módulo no encontrado.' };
  if ((mod.lessons ?? []).length > 0) {
    return { ok: false, error: 'No se puede eliminar un módulo que tiene lecciones. Elimine las lecciones primero.' };
  }

  course.modules.splice(input.moduleIndex, 1);
  const result = saveCourse(course);
  if (result.ok) {
    await logAdminEvent({
      action: 'admin_change',
      category: 'courses',
      targetType: 'module',
      targetId: input.courseSlug,
      detail: { action: 'delete_module', moduleIndex: input.moduleIndex, by: session.user.email },
    });
    revalidateCourse(input.courseSlug);
  }
  return result;
}

/** Reordena los módulos (nuevo orden de índices). */
export async function cmsReorderModules(input: {
  courseSlug: string;
  moduleIndices: number[];
}): Promise<{ ok: boolean; error?: string; course?: Course }> {
  const session = await requireAdminRole('admin.content.write');
  const course = readCourse(input.courseSlug);
  if (!course) return { ok: false, error: 'Curso no encontrado.' };

  const reordered = input.moduleIndices.map((i) => course.modules[i]).filter(Boolean);
  if (reordered.length !== course.modules.length) {
    return { ok: false, error: 'Orden de módulos inválido.' };
  }
  course.modules = reordered;

  const result = saveCourse(course);
  if (result.ok) {
    await logAdminEvent({
      action: 'admin_change',
      category: 'courses',
      targetType: 'course',
      targetId: input.courseSlug,
      detail: { action: 'reorder_modules', by: session.user.email },
    });
    revalidateCourse(input.courseSlug);
  }
  return result;
}

/* -------------------------------------------------------------------------- */
/* Lecciones                                                                   */
/* -------------------------------------------------------------------------- */

export type LessonInput = {
  courseSlug: string;
  moduleIndex: number;
  lessonIndex: number;
  lesson: CourseLesson;
};

/** Agrega una lección a un módulo. */
export async function cmsAddLesson(input: {
  courseSlug: string;
  moduleIndex: number;
  title: string;
  type: CourseLesson['type'];
  videoUrl?: string;
  resourceUrl?: string;
  duration?: string;
  description?: string;
}): Promise<{ ok: boolean; error?: string; course?: Course }> {
  const session = await requireAdminRole('admin.content.write');
  const course = readCourse(input.courseSlug);
  if (!course) return { ok: false, error: 'Curso no encontrado.' };
  const mod = course.modules[input.moduleIndex];
  if (!mod) return { ok: false, error: 'Módulo no encontrado.' };

  if (!mod.lessons) mod.lessons = [];
  const id = nextLessonId(course.modules, input.moduleIndex);
  const newLesson: CourseLesson = {
    id,
    title: input.title,
    type: input.type,
    description: input.description,
    videoUrl: input.type === 'video' ? input.videoUrl : undefined,
    platform: input.type === 'video' && input.videoUrl ? guessPlatform(input.videoUrl) : undefined,
    resourceUrl: (input.type === 'pdf' || input.type === 'link') ? input.resourceUrl : undefined,
    duration: input.duration,
  };
  mod.lessons.push(newLesson);

  const result = saveCourse(course);
  if (result.ok) {
    await logAdminEvent({
      action: 'admin_change',
      category: 'courses',
      targetType: 'lesson',
      targetId: input.courseSlug,
      detail: { action: 'add_lesson', moduleIndex: input.moduleIndex, title: input.title, by: session.user.email },
    });
    revalidateCourse(input.courseSlug);
  }
  return result;
}

/** Actualiza una lección existente (conserva el ID original). */
export async function cmsUpdateLesson(input: LessonInput): Promise<{
  ok: boolean;
  error?: string;
  course?: Course;
}> {
  const session = await requireAdminRole('admin.content.write');
  const course = readCourse(input.courseSlug);
  if (!course) return { ok: false, error: 'Curso no encontrado.' };
  const mod = course.modules[input.moduleIndex];
  if (!mod) return { ok: false, error: 'Módulo no encontrado.' };
  const existing = (mod.lessons ?? [])[input.lessonIndex];
  if (!existing) return { ok: false, error: 'Lección no encontrada.' };

  // REGLA CRÍTICA: conservar el ID original para no romper progreso
  const updatedLesson: CourseLesson = {
    ...input.lesson,
    id: existing.id,
  };
  (mod.lessons ?? [])[input.lessonIndex] = updatedLesson;

  const result = saveCourse(course);
  if (result.ok) {
    await logAdminEvent({
      action: 'admin_change',
      category: 'courses',
      targetType: 'lesson',
      targetId: input.courseSlug,
      detail: { action: 'update_lesson', lessonKey: existing.id, by: session.user.email },
    });
    revalidateCourse(input.courseSlug);
  }
  return result;
}

/** Elimina una lección de un módulo. */
export async function cmsDeleteLesson(input: {
  courseSlug: string;
  moduleIndex: number;
  lessonIndex: number;
}): Promise<{ ok: boolean; error?: string; course?: Course }> {
  const session = await requireAdminRole('admin.content.write');
  const course = readCourse(input.courseSlug);
  if (!course) return { ok: false, error: 'Curso no encontrado.' };
  const mod = course.modules[input.moduleIndex];
  if (!mod?.lessons?.[input.lessonIndex]) return { ok: false, error: 'Lección no encontrada.' };

  const removed = mod.lessons.splice(input.lessonIndex, 1)[0];
  const result = saveCourse(course);
  if (result.ok) {
    await logAdminEvent({
      action: 'admin_change',
      category: 'courses',
      targetType: 'lesson',
      targetId: input.courseSlug,
      detail: { action: 'delete_lesson', lessonKey: removed.id, by: session.user.email },
    });
    revalidateCourse(input.courseSlug);
  }
  return result;
}

/* -------------------------------------------------------------------------- */
/* Quiz                                                                        */
/* -------------------------------------------------------------------------- */

/** Guarda el quiz completo de un curso. */
export async function cmsSaveQuiz(input: {
  courseSlug: string;
  quiz: Quiz | null;
}): Promise<{ ok: boolean; error?: string; course?: Course }> {
  const session = await requireAdminRole('admin.content.write');
  const course = readCourse(input.courseSlug);
  if (!course) return { ok: false, error: 'Curso no encontrado.' };

  course.quiz = input.quiz ?? undefined;
  course.hasQuiz = Boolean(input.quiz && input.quiz.questions.length > 0);

  const result = saveCourse(course);
  if (result.ok) {
    await logAdminEvent({
      action: 'admin_change',
      category: 'courses',
      targetType: 'quiz',
      targetId: input.courseSlug,
      detail: { action: 'save_quiz', questions: input.quiz?.questions.length ?? 0, by: session.user.email },
    });
    revalidateCourse(input.courseSlug);
  }
  return result;
}

/* -------------------------------------------------------------------------- */
/* Resources                                                                   */
/* -------------------------------------------------------------------------- */

/** Guarda los recursos del curso. */
export async function cmsSaveResources(input: {
  courseSlug: string;
  resources: CourseResource[];
}): Promise<{ ok: boolean; error?: string; course?: Course }> {
  const session = await requireAdminRole('admin.content.write');
  const course = readCourse(input.courseSlug);
  if (!course) return { ok: false, error: 'Curso no encontrado.' };

  course.resources = input.resources;
  const result = saveCourse(course);
  if (result.ok) {
    await logAdminEvent({
      action: 'admin_change',
      category: 'courses',
      targetType: 'resources',
      targetId: input.courseSlug,
      detail: { action: 'save_resources', count: input.resources.length, by: session.user.email },
    });
    revalidateCourse(input.courseSlug);
  }
  return result;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function guessPlatform(url: string): LessonPlatform | undefined {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  if (url.includes('drive.google.com')) return 'drive';
  return undefined;
}
