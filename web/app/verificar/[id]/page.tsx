import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, Award, CalendarDays, GraduationCap, Home, ShieldCheck } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/auth/session';
import { formatCertificateDate } from '@/lib/certificates/pdf';
import Disclaimer from '@/components/Disclaimer';
import { site } from '@/lib/data/site';

type Props = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: 'Verificación de certificado',
    description: 'Verifique la autenticidad de un certificado de Evolución Salud.',
    robots: { index: false },
    alternates: { canonical: `${site.domain}/verificar/${id}` },
  };
}

/**
 * Página pública de verificación de certificados (FASE 5).
 * Lee SOLO datos no sensibles a través de `get_certificate_public`
 * (número, fecha, nombre completo y título del curso), sin exponer
 * user_id ni el path del PDF.
 */
export default async function VerificarPage({ params }: Props) {
  const { id } = await params;

  let data: {
    valid: boolean;
    certificate_number: string;
    issued_at: string;
    full_name: string;
    course_title: string;
  } | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: rows } = await supabase.rpc('get_certificate_public', { p_id: id });
    data = rows?.[0] ?? null;
  } catch {
    data = null;
  }

  if (!data || !data.valid) notFound();

  return (
    <div className="relative overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-leaf-500/20 blur-3xl" aria-hidden="true" />

      <section className="container-page relative py-20 lg:py-28">
        <div className="mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-lift">
            <div className="bg-gradient-to-br from-brand-600 to-leaf-600 px-8 py-6 text-center text-white">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <BadgeCheck className="h-8 w-8" aria-hidden="true" />
              </span>
              <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">Certificado verificado</h1>
              <p className="mt-1 text-sm text-brand-100">
                El siguiente certificado fue emitido por Evolución Salud.
              </p>
            </div>

            <div className="px-8 py-8">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sun-400/25 text-amber-700">
                  <Award className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Certificado de participación
                  </p>
                  <p className="text-lg font-extrabold text-slate-900">{data.course_title}</p>
                </div>
              </div>

              <dl className="mt-6 space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Otorgado a</dt>
                    <dd className="font-bold text-slate-800">{data.full_name || 'Participante'}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-leaf-600" aria-hidden="true" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Número de certificado
                    </dt>
                    <dd className="font-bold text-slate-800">{data.certificate_number}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-clay-600" aria-hidden="true" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Fecha de emisión
                    </dt>
                    <dd className="font-bold text-slate-800">
                      {data.issued_at ? formatCertificateDate(data.issued_at) : '—'}
                    </dd>
                  </div>
                </div>
              </dl>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/cursos" className="btn-primary flex-1">
                  <Home className="h-4 w-4" aria-hidden="true" />
                  Explorar cursos
                </Link>
                <Link href="/" className="btn-outline flex-1">
                  Volver al inicio
                </Link>
              </div>
            </div>
          </div>

          <Disclaimer className="mt-6" />
        </div>
      </section>
    </div>
  );
}
