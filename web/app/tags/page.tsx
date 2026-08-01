import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Layers } from 'lucide-react';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/motion/Reveal';
import { getAllTags } from '@/lib/taxonomy';
import { img } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Etiquetas',
  description:
    'Explora el contenido de Evolución Salud por etiquetas libres: cortisol, estrés, melatonina, sueño, mindfulness y más.',
};

/** Nube de etiquetas: tamaño por cantidad de contenido asociado. */
export default function TagsPage() {
  const tags = getAllTags();
  const maxCount = Math.max(1, ...tags.map((t) => t.count));

  return (
    <>
      <PageHero
        eyebrow="Catálogo"
        title={
          <>
            Explora por <span className="text-gradient">etiquetas</span>
          </>
        }
        description="Las etiquetas se generan solas a partir del contenido: cada una agrupa cursos, artículos, episodios y recursos que comparten ese tema."
        image={img.library}
      />

      <section className="container-page py-16 lg:py-24">
        <p className="text-sm font-semibold text-slate-500">
          {tags.length} {tags.length === 1 ? 'etiqueta' : 'etiquetas'} en el catálogo
        </p>

        <Reveal>
          <div className="mt-8 flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-card">
            {tags.map((tag) => {
              const size =
                tag.count >= maxCount * 0.8
                  ? 'text-2xl font-extrabold text-brand-700'
                  : tag.count >= maxCount * 0.5
                    ? 'text-xl font-extrabold text-brand-600'
                    : tag.count >= maxCount * 0.3
                      ? 'text-base font-bold text-slate-700'
                      : 'text-sm font-semibold text-slate-500';
              return (
                <Link
                  key={tag.slug}
                  href={`/tags/${tag.slug}`}
                  title={`${tag.name} · ${tag.count} ${tag.count === 1 ? 'contenido' : 'contenidos'}`}
                  className={`rounded-full px-4 py-2 transition hover:-translate-y-0.5 hover:bg-brand-600 hover:text-white ${size}`}
                >
                  {tag.name}
                </Link>
              );
            })}
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link href="/categorias" className="btn-outline">
              <Layers className="h-4 w-4" aria-hidden="true" />
              Explorar por categorías
            </Link>
            <Link href="/biblioteca" className="btn-primary">
              Ver todo el catálogo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
