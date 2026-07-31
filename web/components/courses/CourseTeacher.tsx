import { GraduationCap } from 'lucide-react';
import type { Course } from '@/lib/courses/types';

/** Tarjeta de docentes del curso. */
export default function CourseTeacher({
  course,
  className = '',
}: {
  course: Course;
  className?: string;
}) {
  if (!course.teachers.length) return null;

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {course.teachers.map((teacher) => {
        const initials = teacher.name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0])
          .join('')
          .toUpperCase();
        return (
          <div
            key={teacher.name}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-leaf-600 text-sm font-bold text-white shadow-sm">
              {initials}
            </span>
            <div>
              <p className="text-sm font-bold text-white">{teacher.name}</p>
              {(teacher.role || teacher.credentials) && (
                <p className="text-xs text-slate-300">
                  {[teacher.role, teacher.credentials].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
        );
      })}
      {course.author && course.teachers.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <GraduationCap className="h-4 w-4 text-brand-300" aria-hidden="true" />
          {course.author}
        </div>
      ) : null}
    </div>
  );
}
