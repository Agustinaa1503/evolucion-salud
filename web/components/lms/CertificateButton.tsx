'use client';

import { useState } from 'react';
import { Award, Download, Loader2 } from 'lucide-react';
import { getCourseCertificate } from '@/lib/lms/actions';

type Props = {
  courseSlug: string;
  className?: string;
};

/** Botón de descarga del certificado (FASE 5). Abre la URL firmada del PDF. */
export default function CertificateButton({ courseSlug, className = '' }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    const res = await getCourseCertificate(courseSlug);
    setLoading(false);
    if (res.ok && res.signedUrl) {
      window.open(res.signedUrl, '_blank', 'noopener,noreferrer');
    } else {
      setError(res.error ?? 'No se pudo generar el certificado.');
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className={`btn-outline w-full ${className}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Award className="h-4 w-4" aria-hidden="true" />
        )}
        {loading ? 'Generando…' : 'Descargar certificado'}
        <Download className="h-4 w-4" aria-hidden="true" />
      </button>
      {error ? <p className="mt-1.5 text-xs font-semibold text-clay-800">{error}</p> : null}
    </div>
  );
}
