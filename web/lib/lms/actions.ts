'use server';

import { createServerSupabaseClient, getAuthSession } from '@/lib/auth/session';
import { getCourse } from '@/lib/courses/registry';
import { isScoredQuiz, scoreQuiz, type QuizAnswer, type QuizAttemptResult } from './quiz';
import type { Json } from '@/lib/supabase/types';
import {
  computeProgressPct,
  isVideoCompleted,
  statusFromProgress,
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
