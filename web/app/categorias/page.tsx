import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Tag } from 'lucide-react';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/motion/Reveal';
import { getCategoryGroupsWithCounts, getPublicItems } from '@/lib/taxonomy';
import { img } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Categorías',
  description:
    'Explora el contenido de Evolución Salud por categoría: PINE, estrés, neurociencias, sueño, hábitos, bienestar y más.',
};

export default function CategoriasPage() {
  const groups = getCategoryGroupsWithCounts();
  const totalItems = getPublicItems().length;

  return (
    <>
      <PageHero
        eyebrow="Catálogo"
        title={
          <>
            Explora por <span className="text-gradient">categorías</span>
          </>
        }
        description="Un solo sistema de clasificación para cursos, artículos, podcast y recursos. Elegí un tema y encontrá todo el contenido relacionado."
        image={img.library}
      />

      <section className="container-page py-16 lg:py-24">
        <p className="text-sm font-semibold text-slate-500">
          {totalItems} contenidos clasificados · 37 categorías
        </p>

        <div className="mt-8 space-y-12">
          {groups.map(({ group, items }, gi) => (
            <Reveal key={group} delay={gi * 0.05}>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                  {group}
                </h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/categorias/${cat.slug}`}
                      className="group flex h-full flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card transition duration-500 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift"
                    >
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 transition group-hover:text-brand-700">
                          {cat.name}
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {cat.count} {cat.count === 1 ? 'contenido' : 'contenidos'}
                        </p>
                      </div>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600">
                        Ver contenido
                        <ArrowRight
                          className="h-4 w-4 transition group-hover:translate-x-1.5"
                          aria-hidden="true"
                        />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
            <Link href="/tags" className="btn-outline">
              <Tag className="h-4 w-4" aria-hidden="true" />
              Explorar por etiquetas
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
