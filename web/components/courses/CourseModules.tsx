'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  ExternalLink,
  FileText,
  ListChecks,
  Lock,
  PlayCircle,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { countLessons, type Course, type CourseLesson } from '@/lib/courses/types';
import { getCourseProgress, markLesson } from '@/lib/lms/actions';
import type { CourseProgressData } from '@/lib/lms/progress';
import CoursePlayer from './CoursePlayer';

const lessonIcon: Record<CourseLesson['type'], typeof BookOpen> = {
  video: PlayCircle,
  pdf: FileText,
  texto: BookOpen,
  quiz: ListChecks,
  link: ExternalLink,
};

/**
 * Programa del curso en módulos con sus lecciones.
 *
 * - Invitados: lista de solo lectura con enlaces (sin persistencia).
 * - Usuarios con sesión: barra de progreso, lecciones marcables y reproductor
 *   de YouTube embebido que reporta el avance real del video.
 */
export default function CourseModules({ course, className = '' }: { course: Course; className?: string }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<CourseProgressData | null>(null);
  const [openLessonKey, setOpenLessonKey] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getCourseProgress(course.slug).then((result) => {
      if (cancelled) return;
      setAuthed(result.authed);
      setProgress(result.progress);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [course.slug]);

  const lessonsByKey = useMemo(() => {
    const map = new Map<string, { lesson: CourseLesson; moduleTitle: string }>();
    for (const module of course.modules) {
      for (const lesson of module.lessons ?? []) {
        map.set(lesson.id, { lesson, moduleTitle: module.title });
      }
    }
    return map;
  }, [course.modules]);

  const completedCount = useMemo(() => {
    if (!progress) return 0;
    return Object.values(progress.lessons).filter((s) => s === 'completed').length;
  }, [progress]);

  const totalLessons = countLessons(course);
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const toggleLesson = useCallback(
    async (lessonKey: string) => {
      if (!authed || busyKey) return;
      setBusyKey(lessonKey);
      const result = await markLesson(course.slug, lessonKey, 'completed');
      if (result.ok && result.progress) setProgress(result.progress);
      setBusyKey(null);
    },
    [authed, busyKey, course.slug]
  );

  const handleLessonOpen = useCallback(
    (lesson: CourseLesson) => {
      setOpenLessonKey((current) => (current === lesson.id ? null : lesson.id));
    },
    []
  );

  if (!course.modules.length) return null;

  return (
    <section className={className}>
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold text-slate-900">Programa del curso</h2>
          <p className="text-xs font-medium text-slate-500">
            {course.modules.length} {course.modules.length === 1 ? 'módulo' : 'módulos'} · {totalLessons} lecciones
          </p>
        </div>
        {authed && totalLessons > 0 ? (
          <div className="text-right">
            <p className="text-xs font-bold text-slate-700">
              {completedCount} de {totalLessons} completadas
            </p>
            <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-leaf-600 transition-all"
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        ) : null}
      </div>

      {ready && !authed ? (
        <p className="mt-3 flex items-center gap-2 rounded-xl border border-brand-200/70 bg-brand-50/70 px-4 py-3 text-sm font-medium text-slate-700">
          <Lock className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          <span>
            Inicie sesión para guardar su progreso, ver los videos dentro del curso y obtener su certificado. —{' '}
            <a href="/login" className="font-bold text-brand-700 underline">
              Entrar
            </a>
          </span>
        </p>
      ) : null}

      <div className="mt-6 space-y-4">
        {course.modules.map((module, i) => {
          const lessons = module.lessons ?? [];
          return (
            <details
              key={module.id ?? module.title}
              open={i === 0}
              className="group rounded-3xl border border-slate-200/80 bg-white shadow-card transition hover:shadow-lift"
            >
              <summary className="flex cursor-pointer list-none items-center gap-4 p-5 [&::-webkit-details-marker]:hidden">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-leaf-600 text-sm font-bold text-white shadow-sm">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-extrabold text-slate-900">{module.title}</h3>
                  {module.description ? (
                    <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-500">{module.description}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs font-bold text-slate-400">{lessons.length}</span>
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden="true" />
              </summary>
              {lessons.length ? (
                <ul className="border-t border-slate-100 px-5 py-4">
                  {lessons.map((lesson, j) => {
                    const Icon = lessonIcon[lesson.type] ?? BookOpen;
                    const status = progress?.lessons[lesson.id];
                    const isCompleted = status === 'completed';
                    const isOpen = openLessonKey === lesson.id;
                    const href = lesson.videoUrl ?? lesson.resourceUrl;
                    const isVideo = lesson.type === 'video' && Boolean(lesson.videoUrl);

                    return (
                      <li key={`${lesson.id}-${j}`}>
                        <div className="flex items-start gap-2.5 py-1.5">
                          {authed ? (
                            <button
                              type="button"
                              onClick={() => void toggleLesson(lesson.id)}
                              disabled={busyKey === lesson.id}
                              title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
                              className="mt-1.5 shrink-0 text-slate-300 transition hover:text-brand-600 disabled:opacity-50"
                              aria-label={`${lesson.title}: ${isCompleted ? 'pendiente' : 'completada'}`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-leaf-600" aria-hidden="true" />
                              ) : (
                                <Circle className="h-5 w-5" aria-hidden="true" />
                              )}
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => {
                              if (isVideo) {
                                handleLessonOpen(lesson);
                              } else if (href) {
                                window.open(href, href.startsWith('http') ? '_blank' : undefined);
                              }
                            }}
                            className="flex min-w-0 flex-1 items-start gap-2.5 rounded-xl px-2 py-1.5 text-left text-sm leading-relaxed transition hover:bg-brand-50/60"
                          >
                            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${isCompleted ? 'text-leaf-600' : 'text-brand-600'}`} aria-hidden="true" />
                            <span className="min-w-0 flex-1">
                              <span className={`block font-semibold ${isCompleted ? 'text-slate-500 line-through decoration-leaf-400/60' : 'text-slate-700'}`}>
                                {lesson.title}
                              </span>
                              {lesson.description ? (
                                <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{lesson.description}</span>
                              ) : null}
                            </span>
                            {lesson.free ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-leaf-50 px-2 py-0.5 text-[11px] font-bold text-leaf-700">
                                <Sparkles className="h-3 w-3" aria-hidden="true" />
                                Muestra
                              </span>
                            ) : null}
                            {lesson.duration ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                                <Clock className="h-3 w-3" aria-hidden="true" />
                                {lesson.duration}
                              </span>
                            ) : null}
                            {isVideo ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">
                                <PlayCircle className="h-3 w-3" aria-hidden="true" />
                                {isOpen ? 'Reproduciendo' : 'Ver en el curso'}
                              </span>
                            ) : null}
                          </button>
                        </div>

                        {isVideo && isOpen && lesson.videoUrl ? (
                          <div className="mb-4 mt-2 pl-9 pr-2">
                            <CoursePlayer
                              courseSlug={course.slug}
                              lessonKey={lesson.id}
                              videoUrl={lesson.videoUrl}
                              enabled={authed}
                              onCompleted={() => {
                                void (async () => {
                                  const result = await markLesson(course.slug, lesson.id, 'completed');
                                  if (result.ok && result.progress) setProgress(result.progress);
                                })();
                              }}
                            />
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </details>
          );
        })}
      </div>

      {authed && totalLessons > 0 ? (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-sm text-slate-600">
          <UserRound className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          <span>
            Su avance se guarda automáticamente en su cuenta. Marque cada lección como completada (los videos se
            marcan solos al terminar).
          </span>
        </div>
      ) : null}
    </section>
  );
}
