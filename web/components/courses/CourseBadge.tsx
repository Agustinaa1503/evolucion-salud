import type { Course, CourseType } from '@/lib/courses/types';

const styles: Record<CourseType, string> = {
  free: 'bg-leaf-500 text-leaf-950',
  paid: 'bg-amber-400/90 text-amber-950',
  upcoming: 'bg-brand-600 text-white',
};

const labels: Record<CourseType, string> = {
  free: 'Gratis',
  paid: 'Pago',
  upcoming: 'Próximamente',
};

/** Etiqueta del tipo comercial del curso (Gratis / Pago / Próximamente). */
export default function CourseBadge({ course }: { course: Course }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${styles[course.type]}`}
    >
      {labels[course.type]}
    </span>
  );
}
