import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Layers, Tag } from 'lucide-react';
import ContentCard, { ContentTypeBadge } from '@/components/catalog/ContentCard';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/motion/Reveal';
import {
  CONTENT_TYPE_LABELS,
  getAllCategories,
  getCategory,
  getCategoryName,
  getItemsByCategory,
  getPublicItems,
  type ContentType,
} from '@/lib/taxonomy';
import { img } from '@/lib/images';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: 'Categoría no encontrada' };
  return {
    title: `${category.name} — Categoría`,
    description:
      category.description ??
      `Todo el contenido de Evolución Salud sobre ${category.name}.`,
  };
}

const TYPE_ORDER: ContentType[] = ['course', 'blog', 'podcast', 'product', 'newsletter'];

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const items = getItemsByCategory(slug);
  const byType = new Map<ContentType, typeof items>();
  for (const type of TYPE_ORDER) {
    const typeItems = items.filter((i) => i.contentType === type);
    if (typeItems.length) byType.set(type, typeItems);
  }

  const relatedCategories = getPublicItems()
    .filter((i) => i.categories.includes(slug))
    .flatMap((i) => i.categories)
    .filter((c) => c !== slug)
    .reduce<Map<string, number>>((acc, c) => acc.set(c, (acc.get(c) ?? 0) + 1), new Map());
  const related = Array.from(relatedCategories.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <>
      <PageHero
        eyebrow="Categoría"
        title={
          <>
            {category.name} <span className="text-gradient">· {items.length}</span>
          </>
        }
        description={category.description}
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
              <Layers className="h-10 w-10 text-slate-400" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-extrabold text-slate-900">
                Todavía no hay contenido en esta categoría
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                El equipo está trabajando en nuevos materiales para esta sección.
              </p>
              <Link href="/categorias" className="btn-outline mt-6">
                Ver todas las categorías
              </Link>
            </div>
          </Reveal>
        ) : null}

        {related.length ? (
          <Reveal>
            <div className="mt-16 rounded-3xl bg-gradient-to-br from-brand-50 to-leaf-50 p-8">
              <h2 className="text-xl font-extrabold text-slate-900">
                Categorías relacionadas
              </h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {related.map(([slugRel]) => (
                  <Link
                    key={slugRel}
                    href={`/categorias/${slugRel}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-brand-200/80 bg-white px-4 py-1.5 text-xs font-semibold text-brand-700 shadow-sm transition hover:bg-brand-600 hover:text-white"
                  >
                    <Tag className="h-3 w-3" aria-hidden="true" />
                    {getCategoryName(slugRel)}
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
