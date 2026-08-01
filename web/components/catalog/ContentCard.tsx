import Link from 'next/link';
import { ArrowRight, CalendarDays } from 'lucide-react';
import CardCover from '@/components/CardCover';
import {
  CONTENT_TYPE_LABELS,
  type ContentType,
  type TaxonomyItem,
} from '@/lib/taxonomy';
import { getCategoryName } from '@/lib/taxonomy';

/** Badge con el tipo de contenido (dato, no hardcode). */
export function ContentTypeBadge({ type }: { type: ContentType }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-600/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-700">
      {CONTENT_TYPE_LABELS[type]}
    </span>
  );
}

/**
 * Tarjeta de contenido genérica del catálogo unificado: sirve para cursos,
 * artículos, episodios, recursos y newsletter. El diseño es uniforme para
 * que cualquier contenido se vea igual en índices, categorías y tags.
 */
export default function ContentCard({ item }: { item: TaxonomyItem }) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card transition duration-500 hover:-translate-y-1.5 hover:shadow-lift">
      <Link href={item.url} className="flex flex-1 flex-col">
        <CardCover
          gradient={item.gradient ?? 'from-brand-600 to-leaf-600'}
          icon={item.icon ?? 'book'}
          image={item.image}
          className="h-44"
        />
        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-wrap items-center gap-2">
            <ContentTypeBadge type={item.contentType} />
            {item.date ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {item.date}
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-lg font-extrabold leading-snug tracking-tight text-slate-900 transition group-hover:text-brand-700">
            {item.title}
          </h3>
          {item.subtitle ? (
            <p className="mt-1 text-sm font-medium text-brand-600">{item.subtitle}</p>
          ) : null}
          <p className="mt-3 text-sm leading-relaxed text-slate-600 line-clamp-3">
            {item.description}
          </p>

          {item.categories.length ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {item.categories.slice(0, 3).map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600"
                >
                  {getCategoryName(c)}
                </span>
              ))}
            </div>
          ) : null}

          <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-bold text-brand-600">
            Explorar
            <ArrowRight
              className="h-4 w-4 transition group-hover:translate-x-1.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </Link>
    </div>
  );
}
