'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient, getAuthSession } from '@/lib/auth/session';
import { getCourse } from '@/lib/courses/registry';
import { countLessons } from '@/lib/courses/types';
import type { Course } from '@/lib/courses/types';
import { isScoredQuiz, scoreQuiz, type QuizAnswer, type QuizAttemptResult } from './quiz';
import { buildCertificatePdf } from '@/lib/certificates/pdf';
import { favoriteRowsToSlugs } from './favorites';
import type { Json } from '@/lib/supabase/types';
import {
  computeProgressPct,
  isVideoCompleted,
  statusFromProgress,
  summarizeStats,
  videoProgressPct,
  type CourseProgressData,
  type CourseUserStatus,
  type LessonStatus,
  type ProgressQuery,
  type ProgressResult,
} from './progress';

type AuthSession = Awaited<ReturnType<typeof getAuthSession>>;
type Supabase = NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>;

const nowIso = () => new Date().toISOString();

async function resolveCourseId(supabase: Supabase, slug: string): Promise<string | null> {
  const { data } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  return data?.id ?? null;
}

async function resolveLessonId(
  supabase: Supabase,
  courseId: string,
  lessonKey: string
): Promise<string | null> {
  const { data } = await supabase
    .from('course_lessons')
    .select('id')
    .eq('course_id', courseId)
    .eq('lesson_key', lessonKey)
    .maybeSingle();
  return data?.id ?? null;
}

/** Garantiza la fila de user_courses (inscribe al curso si no existe). */
async function ensureEnrollment(supabase: Supabase, userId: string, courseId: string) {
  const now = nowIso();
  const { data: existing } = await supabase
    .from('user_courses')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('user_courses')
      .update({ last_access_at: now })
      .eq('id', existing.id);
    return existing.id;
  }

  const { data, error } = await supabase
    .from('user_courses')
    .insert({ user_id: userId, course_id: courseId, last_access_at: now })
    .select('id')
    .single();
  if (error) throw new Error(`ensureEnrollment: ${error.message}`);
  return data.id;
}

/** Recalcula porcentaje, estado, tiempo de estudio y los persiste. */
async function recomputeCourseProgress(
  supabase: Supabase,
  userId: string,
  courseId: string
): Promise<void> {
  const { count: total } = await supabase
    .from('course_lessons')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId);

  const { count: completed } = await supabase
    .from('user_lesson_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('status', 'completed');

  const { data: videos } = await supabase
    .from('user_video_progress')
    .select('watched_seconds')
    .eq('user_id', userId)
    .eq('course_id', courseId);

  const totalStudySeconds = (videos ?? []).reduce(
    (acc, v) => acc + (v.watched_seconds ?? 0),
    0
  );

  const pct = computeProgressPct(completed ?? 0, total ?? 0);
  const status = statusFromProgress(pct);

  const { data: row } = await supabase
    .from('user_courses')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  const now = nowIso();
  await supabase
    .from('user_courses')
    .update({
      progress_pct: pct,
      status,
      total_study_seconds: totalStudySeconds,
      last_access_at: now,
      completed_at:
        status === 'completed'
          ? (row?.completed_at ?? now)
          : null,
    })
    .eq('user_id', userId)
    .eq('course_id', courseId);
}

