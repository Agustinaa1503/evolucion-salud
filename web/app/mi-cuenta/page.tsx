import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Inbox,
  Library,
  Trophy,
} from 'lucide-react';
import PageHero from '@/components/PageHero';
import { requireUser } from '@/lib/auth/session';
import { getMyLearning } from '@/lib/lms/actions';
import { formatStudyTime } from '@/lib/lms/progress';
import { getCourse } from '@/lib/courses/registry';
import { getMyLibrary } from '@/lib/shop/actions';
import { getServerSupabaseClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Mi cuenta',
  description: 'Centro digital unificado: progreso académico, biblioteca de productos y certificados.',
  robots: { index: false, follow: false },
};

type CertificateEntry = {
  id: string;
  certificate_number: string;
  issued_at: string;
  course_id: string;
  course_title: string;
};

async function getMyCertificates(userId: string, supabase: NonNullable<ReturnType<typeof getServerSupabaseClient>>): Promise<CertificateEntry[]> {
  const { data: certs } = await supabase
    .from('certificates')
    .select('id, certificate_number, issued_at, course_id')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false });

  if (!certs?.length) return [];

  const { data: catalogRows } = await supabase.from('courses').select('id, slug');
  const slugById = new Map((catalogRows ?? []).map((r) => [r.id, r.slug]));

  return certs.map((c) => {
    const slug = slugById.get(c.course_id);
    const course = slug ? getCourse(slug) : null;
    return {
      ...c,
      course_title: course?.title ?? slug ?? 'Curso',
    };
  });
}

export default async function MiCuentaPage() {
  const { user, profile } = await requireUser();
  const supabase = getServerSupabaseClient();

  const [learning, library, certificates] = await Promise.all([
    getMyLearning(),
    supabase ? getMyLibrary() : Promise.resolve([]),
    supabase ? getMyCertificates(user.id, supabase) : Promise.resolve([]),
  ]);

  const fullName = [profile?.nombre, profile?.apellido].filter(Boolean).join(' ') || 'Usuario';

  return (
    <>
      <PageHero
        eyebrow="Centro digital"
        title={`Bienvenido, ${profile?.nombre || 'Usuario'}`}
        description="Su panel unificado con progreso académico, productos adquiridos y certificados."
      />

      <section className="container-page py-12 lg:py-16">
        {/* Resumen rápido */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/mi-aprendizaje"
            className="group flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:shadow-lift hover:border-brand-300"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-extrabold text-slate-900">{learning.stats.inProgress + learning.stats.completed}</p>
              <p className="text-sm font-medium text-slate-500">Cursos</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-brand-600" aria-hidden="true" />
          </Link>

          <Link
            href="/mi-aprendizaje"
            className="group flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:shadow-lift hover:border-leaf-300"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-leaf-50 text-leaf-600">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-extrabold text-slate-900">{learning.stats.completed}</p>
              <p className="text-sm font-medium text-slate-500">Completados</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-leaf-600" aria-hidden="true" />
          </Link>

          <Link
            href="/mi-biblioteca"
            className="group flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:shadow-lift hover:border-clay-300"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clay-50 text-clay-600">
              <Library className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-extrabold text-slate-900">{library.length}</p>
              <p className="text-sm font-medium text-slate-500">Productos</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-clay-600" aria-hidden="true" />
          </Link>

          <div className="flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sun-50 text-sun-600">
              <Trophy className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-extrabold text-slate-900">{certificates.length}</p>
              <p className="text-sm font-medium text-slate-500">Certificados</p>
            </div>
          </div>
        </div>

        {/* Contenido principal en dos columnas */}
        <div className="mt-14 grid gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            {/* Cursos en curso */}
            <section>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-brand-700" aria-hidden="true" />
                  <h2 className="text-lg font-extrabold text-slate-900">Mis cursos</h2>
                </div>
                <Link
                  href="/mi-aprendizaje"
                  className="text-sm font-semibold text-brand-700 hover:text-brand-800 transition"
                >
                  Ver todo
                </Link>
              </div>

              {learning.courses.length === 0 ? (
                <div className="mt-4 flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 p-10 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-card">
                    <Inbox className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-slate-800">Aún no inscribiste cursos</h3>
                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Cuando comiences un curso, aparecerá acá con tu avance.
                  </p>
                  <Link href="/cursos" className="btn-primary mt-4 text-sm">
                    Explorar cursos
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {learning.courses.slice(0, 4).map((c) => (
                    <Link
                      key={c.slug}
                      href={`/cursos/${c.slug}`}
                      className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition hover:shadow-lift hover:border-brand-300"
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        c.status === 'completed' ? 'bg-leaf-50 text-leaf-600' : 'bg-brand-50 text-brand-600'
                      }`}>
                        {c.status === 'completed'
                          ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                          : <BookOpen className="h-5 w-5" aria-hidden="true" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{c.title}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-full rounded-full transition-all ${
                                c.status === 'completed'
                                  ? 'bg-leaf-500'
                                  : 'bg-gradient-to-r from-brand-500 to-leaf-600'
                              }`}
                              style={{ width: `${c.progressPct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500">{c.progressPct}%</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Productos adquiridos */}
            <section>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Library className="h-5 w-5 text-clay-700" aria-hidden="true" />
                  <h2 className="text-lg font-extrabold text-slate-900">Mi biblioteca</h2>
                </div>
                <Link
                  href="/mi-biblioteca"
                  className="text-sm font-semibold text-clay-700 hover:text-clay-800 transition"
                >
                  Ver todo
                </Link>
              </div>

              {library.length === 0 ? (
                <div className="mt-4 flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 p-10 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-card">
                    <FileText className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-slate-800">Sin productos adquiridos</h3>
                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Explore nuestra tienda de guías, ebooks y recursos premium.
                  </p>
                  <Link href="/tienda" className="btn-primary mt-4 text-sm">
                    Ir a la tienda
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {library.slice(0, 4).map((entry) => (
                    <Link
                      key={entry.license.id}
                      href={`/acceso/${entry.license.access_token}`}
                      className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition hover:shadow-lift hover:border-clay-300"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clay-50 text-clay-600">
                        <Download className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{entry.product.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{entry.product.format}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {entry.assets.slice(0, 2).map((a) => (
                            <span
                              key={a.slug}
                              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600"
                            >
                              <Download className="h-2.5 w-2.5" aria-hidden="true" />
                              {a.title || a.file_name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-clay-600" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar: Certificados */}
          <aside>
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-sun-600" aria-hidden="true" />
              <h2 className="text-lg font-extrabold text-slate-900">Certificados</h2>
            </div>

            {certificates.length === 0 ? (
              <div className="mt-4 flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-card">
                  <Trophy className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-500">
                  Complete un curso con certificado para obtener su diploma.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card"
                  >
                    <p className="text-sm font-bold text-slate-900 line-clamp-1">{cert.course_title}</p>
                    <p className="mt-1 font-mono text-xs font-semibold text-brand-700">{cert.certificate_number}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <time className="text-[11px] text-slate-400">
                        {new Date(cert.issued_at).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </time>
                      <Link
                        href={`/verificar/${cert.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-brand-700 hover:text-brand-800 transition"
                      >
                        Verificar
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
