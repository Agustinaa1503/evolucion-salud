import type { Metadata } from 'next';
import { CalendarDays, Mail, ShieldCheck, UserRound } from 'lucide-react';
import PageHero from '@/components/PageHero';
import ProfileForm from '@/components/auth/ProfileForm';
import SignOutButton from '@/components/auth/SignOutButton';
import { requireUser } from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/config';

export const metadata: Metadata = {
  title: 'Mi perfil',
  robots: { index: false, follow: false },
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export default async function ProfilePage() {
  const { user, profile } = await requireUser();

  const initials = `${profile?.nombre?.[0] ?? ''}${profile?.apellido?.[0] ?? ''}`
    .toUpperCase() || 'ES';

  return (
    <>
      <PageHero
        eyebrow="Mi cuenta"
        title="Mi perfil"
        description="Administre sus datos personales y la información de su cuenta."
      />

      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-3">
          <aside className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-brand-100 text-2xl font-extrabold text-brand-700 ring-1 ring-slate-200">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt="Foto de perfil"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    {[profile?.nombre, profile?.apellido].filter(Boolean).join(' ') ||
                      'Sin nombre'}
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1 text-xs font-semibold text-leaf-700">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    {ROLES[profile?.rol as keyof typeof ROLES] ?? 'Alumno'}
                  </span>
                </div>
              </div>

              <dl className="mt-6 space-y-4 border-t border-slate-100 pt-6 text-sm">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                  <div>
                    <dt className="font-medium text-slate-700">Email</dt>
                    <dd className="text-slate-500">{user.email}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <UserRound className="mt-0.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                  <div>
                    <dt className="font-medium text-slate-700">Email verificado</dt>
                    <dd className="text-slate-500">
                      {user.email_confirmed_at ? 'Sí' : 'No'}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarDays
                    className="mt-0.5 h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="font-medium text-slate-700">Miembro desde</dt>
                    <dd className="text-slate-500">{formatDate(profile?.created_at)}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarDays
                    className="mt-0.5 h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="font-medium text-slate-700">Último acceso</dt>
                    <dd className="text-slate-500">
                      {formatDate(profile?.last_sign_in_at)}
                    </dd>
                  </div>
                </div>
              </dl>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <SignOutButton />
              </div>
            </div>
          </aside>

          <div className="lg:col-span-2">
            <div className="card p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900">Datos personales</h2>
              <p className="mt-1 text-sm text-slate-500">
                Estos datos se usan para personalizar sus certificados y su
                experiencia de aprendizaje.
              </p>
              <div className="mt-6">
                <ProfileForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
