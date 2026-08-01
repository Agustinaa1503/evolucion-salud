import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchX, Tag } from 'lucide-react';
import ContentCard from '@/components/catalog/ContentCard';
import CatalogFilters from '@/components/catalog/CatalogFilters';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/motion/Reveal';
import {
  CONTENT_TYPE_LABELS,
  filterItems,
  getFilterOptions,
  getPublicItems,
  type CatalogFilters as CatalogFiltersType,
} from '@/lib/taxonomy';
import { getLevelName } from '@/lib/taxonomy';
import { getAudienceName } from '@/lib/taxonomy';
import { getCategoryName } from '@/lib/taxonomy';
import { img } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Catálogo',
  description:
    'Todo el contenido de Evolución Salud en un solo lugar: cursos, blog, podcast y recursos. Filtra por categoría, nivel, audiencia, tipo y estado.',
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Etiquetas humanas de los filtros activos (para los chips). */
function activeFilterLabels(filters: CatalogFiltersType): string[] {
  const labels: string[] = [];
  if (filters.category) labels.push(getCategoryName(filters.category));
  if (filters.level) labels.push(getLevelName(filters.level) ?? filters.level);
  if (filters.audience) labels.push(getAudienceName(filters.audience) ?? filters.audience);
  if (filters.type && filters.type !== 'all') labels.push(CONTENT_TYPE_LABELS[filters.type]);
  if (filters.status && filters.status !== 'all') labels.push(`Estado: ${filters.status}`);
  return labels;
}

export default async function BibliotecaPage({ searchParams }: Props) {
  const raw = await searchParams;
  const str = (k: string): string | undefined => {
    const v = raw[k];
    return typeof v === 'string' && v ? v : undefined;
  };

  const filters: CatalogFiltersType = {
    category: str('category'),
    level: str('level'),
    audience: str('audience'),
    type: str('type') as CatalogFiltersType['type'],
    status: str('status') as CatalogFiltersType['status'],
    query: str('q'),
  };

  const allItems = getPublicItems();
  const items = filterItems(allItems, filters);
  const options = getFilterOptions();
  const activeLabels = activeFilterLabels(filters);

  return (
    <>
      <PageHero
        eyebrow="Catálogo"
        title={
          <>
            Todo el contenido, <span className="text-gradient">en un solo lugar</span>
          </>
        }
        description="Cursos, artículos, podcast y recursos descargables, clasificados con un mismo sistema de categorías y etiquetas."
        image={img.library}
      />

      <section className="container-page py-16 lg:py-24">
        <CatalogFilters options={options} />

        <div className="mt-10">
          <p className="text-sm font-semibold text-slate-500">
            {items.length} {items.length === 1 ? 'contenido' : 'contenidos'}
            {filters.query ? (
              <>
                {' '}
                para «<span className="text-brand-700">{filters.query}</span>»
              </>
            ) : null}
            {activeLabels.length ? (
              <span className="ml-2 inline-flex flex-wrap gap-1.5 align-middle">
                {activeLabels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700"
                  >
                    {label}
                  </span>
                ))}
              </span>
            ) : null}
          </p>

          {items.length ? (
            <div className="mt-6 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item, i) => (
                <Reveal key={item.id} delay={(i % 3) * 0.07}>
                  <ContentCard item={item} />
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal>
              <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-12 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-leaf-600 text-white shadow-lift">
                  <SearchX className="h-8 w-8" aria-hidden="true" />
                </span>
                <h2 className="mt-6 text-xl font-extrabold text-slate-900">
                  No encontramos contenido con esos filtros
                </h2>
                <p className="mt-2 max-w-md text-sm text-slate-600">
                  Proba quitar algún filtro o buscar con otro término.
                </p>
                <Link href="/biblioteca" className="btn-primary mt-6">
                  Ver todo el catálogo
                </Link>
              </div>
            </Reveal>
          )}
        </div>

        <Reveal>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
            <Link href="/categorias" className="btn-outline">
              Explorar por categorías
            </Link>
            <Link href="/tags" className="btn-outline">
              <Tag className="h-4 w-4" aria-hidden="true" />
              Explorar por etiquetas
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
