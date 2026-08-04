import type { Metadata } from 'next';
import Link from 'next/link';
import { Library, ShoppingBag } from 'lucide-react';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/motion/Reveal';
import LicenseCard from '@/components/shop/LicenseCard';
import { getMyLibrary } from '@/lib/shop/actions';

export const metadata: Metadata = {
  title: 'Mi biblioteca',
  description: 'Los productos digitales que compraste en Evolución Salud.',
  robots: { index: false, follow: false },
};

export default async function MiBibliotecaPage() {
  const library = await getMyLibrary();

  return (
    <>
      <PageHero
        eyebrow="Biblioteca digital"
        title={
          <>
            Mi <span className="text-gradient">biblioteca</span>
          </>
        }
        description="Todos tus productos digitales en un solo lugar. Descargá cuando quieras."
      />

      <section className="container-page py-16 lg:py-24">
        {library.length > 0 ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  {library.length} {library.length === 1 ? 'producto' : 'productos'}
                </h2>
                <p className="mt-2 max-w-xl text-slate-600">
                  Tus descargables quedan disponibles para siempre. Volvé cuando
                  necesites volver a descargarlos.
                </p>
              </div>
            </div>
            <div className="mt-8 grid gap-7 md:grid-cols-2">
              {library.map((access, i) => (
                <Reveal key={access.license.id} delay={i * 0.07}>
                  <LicenseCard access={access} />
                </Reveal>
              ))}
            </div>
          </>
        ) : (
          <Reveal>
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-12 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-leaf-600 text-white shadow-lift">
                <Library className="h-8 w-8" aria-hidden="true" />
              </span>
              <h3 className="mt-6 text-xl font-extrabold text-slate-900">
                Todavía no tenés productos
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-600">
                Cuando compres una guía, un checklist o cualquier material
                digital, lo vas a encontrar acá y en tu email.
              </p>
              <Link href="/tienda" className="btn-primary mt-6">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                Explorar la tienda
              </Link>
            </div>
          </Reveal>
        )}
      </section>
    </>
  );
}
