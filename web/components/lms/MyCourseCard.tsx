import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import CardCover from '../CardCover';
import CertificateButton from './CertificateButton';
import { formatStudyTime } from '@/lib/lms/progress';
import type { MyCourseEntry } from '@/lib/lms/actions';
import type { Course } from '@/lib/courses/types';

type Props = {
  course: MyCourseEntry;
  catalog?: Course;
};

/** Tarjeta del dashboard con el progreso real del alumno sobre el curso. */
export default function MyCourseCard({ course, catalog }: Props) {
  const completed = course.status === 'completed';
  const progress = Math.min(100, Math.max(0, course.progressPct));

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card transition duration-500 hover:-translate-y-1.5 hover:shadow-lift">
      <Link
        href={`/cursos/${course.slug}`}
        className="flex flex-1 flex-col"
      >
        <CardCover
          gradient={catalog?.gradient ?? 'from-brand-600 to-leaf-600'}
          icon={catalog?.icon ?? 'book'}
          image={catalog?.thumbnail}
          className="h-44"
        />

        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-extrabold leading-snug tracking-tight text-slate-900 transition group-hover:text-brand-700">
              {course.title}
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                completed ? 'bg-leaf-50 text-leaf-700' : 'bg-sun-400/25 text-amber-800'
              }`}
            >
              {completed ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Completado
                </>
              ) : (
                'En curso'
              )}
            </span>
          </div>
          {course.subtitle ? (
            <p className="mt-1 text-sm font-medium text-brand-600">{course.subtitle}</p>
          ) : null}

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500">
                {course.completedLessons} de {course.totalLessons} lecciones
              </span>
              <span className="text-brand-700">{progress}%</span>
            </div>
            <div
              className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso de ${course.title}: ${progress}%`}
            >
              <div
                className={`h-full rounded-full transition-all ${
                  completed ? 'bg-leaf-500' : 'bg-brand-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
            {course.totalStudySeconds > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {formatStudyTime(course.totalStudySeconds)}
              </span>
            ) : null}
          </div>

          <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-bold text-brand-600">
            {completed ? 'Revisar curso' : 'Continuar curso'}
            <ArrowRight
              className="h-4 w-4 transition group-hover:translate-x-1.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </Link>

      {completed && course.hasCertificate ? (
        <div className="px-6 pb-6 pt-1">
          <CertificateButton courseSlug={course.slug} />
        </div>
      ) : null}
    </div>
  );
}
