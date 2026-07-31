/**
 * Lógica pura del LMS (progreso del alumno).
 *
 * Estas funciones no tocan la base de datos: son pura computación para
 * poder probarlas con Vitest sin necesidad de Supabase.
 */

/** Estado de una lección para el usuario. */
export type LessonStatus = 'viewed' | 'completed';

/** Estado de la relación usuario-curso. */
export type CourseUserStatus = 'in_progress' | 'completed';

/** Progreso agregado de un curso para un usuario. */
export type CourseProgressData = {
  status: CourseUserStatus;
  progressPct: number;
  totalStudySeconds: number;
  /** Mapa lessonKey → estado (solo lecciones con algún registro). */
  lessons: Record<string, LessonStatus>;
};

/** Resultado de las server actions del LMS. */
export type ProgressResult = {
  ok: boolean;
  error?: string;
  progress?: CourseProgressData;
};

/** Resultado de consultar el progreso (distingue invitado de autenticado). */
export type ProgressQuery = {
  authed: boolean;
  progress: CourseProgressData | null;
};

/**
 * Porcentaje completado redondeado.
 * Devuelve 100 si hay lecciones y todas están completas; 0 si no hay lecciones.
 */
export function computeProgressPct(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((completed / total) * 100));
}

/** Estado de la relación según el porcentaje. */
export function statusFromProgress(pct: number): CourseUserStatus {
  return pct >= 100 ? 'completed' : 'in_progress';
}

/**
 * Determina si un video se considera completado.
 * Con duración conocida: exige ver el 97% (con tolerancia de 3 s).
 * Sin duración: exige un mínimo de 60 segundos reproducidos.
 */
export function isVideoCompleted(
  watchedSeconds: number,
  durationSeconds: number | null
): boolean {
  if (watchedSeconds <= 0) return false;
  if (durationSeconds && durationSeconds > 0) {
    return watchedSeconds >= Math.max(durationSeconds * 0.97, durationSeconds - 3);
  }
  return watchedSeconds >= 60;
}

/** Progreso de un video en porcentaje (0-100), con techo en 100. */
export function videoProgressPct(
  watchedSeconds: number,
  durationSeconds: number | null
): number {
  if (!durationSeconds || durationSeconds <= 0) return 0;
  return Math.min(100, Math.round((watchedSeconds / durationSeconds) * 100));
}
