'use client';

import { Eye } from 'lucide-react';

type Props = {
  slug?: string;
  label?: string;
};

export default function PreviewCertificateButton({ slug, label = 'Vista previa de certificado' }: Props) {
  const handleClick = () => {
    const url = slug
      ? `/api/admin/certificates/preview?slug=${encodeURIComponent(slug)}`
      : '/api/admin/certificates/preview';
    window.open(url, '_blank');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      <Eye className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
