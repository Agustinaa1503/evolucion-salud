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

/* ---------- Dashboard del alumno (FASE 4) ---------- */

/** Formatea segundos de estudio como duración legible («2 h 15 min»). */
export function formatStudyTime(totalSeconds: number): string {
  const totalMinutes = Math.floor(Math.max(0, totalSeconds) / 60);
  if (totalMinutes <= 0) return '0 min';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours} h ${minutes} min`;
  if (hours > 0) return `${hours} h`;
  return `${minutes} min`;
}

/** Resumen del dashboard a partir de los cursos del alumno. */
export function summarizeStats(
  courses: Array<{ status: CourseUserStatus; totalStudySeconds: number }>
): { inProgress: number; completed: number; totalStudySeconds: number } {
  return courses.reduce(
    (acc, course) => {
      if (course.status === 'completed') acc.completed += 1;
      else acc.inProgress += 1;
      acc.totalStudySeconds += course.totalStudySeconds;
      return acc;
    },
    { inProgress: 0, completed: 0, totalStudySeconds: 0 }
  );
}

/* ---------- Gating secuencial de módulos (FASE UX: Retención) ---------- */

/** Resultado del chequeo de desbloqueo de un módulo. */
export type ModuleUnlockResult = {
  unlocked: boolean;
  reason?: string;
};

/**
 * Evalúa si un módulo está desbloqueado para el usuario.
 *
 * Regla:
 *  - Si `sequential` es false (default), todos los módulos están desbloqueados.
 *  - El primer módulo (índice 0) siempre está desbloqueado.
 *  - Para módulos posteriores: el módulo inmediatamente anterior debe tener
 *    TODAS sus lecciones completadas en `userLessonStatuses` y, si el módulo
 *    anterior tiene una lección de tipo quiz, ese quiz debe estar aprobado.
 *
 * @param moduleIndex - Índice del módulo a evaluar (0-based).
 * @param courseModules - Array de módulos del curso.
 * @param sequential - Si el curso tiene desbloqueo secuencial habilitado.
 * @param completedLessonKeys - Set de lesson_keys completados por el usuario.
 * @param passedQuizLessonKeys - Set de lesson_keys de tipo quiz que fueron aprobados.
 */
export function isModuleUnlocked(
  moduleIndex: number,
  courseModules: Array<{
    id?: string;
    title?: string;
    lessons?: Array<{ id: string; type?: string }>;
  }>,
  sequential: boolean,
  completedLessonKeys: Set<string>,
  passedQuizLessonKeys: Set<string>
): ModuleUnlockResult {
  if (!sequential) return { unlocked: true };
  if (moduleIndex === 0) return { unlocked: true };

  const prevModule = courseModules[moduleIndex - 1];
  if (!prevModule) return { unlocked: true };

  // 1. Todas las lecciones del módulo anterior deben estar completadas
  const prevLessons = prevModule.lessons ?? [];
  const allLessonsComplete = prevLessons.length > 0 && prevLessons.every(
    (l) => completedLessonKeys.has(l.id)
  );

  if (!allLessonsComplete) {
    return {
      unlocked: false,
      reason: `Completa las lecciones del módulo «${prevModule.title ?? ''}» para desbloquear este módulo.`,
    };
  }

  // 2. Si el módulo anterior tiene lecciones de tipo quiz, deben estar aprobadas
  const quizLessons = prevLessons.filter((l) => l.type === 'quiz');
  if (quizLessons.length > 0) {
    const allQuizzesPassed = quizLessons.every((l) => passedQuizLessonKeys.has(l.id));
    if (!allQuizzesPassed) {
      return {
        unlocked: false,
        reason: `Aprueba la evaluación del módulo «${prevModule.title ?? ''}» para desbloquear este módulo.`,
      };
    }
  }

  return { unlocked: true };
}

/**
 * Calcula los hitos de progreso alcanzados (25%, 50%, 75%, 100%).
 * Devuelve los hitos recién alcanzados comparando con el porcentaje anterior.
 */
export function detectMilestoneCrossings(
  prevPct: number,
  nextPct: number
): number[] {
  const milestones = [25, 50, 75, 100];
  return milestones.filter((m) => prevPct < m && nextPct >= m);
}
