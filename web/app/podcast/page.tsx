import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Headphones, Mic } from 'lucide-react';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/motion/Reveal';
import NewsletterForm from '@/components/NewsletterForm';
import { podcast } from '@/lib/data/podcast';
import type { Episode } from '@/lib/content/types';

export const metadata: Metadata = {
  title: 'Podcast',
  description:
    'Prácticas guiadas de Mindfulness y Meditaciones PINE de Evolución Salud. Escuchalas en Spotify.',
};

type SeriesConfig = {
  slug: 'mindfulness' | 'meditaciones-pine';
  title: string;
  eyebrow: string;
  description: string;
  image: string;
};

const SERIES: SeriesConfig[] = [
  {
    slug: 'mindfulness',
    title: 'Mindfulness',
    eyebrow: 'Atención plena',
    description:
      'Prácticas guiadas de atención plena para cultivar la calma, la presencia y una relación más amable con lo que sucede.',
    image: '/mindfulness.png',
  },
  {
    slug: 'meditaciones-pine',
    title: 'Meditaciones PINE',
    eyebrow: 'PsicoInmunoNeuroEndocrinología',
    description:
      'Meditaciones guiadas desde la PINE para regular el sistema nervioso y sostener el bienestar integral.',
    image: '/meditaciones-pine.png',
  },
];

function groupBySeries(episodes: Episode[]) {
  return SERIES.map((series) => ({
    series,
    items: episodes.filter((ep) => ep.series === series.slug),
  })).filter((group) => group.items.length > 0);
}

export default function PodcastPage() {
  const groups = groupBySeries(podcast.episodes);

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
        </div>
        <p className="mt-5 text-center text-xs text-slate-400">
          Todos los episodios están disponibles en Spotify.
        </p>
      </PageHero>

      <section className="container-page pb-16 pt-16 lg:pb-24">
        {groups.map(({ series, items }, gi) => (
          <Reveal key={series.slug}>
            <div
              id={series.slug}
              className={`mb-12 ${gi > 0 ? 'mt-20' : ''} flex flex-col gap-6 lg:flex-row lg:items-center`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={series.image}
                alt={series.title}
                className="h-24 w-24 rounded-3xl object-cover shadow-lift lg:h-32 lg:w-32"
              />
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                  <Mic className="h-3 w-3" aria-hidden="true" />
                  {series.eyebrow}
                </span>
                <h2 className="mt-3 text-2xl font-extrabold text-slate-900 lg:text-3xl">
                  {series.title}
                </h2>
                <p className="mt-2 max-w-2xl leading-relaxed text-slate-600">
                  {series.description}
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-600">
                  {items.length} episodios
                </p>
              </div>
            </div>

            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {items.map((ep, i) => (
                <Reveal key={ep.slug} delay={(i % 3) * 0.07}>
                  <article
                    id={ep.slug}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card transition duration-500 hover:-translate-y-1 hover:shadow-lift"
                  >
                    <div className="relative h-44 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ep.image}
                        alt={ep.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" aria-hidden="true" />
                      {ep.duration ? (
                        <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-800 backdrop-blur">
                          <Mic className="h-3 w-3" aria-hidden="true" />
                          {ep.duration}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                          {series.title}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-extrabold leading-snug text-slate-900">
                        {ep.title}
                      </h3>
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
                          Escuchar en Spotify
                        </a>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </Reveal>
        ))}

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
                  Súmate a la newsletter semanal y recibe herramientas PINE
                  prácticas para tu bienestar.
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
