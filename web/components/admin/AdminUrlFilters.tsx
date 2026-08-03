'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

export type AdminSelectOption = { value: string; label: string };

/**
 * Filtros por URL reutilizables del BackOffice: un buscador de texto y
 * selects de opciones. Actualizan `?q=...&<select>=...` sin recargar.
 */
export default function AdminUrlFilters({
  searchPlaceholder = 'Buscar…',
  selects = [],
}: {
  searchPlaceholder?: string;
  selects?: { name: string; label: string; options: AdminSelectOption[] }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setQ(searchParams.get('q') ?? ''), [searchParams]);

  const apply = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  const onSearch = (value: string) => {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => apply({ q: value.trim() || null }), 400);
  };

  const hasFilters = searchParams.get('q') || selects.some((s) => searchParams.get(s.name));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          type="search"
          value={q}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-9 w-56 rounded-lg border border-slate-300 bg-white pl-9 pr-8 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        />
        {q ? (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => onSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {selects.map((sel) => (
        <select
          key={sel.name}
          aria-label={sel.label}
          value={searchParams.get(sel.name) ?? ''}
          onChange={(e) => apply({ [sel.name]: e.target.value || null })}
          className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-semibold text-slate-700 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="">{sel.label}: todos</option>
          {sel.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
      {hasFilters ? (
        <button
          type="button"
          onClick={() => {
            setQ('');
            router.push('?');
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950"
        >
          <X className="h-4 w-4" aria-hidden="true" /> Limpiar
        </button>
      ) : null}
    </div>
  );
}
