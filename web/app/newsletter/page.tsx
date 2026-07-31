import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Mail, Sparkles } from 'lucide-react';
import NewsletterForm from '@/components/NewsletterForm';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/motion/Reveal';
import Disclaimer from '@/components/Disclaimer';
import { img } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Newsletter semanal',
  description:
    'Suscríbete a la newsletter semanal de Evolución Salud: contenido educativo PINE, herramientas prácticas y novedades. Gratis, sin spam y con baja fácil.',
};

const features = [
  {
    icon: 'sparkles',
    title: 'Educativo, no publicidad',
    text: 'Cada edición aporta conocimiento PINE útil: sin presión de venta.',
  },
  {
    icon: 'calendar',
    title: 'Semanal y predecible',
    text: 'Sale todos los jueves (demo). Leé en 5 minutos o guardalo para después.',
  },
  {
    icon: 'heart',
    title: 'Rigor y cercanía',
    text: 'Contenido revisado por el equipo de licenciadas, con lenguaje claro y cercano.',
  },
];

export default function NewsletterPage() {
  return (
    <>
      <PageHero
        eyebrow="Newsletter"
        title={
          <>
            Un email por semana para tu <span className="text-gradient">bienestar</span>
          </>
        }
        description="Contenido educativo de PsicoInmunoNeuroEndocrinología, herramientas prácticas y novedades de la plataforma. Gratis y sin spam."
        image={img.newsletter}
      >
        <div className="mx-auto mt-10 max-w-xl">
          <NewsletterForm />
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
            <Mail className="h-4 w-4" aria-hidden="true" />
            Puedes darte de baja en cualquier momento con un clic.
          </p>
        </div>
      </PageHero>

      <section className="container-page py-16 lg:py-24">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <div className="group h-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card transition duration-500 hover:-translate-y-1 hover:shadow-lift">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                  {f.icon === 'sparkles' ? (
                    <Sparkles className="h-6 w-6" aria-hidden="true" />
                  ) : f.icon === 'calendar' ? (
                    <CalendarDays className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Mail className="h-6 w-6" aria-hidden="true" />
                  )}
                </span>
                <h2 className="mt-4 text-lg font-extrabold text-slate-900">{f.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.text}</p>
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
                ¿Recién llegas? Empieza por acá
              </h2>
              <p className="mt-3 max-w-xl leading-relaxed text-leaf-50/90">
                Descarga la Checklist Matriz PINE gratis y completa el cuestionario
                de autorreconocimiento para recibir recomendaciones a tu medida.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/descarga-gratuita" className="btn-dark">
                  Descargar la checklist
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/cuestionario" className="btn-outline border-white/30 bg-white/10 text-white hover:bg-white/20">
                  Completar el cuestionario
                </Link>
              </div>
            </div>
          </div>
        </Reveal>

        <Disclaimer className="mx-auto mt-12 max-w-2xl" />
      </section>
    </>
  );
}
