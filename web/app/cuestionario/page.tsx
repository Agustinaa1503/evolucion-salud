import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Lock, ShieldCheck } from 'lucide-react';
import CuestionarioForm from '@/components/CuestionarioForm';
import Disclaimer from '@/components/Disclaimer';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/motion/Reveal';
import { questionnaire } from '@/lib/data/questionnaire';
import { img } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Cuestionario Matriz PINE de Autorreconocimiento',
  description:
    'Cuestionario psicoeducativo gratuito de autorreconocimiento PINE (1 a 10 en percepción, activación corporal y ambioma). Descubre tu Mapa PINE y habilita tu acceso personalizado.',
};

const bullets = [
  {
    title: 'Individual e intransferible',
    text: 'Cada persona —paciente, familiar o profesional— completa su propia matriz.',
  },
  {
    title: '1 a 10, sin vueltas',
    text: 'Escalas simples de autorreconocimiento en tres bloques.',
  },
  {
    title: 'Resultado inmediato',
    text: 'Al terminar, recibes tu Mapa PINE y tus recomendaciones.',
  },
];

export default function CuestionarioPage() {
  return (
    <>
      <PageHero
        eyebrow="Gratuito · Psicoeducativo"
        title={
          <>
            Tu <span className="text-gradient">Mapa PINE</span> empieza acá
          </>
        }
        description={questionnaire.intro}
        image={img.checklist}
      >
        <p className="mt-3 text-base font-semibold text-brand-200">
          {questionnaire.subtitle}
        </p>
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
          {bullets.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur"
            >
              <p className="font-bold text-white">{b.title}</p>
              <p className="mt-1 text-sm text-slate-300">{b.text}</p>
            </div>
          ))}
        </div>
      </PageHero>

      <section className="container-page py-16 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <CuestionarioForm />

          <Reveal>
            <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
              <h2 className="text-lg font-extrabold text-slate-900">
                ¿Prefieres la versión original en Google Forms?
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                El formulario oficial del equipo también está disponible. Ahí
                puedes guardar tus respuestas en tu cuenta de Google.
              </p>
              <a
                href={questionnaire.googleFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-4"
              >
                Abrir el formulario en Google Forms
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-8 flex items-start gap-3 rounded-3xl border border-slate-200/80 bg-slate-50 p-6 sm:p-8">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Lock className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="text-sm text-slate-600">
                <p className="font-extrabold text-slate-800">
                  ¿Por qué el acceso está bloqueado para otros?
                </p>
                <p className="mt-1 leading-relaxed">
                  Porque en PINE cada cerebro se configura según su propia
                  historia vital. La misma situación médica impacta distinto en
                  cada persona: un material diseñado para un perfil puede no
                  servirle a otro. Por eso las guías avanzadas se habilitan con
                  tu código personal, ligado a tus respuestas. Este bloqueo no
                  es solo una medida comercial: es una necesidad de tu propio
                  proceso.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="relative mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-leaf-800 p-8 text-white sm:p-10">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
              <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-leaf-400/20 blur-3xl" aria-hidden="true" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-leaf-100">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Siguiente paso
                </span>
                <h2 className="mt-4 text-xl font-extrabold">¿Ya tienes tu Mapa PINE?</h2>
                <p className="mt-2 text-sm text-leaf-50/90">
                  Según tus respuestas, el siguiente paso natural es tu guía
                  personalizada.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link href="/tienda/guia-basica-dia-despues-del-diagnostico" className="btn-dark">
                    Guía Básica (USD 19)
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link href="/tienda/guia-premium-completa" className="btn-outline border-white/30 bg-white/10 text-white hover:bg-white/20">
                    Guía Premium (USD 49)
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>

          <Disclaimer className="mt-8" />
        </div>
      </section>
    </>
  );
}
