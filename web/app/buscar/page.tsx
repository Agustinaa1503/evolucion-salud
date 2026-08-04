import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FileText, GraduationCap, Package, SearchX } from 'lucide-react';
import CourseCard from '@/components/CourseCard';
import ProductCard from '@/components/ProductCard';
import SearchBox from '@/components/SearchBox';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/motion/Reveal';
import { getAllCourses } from '@/lib/courses/registry';
import { blogPosts } from '@/lib/data/blog';
import { products } from '@/lib/data/products';
import { normalizeSearchTerm, searchAll } from '@/lib/search';
import { isPublicCourse } from '@/lib/courses/types';
import { img } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Buscar',
  description:
    'Encuentre cursos, productos y artículos de PsicoInmunoNeuroEndocrinología (PINE) en Evolución Salud.',
};

type Props = { searchParams: Promise<{ q?: string }> };

export default async function BuscarPage({ searchParams }: Props) {
  const { q = '' } = await searchParams;
  const query = normalizeSearchTerm(q);

  const publicCourses = getAllCourses().filter(isPublicCourse);
  const { courses, posts, products: productHits } = searchAll(publicCourses, blogPosts, q, products);
  const total = courses.length + posts.length + productHits.length;

  return (
    <>
      <PageHero
        eyebrow="Búsqueda"
        title={
          <>
            Buscar en <span className="text-gradient">Evolución Salud</span>
          </>
        }
        description="Cursos, guías y artículos sobre PINE: mente, cuerpo, emociones, hábitos y salud."
        image={img.library}
      />

      <section className="container-page py-16 lg:py-24">
        <Reveal>
          <SearchBox className="mx-auto max-w-2xl" />
        </Reveal>

        {query ? (
          <div className="mt-10">
            <p className="text-sm font-semibold text-slate-500">
              {total > 0
                ? `${total} ${total === 1 ? 'resultado' : 'resultados'} para «${q.trim()}»`
                : `Sin resultados para «${q.trim()}»`}
            </p>

            {total === 0 ? (
              <Reveal>
                <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-12 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-leaf-600 text-white shadow-lift">
                    <SearchX className="h-8 w-8" aria-hidden="true" />
                  </span>
                  <h2 className="mt-6 text-xl font-extrabold text-slate-900">
                    No encontramos nada con ese término
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-slate-600">
                    Pruebe con palabras como «estrés», «sueño», «PINE» o
                    «cirugía», o explore el catálogo de cursos y productos.
                  </p>
                  <Link href="/cursos" className="btn-primary mt-6">
                    <GraduationCap className="h-4 w-4" aria-hidden="true" />
                    Ver todos los cursos
                  </Link>
                </div>
              </Reveal>
            ) : null}

            {courses.length ? (
              <>
                <h2 className="mt-10 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  Cursos
                </h2>
                <div className="mt-6 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                  {courses.map((hit, i) => (
                    <Reveal key={hit.slug} delay={i * 0.07}>
                      <CourseCard course={hit.course} />
                    </Reveal>
                  ))}
                </div>
              </>
            ) : null}

            {posts.length ? (
              <>
                <h2 className="mt-14 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  Artículos del blog
                </h2>
                <ul className="mt-6 grid gap-5 md:grid-cols-2">
                  {posts.map((hit, i) => (
                    <Reveal key={hit.slug} delay={i * 0.06}>
                      <li>
                        <Link
                          href={`/blog/${hit.slug}`}
                          className="group flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card transition duration-500 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift"
                        >
                          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                            {hit.category}
                          </span>
                          <h3 className="mt-2 text-lg font-extrabold leading-snug text-slate-900 transition group-hover:text-brand-700">
                            {hit.title}
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-3">
                            {hit.description}
                          </p>
                          <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-brand-600">
                            Leer artículo
                            <ArrowRight
                              className="h-4 w-4 transition group-hover:translate-x-1.5"
                              aria-hidden="true"
                            />
                          </span>
                        </Link>
                      </li>
                    </Reveal>
                  ))}
                </ul>
              </>
            ) : null}

            {productHits.length ? (
              <>
                <h2 className="mt-14 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  Productos
                </h2>
                <div className="mt-6 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                  {productHits.map((hit, i) => (
                    <Reveal key={hit.slug} delay={i * 0.07}>
                      <ProductCard product={hit.product} />
                    </Reveal>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <Reveal>
            <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-12 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-leaf-600 text-white shadow-lift">
                <FileText className="h-8 w-8" aria-hidden="true" />
              </span>
              <h2 className="mt-6 text-xl font-extrabold text-slate-900">
                Escriba un término para empezar
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-600">
                Buscamos en el título, la descripción, las keywords y el
                contenido de los cursos, productos y artículos. Sin tildes ni
                mayúsculas es lo mismo: lo normalizamos por usted.
              </p>
            </div>
          </Reveal>
        )}
      </section>
    </>
  );
}
