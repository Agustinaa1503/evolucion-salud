import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ClipboardCheck, Download, Sparkles } from 'lucide-react';
import LeadMagnetForm from '@/components/LeadMagnetForm';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/motion/Reveal';
import Disclaimer from '@/components/Disclaimer';
import { img } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Descarga gratis la Checklist Matriz PINE',
  description:
    'Checklist gratuito de autorreconocimiento PINE para las primeras 72 horas después de un diagnóstico o ante una cirugía programada. Entregamos el recurso a cambio de tu email.',
};

const steps = [
  {
    icon: 'download',
    title: '1 · Descarga',
    text: 'Recibe el checklist imprimible al instante, listo para usar en familia.',
  },
  {
    icon: 'clipboard',
    title: '2 · Registra',
    text: 'Completa tu estado actual: sueño, tensión, emociones y red de apoyo.',
  },
  {
    icon: 'arrow',
    title: '3 · Profundiza',
    text: 'Cuando estés listo, el Cuestionario Matriz PINE te arma tu Mapa personal.',
  },
];

export default function DescargaGratuitaPage() {
  return (
    <>
      <PageHero
        eyebrow="Recurso gratuito"
        title={
          <>
            Checklist <span className="text-gradient">Matriz PINE</span>
          </>
        }
        description="Un checklist imprimible de autorreconocimiento para los primeros días después de un diagnóstico o antes de una cirugía programada."
        image={img.checklist}
      />

      <section className="container-page py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Descarga instantánea
              </span>
              <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
                Te ayuda a <span className="text-gradient">registrar</span>,{' '}
                <span className="text-gradient">regular</span> y{' '}
                <span className="text-gradient">organizar</span>
              </h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                Registra cómo estás, regula tu activación y organiza tu red de
                apoyo. El primer paso para intervenir con cambios saludables es
                el autorreconocimiento.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Registro de sueño, tensión y emociones',
                  'Pautas de respiración vagal y descanso',
                  'Organización de la red de apoyo y los límites de visitas',
                  'Preparación del ambioma para el regreso al hogar',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-slate-700">
                    <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Disclaimer className="mt-8 max-w-lg" />
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="relative rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lift sm:p-8">
              <div className="absolute -top-3 right-8 rounded-full bg-gradient-to-r from-brand-600 to-leaf-600 px-4 py-1 text-xs font-bold text-white shadow-sm">
                Gratis
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Deja tu email y descárgala gratis
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                También vas a recibir contenido educativo PINE y novedades. Sin
                spam, con baja fácil.
              </p>
              <div className="mt-6">
                <LeadMagnetForm />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-50 py-16 lg:py-24">
        <div className="absolute inset-0 bg-dots opacity-40" aria-hidden="true" />
        <div className="container-page relative">
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <div className="group h-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card transition duration-500 hover:-translate-y-1 hover:shadow-lift">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                    <Download className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-extrabold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="relative mt-14 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-leaf-800 p-8 text-white sm:p-10">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
              <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-leaf-400/20 blur-3xl" aria-hidden="true" />
              <div className="relative">
                <h2 className="text-2xl font-extrabold">
                  ¿Quieres ir un paso más allá?
                </h2>
                <p className="mt-3 max-w-xl leading-relaxed text-leaf-50/90">
                  El Cuestionario Matriz PINE de Autorreconocimiento analiza tu
                  percepción, tu activación corporal y tu ambioma, y te
                  recomienda las herramientas de tu proceso.
                </p>
                <Link href="/cuestionario" className="btn-dark mt-6">
                  Completar el cuestionario
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
