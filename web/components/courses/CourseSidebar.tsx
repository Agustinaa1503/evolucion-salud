import CourseBadge from './CourseBadge';
import CourseStatus from './CourseStatus';
import CourseProgress from './CourseProgress';
import CourseCertificate from './CourseCertificate';
import CourseTeacher from './CourseTeacher';
import Icon from '@/components/Icon';
import { countLessons, type Course } from '@/lib/courses/types';

/**
 * Barra lateral del curso: accesos rápidos, metadatos, avance, certificación
 * y docentes. Fija en escritorio (sticky).
 */
export default function CourseSidebar({ course, className = '' }: { course: Course; className?: string }) {
  const totalLessons = countLessons(course);

  const facts = [
    course.duration ? { icon: 'clock', label: course.duration } : null,
    course.level ? { icon: 'users', label: course.level } : null,
    course.difficulty ? { icon: 'gauge', label: course.difficulty } : null,
    course.category ? { icon: 'tag', label: course.category } : null,
    course.videos.length ? { icon: 'play', label: `${course.videos.length} videos` } : null,
    totalLessons
      ? {
          icon: 'layers',
          label: `${course.modules.length} ${course.modules.length === 1 ? 'módulo' : 'módulos'} · ${totalLessons} lecciones`,
        }
      : null,
  ].filter((f): f is { icon: string; label: string } => f !== null);

  return (
    <aside className={`space-y-5 ${className}`}>
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card lg:sticky lg:top-24">
        <div className="flex items-center justify-between gap-3">
          <CourseBadge course={course} />
          <CourseStatus course={course} />
        </div>

        {facts.length ? (
          <ul className="mt-5 space-y-3 border-t border-slate-100 pt-5">
            {facts.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <Icon name={f.icon} className="h-4 w-4 text-brand-600" />
                {f.label}
              </li>
            ))}
          </ul>
        ) : null}

        {course.updatedAt ? (
          <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-400">
            Actualizado el{' '}
            {new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' }).format(new Date(course.updatedAt))}
          </p>
        ) : null}

        <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
          <CourseProgress course={course} />
          <CourseCertificate course={course} />
        </div>
      </div>

      {course.teachers.length ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
            Docentes
          </h3>
          <CourseTeacher course={course} className="mt-4" />
        </div>
      ) : null}
    </aside>
  );
}
