'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RotateCcw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CONTENT_TYPE_LABELS, type ContentType, type ContentStatus } from '@/lib/taxonomy/types';

/**
 * Controles de filtro del catálogo unificado. Los valores (categorías,
 * niveles, audiencias, tipos y estados) llegan por `options`, calculados
 * desde los datos en el servidor: el componente no hardcodea ninguna opción.
 *
 * Cambiar un filtro actualiza la URL (`/biblioteca?category=...`), de modo
 * que el resultado queda con estado compartible y el SSR lo renderiza.
 */
export default function CatalogFilters({
  options,
}: {
  options: {
    categories: { group: string; items: { slug: string; name: string; count: number }[] }[];
    levels: { slug: string; name: string }[];
    audiences: { slug: string; name: string; count: number }[];
    types: ContentType[];
    statuses: ContentStatus[];
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function submitQuery(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) params.set('q', query.trim());
    else params.delete('q');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function clearAll() {
    setQuery('');
    router.push(pathname);
  }

  const current = Object.fromEntries(searchParams.entries());
  const activeCount = ['category', 'level', 'audience', 'type', 'status'].filter(
    (k) => current[k]
  ).length;

  const selectCls =
    'w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200';

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-slate-900">Filtrar contenido</h2>
        {activeCount > 0 || current.q ? (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Limpiar filtros ({activeCount + (current.q ? 1 : 0)})
          </button>
        ) : null}
      </div>

      <form onSubmit={submitQuery} className="relative mt-5">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar en el catálogo…"
          aria-label="Buscar en el catálogo"
          className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-200"
        />
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Categoría
          </label>
          <select
            value={current.category ?? ''}
            onChange={(e) => update('category', e.target.value)}
            className={selectCls}
          >
            <option value="">Todas</option>
            {options.categories.map(({ group, items }) => (
              <optgroup key={group} label={group}>
                {items.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name} ({c.count})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Nivel
          </label>
          <select
            value={current.level ?? ''}
            onChange={(e) => update('level', e.target.value)}
            className={selectCls}
          >
            <option value="">Todos</option>
            {options.levels.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Audiencia
          </label>
          <select
            value={current.audience ?? ''}
            onChange={(e) => update('audience', e.target.value)}
            className={selectCls}
          >
            <option value="">Todas</option>
            {options.audiences.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name} ({a.count})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Tipo
          </label>
          <div className="flex flex-wrap gap-1.5">
            {options.types.map((t) => {
              const active = (current.type ?? 'all') === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => update('type', active ? 'all' : t)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    active
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-300'
                  }`}
                >
                  {CONTENT_TYPE_LABELS[t]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Estado
          </label>
          <select
            value={current.status ?? ''}
            onChange={(e) => update('status', e.target.value)}
            className={selectCls}
          >
            <option value="">Todos</option>
            {options.statuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s] ?? s}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

const STATUS_LABELS: Partial<Record<ContentStatus, string>> = {
  published: 'Publicado',
  'in-development': 'En desarrollo',
  upcoming: 'Próximamente',
  draft: 'Borrador',
};
