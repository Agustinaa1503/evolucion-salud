import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Lock } from 'lucide-react';
import PageHero from '@/components/PageHero';
import LicenseCard from '@/components/shop/LicenseCard';
import { getAccessByToken } from '@/lib/shop/actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mi descargable',
  description: 'Acceso a tu material de Evolución Salud.',
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

export default async function AccesoPage({ params }: Props) {
  const { token } = await params;
  const access = await getAccessByToken(token);

  if (!access) notFound();

  return (
    <>
      <PageHero
        eyebrow="Biblioteca digital"
        title={
          <>
            Tu <span className="text-gradient">descargable</span>
          </>
        }
        description="Material psicoeducativo de Evolución Salud listo para descargar."
      />

      <section className="container-page pb-20 pt-2 lg:pb-28">
        <div className="mx-auto max-w-3xl">
          <LicenseCard access={access} token={token} />

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <p>
              Este enlace es personal e intransferible. Si recibiste la compra
              en otra dirección, revisá también la carpeta de spam o escribinos
              a{' '}
              <a
                href="mailto:profesionales@evolucionsalud.com"
                className="font-semibold text-brand-700 hover:underline"
              >
                profesionales@evolucionsalud.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
