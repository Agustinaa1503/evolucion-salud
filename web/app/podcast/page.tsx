import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Headphones, Mic, Play } from 'lucide-react';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/motion/Reveal';
import NewsletterForm from '@/components/NewsletterForm';
import { podcast } from '@/lib/data/podcast';

export const metadata: Metadata = {
  title: 'Podcast',
  description:
    'El podcast de Evolución Salud: PsicoInmunoNeuroEndocrinología en lenguaje claro. Escuchalo en Spotify y YouTube.',
};

export default function PodcastPage() {
  return (
    <>
      <PageHero
        eyebrow="Podcast"
        title={
          <>
            PINE para <span className="text-gradient">escuchar</span>
          </>
        }
        description={podcast.description}
      >
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={podcast.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            <Headphones className="h-4 w-4" aria-hidden="true" />
            Escuchar en Spotify
          </a>
          <a
            href={podcast.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Ver en YouTube
          </a>
        </div>
        <p className="mt-5 text-center text-xs text-slate-400">
          Los enlaces apuntan a la búsqueda de Evolución Salud en cada
          plataforma. En producción se reemplazan por los perfiles y episodios
          oficiales.
        </p>
      </PageHero>

      <section className="container-page pb-16 pt-16 lg:pb-24">
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {podcast.episodes.map((ep, i) => (
            <Reveal key={ep.slug} delay={(i % 3) * 0.07}>
              <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card transition duration-500 hover:-translate-y-1 hover:shadow-lift">
                <div className="relative h-44 overflow-hidden">
                  {ep.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ep.image}
                      alt={ep.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className={`flex h-full items-center justify-center bg-gradient-to-br ${ep.gradient}`}>
                      <Mic className="h-12 w-12 text-white/90" aria-hidden="true" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" aria-hidden="true" />
                  <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-800 backdrop-blur">
                    <Mic className="h-3 w-3" aria-hidden="true" />
                    {ep.duration}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                      Episodio
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-extrabold leading-snug text-slate-900">
                    {ep.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                    {ep.description}
                  </p>
                  <div className="mt-5 flex gap-3">
                    <a
                      href={ep.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
                    >
                      <Headphones className="h-3.5 w-3.5" aria-hidden="true" />
                      Spotify
                    </a>
                    <a
                      href={ep.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
                    >
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      YouTube
                    </a>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="relative mt-16 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-leaf-800 p-8 text-white sm:p-10">
            <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-leaf-400/20 blur-3xl" aria-hidden="true" />
            <div className="relative grid items-center gap-6 lg:grid-cols-2">
              <div>
                <h2 className="text-2xl font-extrabold">
                  ¿Te gusta lo que escuchas?
                </h2>
                <p className="mt-3 leading-relaxed text-leaf-50/90">
                  Súmate a la newsletter semanal y recibe el resumen de los
                  episodios, los artículos del blog y herramientas PINE
                  prácticas.
                </p>
                <a
                  href={podcast.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-dark mt-6"
                >
                  Seguir el podcast
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
              <NewsletterForm compact />
            </div>
          </div>
        </Reveal>

        <div className="mt-10 text-center">
          <Link href="/blog" className="btn-outline">
            Leer los artículos del blog
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
