import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Hash } from 'lucide-react';
import ContentCard, { ContentTypeBadge } from '@/components/catalog/ContentCard';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/motion/Reveal';
import {
  CONTENT_TYPE_LABELS,
  getAllTags,
  getItemsByTag,
  getTag,
  type ContentType,
} from '@/lib/taxonomy';
import { img } from '@/lib/images';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllTags().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = getTag(slug);
  if (!tag) return { title: 'Etiqueta no encontrada' };
  return {
    title: `${tag.name} — Etiqueta`,
    description: `Todo el contenido de Evolución Salud etiquetado con «${tag.name}».`,
  };
}

const TYPE_ORDER: ContentType[] = ['course', 'blog', 'podcast', 'resource', 'newsletter'];

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const tag = getTag(slug);
  if (!tag) notFound();

  const items = getItemsByTag(slug);
  const byType = new Map<ContentType, typeof items>();
  for (const type of TYPE_ORDER) {
    const typeItems = items.filter((i) => i.contentType === type);
    if (typeItems.length) byType.set(type, typeItems);
  }

  const relatedTags = items
    .flatMap((i) => i.tags)
    .filter((t) => t !== slug)
    .reduce<Map<string, number>>((acc, t) => acc.set(t, (acc.get(t) ?? 0) + 1), new Map());
  const related = Array.from(relatedTags.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <>
      <PageHero
        eyebrow="Etiqueta"
        title={
          <>
            <span className="inline-flex items-center gap-2">
              <Hash className="h-8 w-8 text-sun-400" aria-hidden="true" />
              {tag.name}
            </span>
          </>
        }
        description={`${items.length} ${items.length === 1 ? 'contenido clasificado' : 'contenidos clasificados'} con esta etiqueta.`}
        image={img.library}
      />

      <section className="container-page py-16 lg:py-24">
        {Array.from(byType.entries()).map(([type, typeItems], ti) => (
          <div key={type} className={ti > 0 ? 'mt-14' : ''}>
            <div className="flex flex-wrap items-center gap-3">
              <ContentTypeBadge type={type} />
              <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                {CONTENT_TYPE_LABELS[type]}
              </h2>
              <span className="text-sm font-semibold text-slate-500">
                {typeItems.length} {typeItems.length === 1 ? 'contenido' : 'contenidos'}
              </span>
            </div>
            <div className="mt-6 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {typeItems.map((item, i) => (
                <Reveal key={item.id} delay={(i % 3) * 0.07}>
                  <ContentCard item={item} />
                </Reveal>
              ))}
            </div>
          </div>
        ))}

        {items.length === 0 ? (
          <Reveal>
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-12 text-center">
              <Hash className="h-10 w-10 text-slate-400" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-extrabold text-slate-900">
                Sin contenido con esta etiqueta
              </h2>
              <Link href="/tags" className="btn-outline mt-6">
                Ver todas las etiquetas
              </Link>
            </div>
          </Reveal>
        ) : null}

        {related.length ? (
          <Reveal>
            <div className="mt-16 rounded-3xl bg-gradient-to-br from-brand-50 to-leaf-50 p-8">
              <h2 className="text-xl font-extrabold text-slate-900">Etiquetas relacionadas</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {related.map(([rel]) => (
                  <Link
                    key={rel}
                    href={`/tags/${rel}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-brand-200/80 bg-white px-4 py-1.5 text-xs font-semibold text-brand-700 shadow-sm transition hover:bg-brand-600 hover:text-white"
                  >
                    <Hash className="h-3 w-3" aria-hidden="true" />
                    {getTag(rel)?.name ?? rel}
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
        ) : null}

        <div className="mt-10 text-center">
          <Link href="/biblioteca" className="btn-primary">
            Explorar el catálogo completo
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