/** Lee el progreso actual de un usuario sobre un curso. */
export async function getCourseProgress(
  courseSlug: string
): Promise<ProgressQuery> {
  const session = await getAuthSession();
  if (!session.user) return { authed: false, progress: null };

  const supabase = await createServerSupabaseClient();
  const courseId = await resolveCourseId(supabase, courseSlug);
  if (!courseId) return { authed: true, progress: null };

  const { data: enrolled } = await supabase
    .from('user_courses')
    .select('status, progress_pct, total_study_seconds')
    .eq('user_id', session.user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (!enrolled) {
    return {
      authed: true,
      progress: {
        status: 'in_progress',
        progressPct: 0,
        totalStudySeconds: 0,
        lessons: {},
      },
    };
  }

  const { data: lessonRows } = await supabase
    .from('user_lesson_progress')
    .select('course_lessons!inner(lesson_key), status')
    .eq('user_id', session.user.id)
    .eq('course_id', courseId);

  const lessons: Record<string, LessonStatus> = {};
  for (const row of lessonRows ?? []) {
    const key = row.course_lessons?.lesson_key;
    if (key) lessons[key] = row.status as LessonStatus;
  }

  return {
    authed: true,
    progress: {
      status: (enrolled.status ?? 'in_progress') as CourseUserStatus,
      progressPct: enrolled.progress_pct ?? 0,
      totalStudySeconds: enrolled.total_study_seconds ?? 0,
      lessons,
    },
  };
}

/** Inscribe al usuario en el curso (primer acceso). */
export async function startCourse(courseSlug: string): Promise<ProgressResult> {
  const session = await getAuthSession();
  if (!session.user) return { ok: false, error: 'Debe iniciar sesión para comenzar un curso.' };

  const supabase = await createServerSupabaseClient();
  const courseId = await resolveCourseId(supabase, courseSlug);
  if (!courseId) return { ok: false, error: 'Curso no encontrado.' };

  try {
    await ensureEnrollment(supabase, session.user.id, courseId);
    const progress = (await getCourseProgress(courseSlug)).progress;
    return { ok: true, progress: progress ?? undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Error al inscribirse.' };
  }
}

/**
 * Marca una lección como vista o completada (o la desmarca si se vuelve a
 * enviar el mismo estado desde el estado completado).
 */
export async function markLesson(
  courseSlug: string,
  lessonKey: string,
  status: LessonStatus
): Promise<ProgressResult> {
  const session = await getAuthSession();
  if (!session.user) return { ok: false, error: 'Debe iniciar sesión para guardar su progreso.' };

  const supabase = await createServerSupabaseClient();
  const courseId = await resolveCourseId(supabase, courseSlug);
  if (!courseId) return { ok: false, error: 'Curso no encontrado.' };
  const lessonId = await resolveLessonId(supabase, courseId, lessonKey);
  if (!lessonId) return { ok: false, error: 'Lección no encontrada.' };

  try {
    await ensureEnrollment(supabase, session.user.id, courseId);

    const { data: current } = await supabase
      .from('user_lesson_progress')
      .select('id, status')
      .eq('user_id', session.user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    // Si ya está completada y se vuelve a tocar, se desmarca (toggle).
    const nextStatus: LessonStatus =
      current?.status === 'completed' && status === 'completed' ? 'viewed' : status;

    const now = nowIso();
    const { error } = await supabase.from('user_lesson_progress').upsert(
      {
        user_id: session.user.id,
        course_id: courseId,
        lesson_id: lessonId,
        status: nextStatus,
        viewed_at: now,
        completed_at: nextStatus === 'completed' ? now : null,
      },
      { onConflict: 'user_id,lesson_id' }
    );
    if (error) throw new Error(error.message);

    await recomputeCourseProgress(supabase, session.user.id, courseId);
    const progress = (await getCourseProgress(courseSlug)).progress;
    return { ok: true, progress: progress ?? undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Error al guardar el progreso.' };
  }
}

/** Reporta el avance de reproducción de un video (YouTube IFrame API). */
export async function reportVideoProgress(
  courseSlug: string,
  lessonKey: string,
  videoUrl: string,
  watchedSeconds: number,
  durationSeconds: number | null
): Promise<ProgressResult> {
  const session = await getAuthSession();
  if (!session.user) return { ok: false, error: 'Debe iniciar sesión para guardar su progreso.' };

  const supabase = await createServerSupabaseClient();
  const courseId = await resolveCourseId(supabase, courseSlug);
  if (!courseId) return { ok: false, error: 'Curso no encontrado.' };
  const lessonId = await resolveLessonId(supabase, courseId, lessonKey);

  try {
    await ensureEnrollment(supabase, session.user.id, courseId);

    const safeWatched = Math.max(0, Math.floor(watchedSeconds));
    const completed = isVideoCompleted(safeWatched, durationSeconds);
    const pct = videoProgressPct(safeWatched, durationSeconds);

    await supabase.from('user_video_progress').upsert(
      {
        user_id: session.user.id,
        course_id: courseId,
        lesson_id: lessonId,
        video_url: videoUrl,
        watched_seconds: safeWatched,
        duration_seconds: durationSeconds,
        progress_pct: pct,
        completed,
        last_position_at: nowIso(),
      },
      { onConflict: 'user_id,video_url' }
    );

    // El video terminado completa la lección (dispara el trigger lesson_completed).
    if (completed && lessonId) {
      await supabase.from('user_lesson_progress').upsert(
        {
          user_id: session.user.id,
          course_id: courseId,
          lesson_id: lessonId,
          status: 'completed',
          viewed_at: nowIso(),
          completed_at: nowIso(),
        },
        { onConflict: 'user_id,lesson_id' }
      );
    }

    await recomputeCourseProgress(supabase, session.user.id, courseId);
    const progress = (await getCourseProgress(courseSlug)).progress;
    return { ok: true, progress: progress ?? undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Error al guardar el video.' };
  }
}

/** Marca una notificación como leída. */
export async function markNotificationRead(notificationId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getAuthSession();
  if (!session.user) return { ok: false, error: 'Debe iniciar sesión.' };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: nowIso() })
    .eq('id', notificationId)
    .eq('user_id', session.user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* FASE 6 · Cuestionarios con nota e intentos                                  */
/* -------------------------------------------------------------------------- */

export type QuizSubmitResult = {
  ok: boolean;
  authed?: boolean;
  error?: string;
  result?: QuizAttemptResult;
};

export type QuizAttemptRow = {
  id: string;
  score: number | null;
  max_score: number | null;
  passed: boolean | null;
  submitted_at: string;
};

/** Al aprobar el cuestionario completa las lecciones de tipo `quiz` del curso. */
async function completeQuizLessons(
  supabase: Supabase,
  userId: string,
  courseId: string,
  courseSlug: string
): Promise<void> {
  const course = getCourse(courseSlug);
  if (!course) return;

  for (const module of course.modules ?? []) {
    for (const lesson of module.lessons ?? []) {
      if (lesson.type !== 'quiz') continue;
      const lessonId = await resolveLessonId(supabase, courseId, lesson.id);
      if (!lessonId) continue;
      const now = nowIso();
      await supabase.from('user_lesson_progress').upsert(
        {
          user_id: userId,
          course_id: courseId,
          lesson_id: lessonId,
          status: 'completed',
          viewed_at: now,
          completed_at: now,
        },
        { onConflict: 'user_id,lesson_id' }
      );
    }
  }

  await recomputeCourseProgress(supabase, userId, courseId);
}

/**
 * Envía un intento de cuestionario con nota. La puntuación se calcula en el
 * servidor contra el Markdown (fuente de verdad), no se confía en el cliente.
 */
export async function submitQuizAttempt(
  courseSlug: string,
  answers: Record<string, QuizAnswer>
): Promise<QuizSubmitResult> {
  const session = await getAuthSession();
  if (!session.user) {
    return { ok: false, authed: false, error: 'Debe iniciar sesión para guardar su nota.' };
  }

  const course = getCourse(courseSlug);
  const quiz = course?.quiz;
  if (!quiz || !isScoredQuiz(quiz)) {
    return { ok: false, error: 'Este curso no tiene un cuestionario con nota.' };
  }

  const result = scoreQuiz(quiz, answers);
  const supabase = await createServerSupabaseClient();
  const courseId = await resolveCourseId(supabase, courseSlug);
  if (!courseId) return { ok: false, error: 'Curso no encontrado.' };

  try {
    await ensureEnrollment(supabase, session.user.id, courseId);

    const { data: quizRow } = await supabase
      .from('course_quizzes')
      .select('id')
      .eq('course_id', courseId)
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from('user_quiz_attempts').insert({
      user_id: session.user.id,
      course_id: courseId,
      quiz_id: quizRow?.id ?? null,
      answers: answers as unknown as Json,
      score: result.score,
      max_score: result.maxScore,
      passed: result.passed,
    });
    if (error) throw new Error(error.message);

    if (result.passed) {
      await completeQuizLessons(supabase, session.user.id, courseId, courseSlug);
      await supabase.from('notifications').insert({
        user_id: session.user.id,
        type: 'quiz',
        title: 'Cuestionario aprobado',
        body: `Aprobó el cuestionario de «${course.title}» con ${result.score}/${result.maxScore}.`,
        link: `/cursos/${courseSlug}`,
      });
    }

    return { ok: true, authed: true, result };
  } catch (error) {
    return { ok: false, authed: true, error: error instanceof Error ? error.message : 'Error al guardar la nota.' };
  }
}

/** Últimos intentos del usuario sobre el cuestionario del curso. */
export async function getQuizAttempts(courseSlug: string): Promise<QuizAttemptRow[]> {
  const session = await getAuthSession();
  if (!session.user) return [];

  const supabase = await createServerSupabaseClient();
  const courseId = await resolveCourseId(supabase, courseSlug);
  if (!courseId) return [];

  const { data } = await supabase
    .from('user_quiz_attempts')
    .select('id, score, max_score, passed, submitted_at')
    .eq('user_id', session.user.id)
    .eq('course_id', courseId)
    .order('submitted_at', { ascending: false })
    .limit(5);
  return data ?? [];
}

/* -------------------------------------------------------------------------- */
/* FASE 4 · Dashboard del alumno (Mi aprendizaje)                              */
/* -------------------------------------------------------------------------- */

export type MyCourseEntry = {
  slug: string;
  title: string;
  subtitle: string;
  status: CourseUserStatus;
  progressPct: number;
  totalStudySeconds: number;
  startedAt: string | null;
  lastAccessAt: string;
  completedAt: string | null;
  totalLessons: number;
  completedLessons: number;
  hasCertificate: boolean;
};

export type MyNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export type MyLearningResult = {
  authed: boolean;
  error?: string;
  courses: MyCourseEntry[];
  stats: { inProgress: number; completed: number; totalStudySeconds: number };
  notifications: MyNotification[];
  unreadCount: number;
};

/**
 * Datos del dashboard «Mi aprendizaje»: cursos del usuario con su progreso,
 * resumen y notificaciones recientes. El detalle del curso (título, lecciones)
 * se resuelve contra el catálogo Markdown (fuente de verdad).
 */
export async function getMyLearning(): Promise<MyLearningResult> {
  const session = await getAuthSession();
  if (!session.user) {
    return {
      authed: false,
      courses: [],
      stats: { inProgress: 0, completed: 0, totalStudySeconds: 0 },
      notifications: [],
      unreadCount: 0,
    };
  }

  const supabase = await createServerSupabaseClient();
  const userId = session.user.id;

  const { data: enrollments } = await supabase
    .from('user_courses')
    .select('course_id, status, progress_pct, total_study_seconds, started_at, last_access_at, completed_at')
    .eq('user_id', userId)
    .order('last_access_at', { ascending: false });

  const { data: catalogRows } = await supabase.from('courses').select('id, slug');
  const slugById = new Map((catalogRows ?? []).map((row) => [row.id, row.slug]));

  const { data: lessonRows } = await supabase
    .from('user_lesson_progress')
    .select('course_id')
    .eq('user_id', userId)
    .eq('status', 'completed');
  const completedByCourse = new Map<string, number>();
  for (const row of lessonRows ?? []) {
    completedByCourse.set(row.course_id, (completedByCourse.get(row.course_id) ?? 0) + 1);
  }

  const courses: MyCourseEntry[] = [];
  for (const enrolled of enrollments ?? []) {
    const slug = slugById.get(enrolled.course_id);
    if (!slug) continue;
    const catalog = getCourse(slug);
    const status = (enrolled.status ?? 'in_progress') as CourseUserStatus;
    courses.push({
      slug,
      title: catalog?.title ?? slug,
      subtitle: catalog?.subtitle ?? '',
      status,
      progressPct: enrolled.progress_pct ?? 0,
      totalStudySeconds: enrolled.total_study_seconds ?? 0,
      startedAt: enrolled.started_at ?? null,
      lastAccessAt: enrolled.last_access_at,
      completedAt: enrolled.completed_at ?? null,
      totalLessons: catalog ? countLessons(catalog) : 0,
      completedLessons: completedByCourse.get(enrolled.course_id) ?? 0,
      hasCertificate: Boolean(catalog?.hasCertificate),
    });
  }

  const { data: notificationRows } = await supabase
    .from('notifications')
    .select('id, type, title, body, link, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  const notifications: MyNotification[] = (notificationRows ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));

  return {
    authed: true,
    courses,
    stats: summarizeStats(courses),
    notifications,
    unreadCount: notifications.filter((n) => !n.readAt).length,
  };
}

/* -------------------------------------------------------------------------- */
/* FASE 5 · Certificados (PDF + QR + Storage)                                  */
/* -------------------------------------------------------------------------- */

export type CertificateResult = {
  ok: boolean;
  error?: string;
  signedUrl?: string;
  certificateNumber?: string;
  issuedAt?: string;
};

const siteUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/**
 * Emite (si hace falta) y devuelve el enlace firmado del certificado PDF del
 * curso. Requisitos: sesión iniciada, curso con `hasCertificate` publicado y
 * curso completado (status `completed`). El PDF se genera en el servidor con
 * pdf-lib + qrcode y se guarda en el bucket privado `certificates`.
 */
export async function getCourseCertificate(courseSlug: string): Promise<CertificateResult> {
  const session = await getAuthSession();
  if (!session.user) {
    return { ok: false, error: 'Debe iniciar sesión para descargar su certificado.' };
  }

  const course = getCourse(courseSlug);
  if (!course || !course.hasCertificate) {
    return { ok: false, error: 'Este curso no emite certificados.' };
  }
  if (course.type === 'upcoming' || course.status === 'draft' || course.status === 'in-development') {
    return { ok: false, error: 'El certificado estará disponible cuando el curso se lance.' };
  }

  const supabase = await createServerSupabaseClient();
  const courseId = await resolveCourseId(supabase, courseSlug);
  if (!courseId) return { ok: false, error: 'Curso no encontrado.' };

  const { data: enrollment } = await supabase
    .from('user_courses')
    .select('status')
    .eq('user_id', session.user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (!enrollment || enrollment.status !== 'completed') {
    return { ok: false, error: 'Complete todas las lecciones del curso para obtener su certificado.' };
  }

  const fullName = [session.profile?.nombre, session.profile?.apellido]
    .filter(Boolean)
    .join(' ')
    .trim();
  const studentName = fullName || session.user.email || 'Participante';
  // La ruta dentro del bucket NO lleva el prefijo del bucket (la policy usa
  // storage.foldername(name)[1] para chequear la carpeta <uid>/).
  const pdfPath = `${session.user.id}/${courseId}.pdf`;

  try {
    const { data: certRows, error: certError } = await supabase
      .rpc('issue_certificate', {
        p_user_id: session.user.id,
        p_course_id: courseId,
        p_pdf_path: pdfPath,
      });
    const cert = certRows?.[0];
    if (certError || !cert) {
      return { ok: false, error: certError?.message ?? 'No se pudo emitir el certificado.' };
    }

    const verificationUrl = `${siteUrl()}/verificar/${cert.id}`;
    const pdfBytes = await buildCertificatePdf({
      fullName: studentName,
      courseTitle: course.title,
      certificateNumber: cert.certificate_number,
      issuedAt: cert.issued_at,
      verificationUrl,
      signers: course.certificateConfig?.signers,
    });

    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(pdfPath, pdfBytes, { contentType: 'application/pdf', upsert: true });
    if (uploadError) return { ok: false, error: 'No se pudo guardar el certificado.' };

    const { data: signed, error: signedError } = await supabase.storage
      .from('certificates')
      .createSignedUrl(pdfPath, 3600);
    if (signedError || !signed) {
      return { ok: false, error: 'No se pudo generar el enlace de descarga.' };
    }

    await supabase.from('notifications').insert({
      user_id: session.user.id,
      type: 'certificate',
      title: 'Certificado disponible',
      body: `Su certificado de «${course.title}» (${cert.certificate_number}) está listo para descargar.`,
      link: `/cursos/${courseSlug}`,
    });
    await supabase.rpc('log_activity', {
      p_user_id: session.user.id,
      p_course_id: courseId,
      p_event: 'certificate_issued',
      p_payload: { certificate_number: cert.certificate_number },
    });

    return {
      ok: true,
      signedUrl: signed.signedUrl,
      certificateNumber: cert.certificate_number,
      issuedAt: cert.issued_at,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Error al generar el certificado.',
    };
  }
}

/* -------------------------------------------------------------------------- */
/* FASE 8 · Favoritos de cursos                                                */
/* -------------------------------------------------------------------------- */

export type ToggleFavoriteResult = {
  ok: boolean;
  authed?: boolean;
  favorite?: boolean;
  error?: string;
};

export type MyFavoritesResult = {
  authed: boolean;
  error?: string;
  courses: Course[];
};

/** Marca/desmarca un curso como favorito del usuario. */
export async function toggleFavorite(courseSlug: string): Promise<ToggleFavoriteResult> {
  const session = await getAuthSession();
  if (!session.user) {
    return { ok: false, authed: false, error: 'Debe iniciar sesión para guardar favoritos.' };
  }

  const supabase = await createServerSupabaseClient();
  const courseId = await resolveCourseId(supabase, courseSlug);
  if (!courseId) return { ok: false, error: 'Curso no encontrado.' };

  const { data: existing } = await supabase
    .from('user_favorites')
    .select('course_id')
    .eq('user_id', session.user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', session.user.id)
      .eq('course_id', courseId);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/mis-favoritos');
    return { ok: true, authed: true, favorite: false };
  }

  const { error } = await supabase.from('user_favorites').insert({
    user_id: session.user.id,
    course_id: courseId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/mis-favoritos');
  return { ok: true, authed: true, favorite: true };
}

/** Slugs de los cursos favoritos del usuario (en orden de marcado, del más reciente). */
export async function getFavoriteSlugs(): Promise<string[]> {
  const session = await getAuthSession();
  if (!session.user) return [];

  const supabase = await createServerSupabaseClient();
  const { data: rows } = await supabase
    .from('user_favorites')
    .select('course_id')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (!rows?.length) return [];

  const { data: catalog } = await supabase.from('courses').select('id, slug');
  return favoriteRowsToSlugs(rows, catalog ?? []);
}

/** Cursos favoritos del usuario (detalle desde el catálogo Markdown, fuente de verdad). */
export async function getMyFavorites(): Promise<MyFavoritesResult> {
  const session = await getAuthSession();
  if (!session.user) return { authed: false, courses: [] };

  const slugs = await getFavoriteSlugs();
  const courses = slugs
    .map((slug) => getCourse(slug))
    .filter((c): c is Course => Boolean(c));
  return { authed: true, courses };
}
