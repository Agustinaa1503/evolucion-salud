import { Award } from 'lucide-react';
import type { Course } from '@/lib/courses/types';

/** Aviso de certificación cuando el curso lo ofrece (`hasCertificate`). */
export default function CourseCertificate({ course }: { course: Course }) {
  if (!course.hasCertificate) return null;

  return (
    <div className="rounded-2xl border border-sun-400/50 bg-sun-400/10 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <Award className="h-4 w-4 text-amber-600" aria-hidden="true" />
        Certificado de participación
      </p>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        Al completar la formación se emitirá un certificado de participación
        de Evolución Salud. Los detalles se anunciarán junto con el lanzamiento.
      </p>
    </div>
  );
}
