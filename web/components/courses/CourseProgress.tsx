import { Clock, UserRound } from 'lucide-react';
import type { Course } from '@/lib/courses/types';

/**
 * Indicador de avance. Hoy los cursos son autoasistidos y el avance se
 * registra en el reproductor externo; cuando la plataforma tenga cuentas
 * de usuario se conectará el progreso real.
 */
export default function CourseProgress({ course }: { course: Course }) {
  const total = course.videos.length;
  if (!total) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <UserRound className="h-4 w-4 text-brand-600" aria-hidden="true" />
        Avance a su ritmo
      </p>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        Curso autoasistido de {total} {total === 1 ? 'video' : 'videos'}. El
        progreso se guarda en el reproductor mientras la plataforma incorpora
        cuentas de usuario.
      </p>
      <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        {course.duration ?? 'A definir'}
      </div>
    </div>
  );
}
