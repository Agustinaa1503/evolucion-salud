import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import CardCover from './CardCover';
import CourseBadge from './courses/CourseBadge';
import CourseStatus from './courses/CourseStatus';
import FavoriteButton from './FavoriteButton';
import type { Course } from '@/lib/courses/types';

/** Tarjeta de curso para índices y listados. */
export default function CourseCard({ course }: { course: Course }) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card transition duration-500 hover:-translate-y-1.5 hover:shadow-lift">
      <Link
        href={`/cursos/${course.slug}`}
        className="flex flex-1 flex-col"
      >
        <CardCover
          gradient={course.gradient}
          icon={course.icon}
          image={course.thumbnail}
          className="h-52"
        />
        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-wrap items-center gap-2">
            <CourseBadge course={course} />
            <CourseStatus course={course} />
            {course.duration ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {course.duration}
              </span>
            ) : null}
          </div>
          <h3 className="mt-4 text-xl font-extrabold leading-snug tracking-tight text-slate-900 transition group-hover:text-brand-700">
            {course.title}
          </h3>
          <p className="mt-1.5 text-sm font-medium text-brand-600">{course.subtitle}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 line-clamp-3">
            {course.description}
          </p>

          {course.status === 'in-development' ? (
            <span className="mt-3 inline-flex w-fit items-center rounded-full bg-sun-400/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
              Próximo lanzamiento
            </span>
          ) : null}

          <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-bold text-brand-600">
            {course.type === 'upcoming' ? 'Conocer más' : 'Ver curso'}
            <ArrowRight
              className="h-4 w-4 transition group-hover:translate-x-1.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </Link>

      <div className="absolute right-4 top-4 z-10">
        <FavoriteButton courseSlug={course.slug} variant="card" />
      </div>
    </div>
  );
}
