import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Search } from 'lucide-react';
import CourseCard from '@/components/CourseCard';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/motion/Reveal';
import { getMyFavorites } from '@/lib/lms/actions';

export const metadata: Metadata = {
  title: 'Mis favoritos',
  description: 'Los cursos que guardó como favoritos en Evolución Salud.',
  robots: { index: false, follow: false },
};

export default async function MisFavoritosPage() {
  const { courses } = await getMyFavorites();

  return (
    <>
      <PageHero
        eyebrow="Su biblioteca"
        title={
          <>
            Cursos <span className="text-gradient">favoritos</span>
          </>
        }
        description="Los cursos que marcó para tenerlos a mano. Retome donde quedó o descubra el próximo lanzamiento."
      />

      <section className="container-page py-16 lg:py-24">
        {courses.length ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  {courses.length} {courses.length === 1 ? 'curso guardado' : 'cursos guardados'}
                </h2>
                <p className="mt-2 max-w-xl text-slate-600">
                  Toque el corazón de un curso para quitarlo de esta lista.
                </p>
              </div>
            </div>
            <div className="mt-8 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, i) => (
                <Reveal key={course.slug} delay={i * 0.07}>
                  <CourseCard course={course} />
                </Reveal>
              ))}
            </div>
          </>
        ) : (
          <Reveal>
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-12 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-leaf-600 text-white shadow-lift">
                <Heart className="h-8 w-8" aria-hidden="true" />
              </span>
              <h3 className="mt-6 text-xl font-extrabold text-slate-900">
                Todavía no tiene cursos favoritos
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-600">
                Explore el catálogo y toque el corazón en cualquier curso para
                guardarlo aquí.
              </p>
              <Link href="/cursos" className="btn-primary mt-6">
                <Search className="h-4 w-4" aria-hidden="true" />
                Explorar cursos
              </Link>
            </div>
          </Reveal>
        )}
      </section>
    </>
  );
}
