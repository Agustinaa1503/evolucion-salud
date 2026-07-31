import type { Metadata } from 'next';
import { Mail, MapPin, MessageCircle } from 'lucide-react';
import ContactForm from './ContactForm';
import Disclaimer from '@/components/Disclaimer';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/motion/Reveal';
import { site, socialLinks, whatsappLink } from '@/lib/data/site';
import { img } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Contacta con Evolución Salud por WhatsApp, email o formulario. Consultas sobre cursos, guías, talleres y formaciones.',
};

export default function ContactoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contacto"
        title={
          <>
            Hablemos, <span className="text-gradient">estamos acá</span>
          </>
        }
        description="Consultas sobre cursos, guías, talleres presenciales y formaciones para instituciones y equipos de salud."
        image={img.contact}
      />

      <section className="container-page pb-20 pt-16">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-2">
            <Reveal>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card transition duration-500 hover:-translate-y-1 hover:border-whatsapp/40 hover:shadow-lift"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-whatsapp text-white shadow-sm">
                  <MessageCircle className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-extrabold text-slate-900">WhatsApp</h2>
                  <p className="mt-1 text-sm text-slate-600">{site.whatsapp.display}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    La forma más rápida de comunicarte con nosotros.
                  </p>
                </div>
              </a>
            </Reveal>

            <Reveal delay={0.06}>
              <a
                href={`mailto:${site.email}`}
                className="group flex items-start gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card transition duration-500 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                  <Mail className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-extrabold text-slate-900">Email</h2>
                  <p className="mt-1 text-sm text-slate-600">{site.email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Para propuestas, alianzas y prensa.
                  </p>
                </div>
              </a>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="flex items-start gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <MapPin className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-extrabold text-slate-900">Ubicación</h2>
                  <p className="mt-1 text-sm text-slate-600">{site.location}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Plataforma 100% online · talleres presenciales por
                    coordinación.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card">
                <h2 className="font-extrabold text-slate-900">Seguinos</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {socialLinks.map((s) => (
                    <a
                      key={s.label}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      title={s.label}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {s.short}
                    </a>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Instagram: @evolucion_salud
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1} className="lg:col-span-3">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
              <h2 className="text-xl font-extrabold text-slate-900">
                Enviame un mensaje
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Completá el formulario y te respondemos a la brevedad.
              </p>
              <ContactForm />
              <Disclaimer className="mt-6" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
