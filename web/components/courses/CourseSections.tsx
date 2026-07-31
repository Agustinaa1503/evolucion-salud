import type { Course } from '@/lib/courses/types';
import CourseDescription from './CourseDescription';

/**
 * Renderiza las secciones de prosa del curso en orden de aparición
 * (introducción, programa, bibliografía, CTA...). Las secciones con datos
 * estructurados (videos, recursos, cuestionario, módulos, FAQ) se muestran
 * con sus componentes dedicados, no aquí, para evitar duplicados.
 */
export default function CourseSections({ course, className = '' }: { course: Course; className?: string }) {
  const proseTypes = new Set(['intro', 'program', 'cta', 'generic']);
  const prose = course.sections.filter((s) => proseTypes.has(s.type));

  if (!prose.length) return null;

  return (
    <div className={className}>
      {prose.map((section, i) => (
        <CourseDescription
          key={`${section.type}-${i}`}
          title={section.type === 'cta' ? section.title : undefined}
          html={section.html ?? ''}
        />
      ))}
    </div>
  );
}
