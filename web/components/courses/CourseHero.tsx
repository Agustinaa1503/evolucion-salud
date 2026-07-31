import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import CourseBadge from './CourseBadge';
import CourseStatus from './CourseStatus';
import CourseMetadata from './CourseMetadata';
import CourseCTA from './CourseCTA';
import CourseTeacher from './CourseTeacher';
import Icon from '@/components/Icon';
import type { Course } from '@/lib/courses/types';

/**
 * Hero de detalle del curso: breadcrumb, imagen/banner, badges de tipo y
 * estado, título, subtítulo, descripción, metadatos, docentes y CTA.
 */
export default function CourseHero({ course }: { course: Course }) {
  const banner = course.banner ?? course.thumbnail;

  return (
    <section className="relative overflow-hidden bg-ink-950 pb-16 pt-14">
      <div className="absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
      <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-leaf-500/20 blur-3xl" aria-hidden="true" />

      <div className="container-page relative">
        <Link
          href="/cursos"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-300 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Todos los cursos
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="group relative h-64 overflow-hidden rounded-3xl border border-white/10 shadow-lift lg:h-80">
            {banner ? (
              <Image
                src={banner}
                alt={course.title}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition duration-700 group-hover:scale-110"
              />
            ) : (
              <div className={`flex h-full items-center justify-center bg-gradient-to-br ${course.gradient}`}>
                <span className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/20 bg-white/15 text-white shadow-glass backdrop-blur">
                  <Icon name={course.icon} className="h-12 w-12" />
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" aria-hidden="true" />
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
              <CourseBadge course={course} />
              <CourseStatus course={course} />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CourseMetadata course={course} />
            </div>

            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              {course.title}
            </h1>
            <p className="mt-3 text-lg font-semibold text-brand-200">{course.subtitle}</p>

            <p className="mt-4 max-w-2xl leading-relaxed text-slate-300">{course.description}</p>

            {course.status === 'in-development' ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-sun-300 backdrop-blur">
                  <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                  Próximo lanzamiento
                </span>
                {(course.seo.keywords ?? []).slice(0, 3).map((k) => (
                  <span key={k} className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-brand-100 backdrop-blur">
                    {k}
                  </span>
                ))}
              </div>
            ) : null}

            <CourseTeacher course={course} className="mt-6" />

            <div className="mt-6">
              <CourseCTA course={course} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
