import type { Course, CourseStatus } from '@/lib/courses/types';

const styles: Record<CourseStatus, string> = {
  published: 'bg-leaf-500 text-leaf-950',
  'in-development': 'bg-sun-400 text-amber-950',
  draft: 'bg-slate-200 text-slate-700',
  archived: 'bg-slate-300 text-slate-600',
};

const labels: Record<CourseStatus, string> = {
  published: 'Disponible',
  'in-development': 'En desarrollo',
  draft: 'Borrador',
  archived: 'Archivado',
};

/** Etiqueta del estado del ciclo de vida (Disponible / En desarrollo / Borrador / Archivado). */
export default function CourseStatus({ course }: { course: Course }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${styles[course.status]}`}
    >
      {labels[course.status]}
    </span>
  );
}
