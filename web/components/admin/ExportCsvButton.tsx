'use client';

import { Download } from 'lucide-react';
import { toCsv } from '@/lib/admin/format';

/**
 * Descarga un CSV (separador `;`, BOM para Excel) con los datos ya cargados
 * en la página. El nombre de archivo incluye la fecha del día.
 */
export default function ExportCsvButton({
  filename,
  headers,
  rows,
  label = 'Exportar CSV',
}: {
  filename: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
  label?: string;
}) {
  const download = () => {
    const csv = toCsv(headers, rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={download}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
