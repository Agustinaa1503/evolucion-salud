'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

/**
 * Buscador del BackOffice. Al escribir (con debounce) o enviar navega a
 * `/admin/buscar?q=...`, que busca en usuarios, cursos, blog y recursos.
 */
export default function AdminSearchInput({
  initial,
  className = '',
}: {
  initial?: string;
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setValue(initial ?? ''), [initial]);

  const submit = (query: string) => {
    const q = query.trim();
    if (!q) return;
    router.push(`/admin/buscar?q=${encodeURIComponent(q)}`);
  };

  const onChange = (q: string) => {
    setValue(q);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (q.trim()) submit(q);
    }, 500);
  };

  return (
    <form
      className={`relative ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}
      role="search"
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar en el BackOffice…"
        className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-8 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      />
      {value ? (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => setValue('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </form>
  );
}
