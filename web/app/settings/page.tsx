import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PageHero from '@/components/PageHero';
import { SettingsForm, ChangePasswordForm } from '@/components/auth/SettingsForm';
import { requireUser } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Configuración',
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  await requireUser();

  return (
    <>
      <PageHero
        eyebrow="Mi cuenta"
        title="Configuración"
        description="Administre sus preferencias, notificaciones y seguridad."
      />

      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="card p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">Preferencias</h2>
            <p className="mt-1 text-sm text-slate-500">
              Elija qué comunicaciones desea recibir.
            </p>
            <div className="mt-6">
              <SettingsForm />
            </div>
          </div>

          <div className="card p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">Seguridad</h2>
            <p className="mt-1 text-sm text-slate-500">
              Mantenga su cuenta protegida con una contraseña segura.
            </p>
            <div className="mt-6">
              <ChangePasswordForm />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/profile" className="btn-outline">
            Ir a mi perfil
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/cursos" className="btn-secondary">
            Explorar cursos
          </Link>
        </div>
      </section>
    </>
  );
}
