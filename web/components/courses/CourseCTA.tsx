import Link from 'next/link';
import { ArrowRight, Bell, ExternalLink } from 'lucide-react';
import WaitlistForm from '@/components/WaitlistForm';
import type { Course } from '@/lib/courses/types';

/**
 * CTA principal del curso. Decide la acción según `type`, `status` y `cta`
 * (ver-curso / proximamente / inscribirme / lista-espera). Para cursos
 * gratuitos abre el reproductor; para próximos lanzamientos ofrece la
 * captura de email.
 */
export default function CourseCTA({ course }: { course: Course }) {
  const upcoming =
    course.type === 'upcoming' ||
    course.cta === 'lista-espera' ||
    course.status === 'in-development';

  if (upcoming) {
    return (
      <div className="w-full max-w-lg">
        <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur">
          <Bell className="mt-0.5 h-5 w-5 shrink-0 text-sun-300" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-white">
              Quiero enterarme cuando esté disponible
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Déjenos su email y le avisaremos junto con novedades del
              lanzamiento. {course.type === 'paid' || course.status === 'in-development' ? 'Será un curso de pago.' : ''}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <WaitlistForm
            courseSlug={course.slug}
            courseTitle={course.title}
            compact
          />
        </div>
      </div>
    );
  }

  if (course.cta === 'inscribirme' || course.type === 'paid') {
    return (
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/tienda" className="btn-primary">
          Inscribirme
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        {course.price ? (
          <span className="inline-flex items-center self-center text-sm font-bold text-white">
            {new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: course.currency,
            }).format(course.price)}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {course.externalUrl ? (
        <a
          href={course.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Ver el curso (gratis)
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      ) : (
        <Link href="/descarga-gratuita" className="btn-primary">
          Empezar ahora (gratis)
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
      <Link href="/tienda" className="btn-white">
        Ver guías y recursos
      </Link>
    </div>
  );
}
