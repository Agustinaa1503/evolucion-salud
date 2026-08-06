'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, Download, Loader2, Lock } from 'lucide-react';
import { getCourseCertificate, getCourseProgress } from '@/lib/lms/actions';
import type { Course } from '@/lib/courses/types';

type Props = {
  course: Course;
};

/**
 * Certificado del curso (FASE 5).
 *
 * - Invitado: pide iniciar sesión para acceder al certificado al completar.
 * - Autenticado sin completar: avisa cuánto falta (con porcentaje).
 * - Completado: genera/descarga el PDF con QR mediante una URL firmada.
 * Solo se muestra si el curso tiene `hasCertificate`.
 */
export default function CourseCertificate({ course }: Props) {
  const [authed, setAuthed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!course.hasCertificate) return;
    void getCourseProgress(course.slug)
      .then((data) => {
        setAuthed(data.authed);
        setCompleted(data.progress?.status === 'completed');
        setProgressPct(data.progress?.progressPct ?? 0);
      })
      .catch(() => undefined);
  }, [course.slug, course.hasCertificate]);

  if (!course.hasCertificate) return null;

  async function handleDownload() {
    setLoading(true);
    setError(null);
    const res = await getCourseCertificate(course.slug);
    setLoading(false);
    if (res.ok && res.signedUrl) {
      window.open(res.signedUrl, '_blank', 'noopener,noreferrer');
      setDone(`Certificado ${res.certificateNumber ?? ''} emitido.`);
    } else {
      setError(res.error ?? 'No se pudo generar el certificado.');
    }
  }

  if (!authed) {
    return (
      <div className="rounded-2xl border border-sun-400/50 bg-sun-400/10 p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Award className="h-4 w-4 text-amber-600" aria-hidden="true" />
          Certificado
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Al completar la formación recibirá un certificado de
          Evolución Salud. Inicie sesión para descargarlo al terminar el curso.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(`/cursos/${course.slug}`)}`}
          className="btn-outline mt-3"
        >
          <Lock className="h-4 w-4" aria-hidden="true" />
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (!completed) {
    return (
      <div className="rounded-2xl border border-sun-400/50 bg-sun-400/10 p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Award className="h-4 w-4 text-amber-600" aria-hidden="true" />
          Certificado
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Complete todas las lecciones para obtener su certificado. Progreso actual:{' '}
          <span className="font-bold text-slate-800">{progressPct}%</span>.
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-leaf-600"
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-leaf-300/60 bg-leaf-50 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-leaf-800">
        <Award className="h-4 w-4 text-leaf-600" aria-hidden="true" />
        Certificado
      </p>
      <p className="mt-1 text-xs leading-relaxed text-leaf-700">
        ¡Felicitaciones! Completó el curso. Descargue su certificado en PDF con
        código QR de verificación.
      </p>
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="btn-primary mt-3"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )}
        {loading ? 'Generando…' : 'Descargar certificado'}
      </button>
      {done ? <p className="mt-2 text-xs font-semibold text-leaf-700">{done}</p> : null}
      {error ? <p className="mt-2 text-xs font-semibold text-clay-800">{error}</p> : null}
    </div>
  );
}
