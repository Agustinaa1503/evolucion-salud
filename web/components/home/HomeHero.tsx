'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ClipboardCheck, PlayCircle, Sparkles } from 'lucide-react';
import Counter from '../motion/Counter';
import { site } from '@/lib/data/site';
import { img } from '@/lib/images';

const stats = [
  { value: 3, label: 'Licenciadas especialistas' },
  { value: 2, label: 'Cursos gratuitos' },
  { value: 6, label: 'Episodios de podcast' },
  { value: 100, suffix: '%', label: 'Online' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-ink-950 pt-32 pb-20 lg:pt-40 lg:pb-28">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute -left-40 -top-24 h-[30rem] w-[30rem] animate-blob rounded-full bg-brand-500/25 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-40 h-96 w-96 animate-blob rounded-full bg-leaf-500/20 blur-3xl [animation-delay:5s]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 animate-blob rounded-full bg-leaf-400/15 blur-3xl [animation-delay:9s]" />

      <div className="container-page relative">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-leaf-200 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {site.positioning}
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="mt-6 text-4xl font-extrabold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[3.6rem]"
            >
              La ciencia de la conexión{' '}
              <span className="text-gradient">mente-cuerpo</span>, al alcance de
              todos
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300"
            >
              En Evolución Salud integramos{' '}
              <strong className="text-white">
                PsicoInmunoNeuroEndocrinología (PINE)
              </strong>{' '}
              con formación educativa: cursos, guías, podcast y herramientas
              para que descubras cómo tus emociones, hábitos y entorno impactan
              en tu salud.
            </motion.p>

            <motion.div
              variants={item}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <Link href="/cursos" className="btn-primary group">
                Explorar cursos gratuitos
                <ArrowRight
                  className="h-4 w-4 transition group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/cuestionario"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                Haz el cuestionario gratis
              </Link>
            </motion.div>

            <motion.dl
              variants={item}
              className="mt-12 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 sm:grid-cols-4"
            >
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="text-2xl font-extrabold text-white sm:text-3xl">
                    <Counter to={s.value} suffix={s.suffix ?? ''} />
                  </dd>
                  <dd className="mt-1 text-xs font-medium leading-snug text-slate-400">
                    {s.label}
                  </dd>
                </div>
              ))}
            </motion.dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
          >
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-glass">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.hero}
                alt="Persona en calma conectando mente y cuerpo"
                className="h-[30rem] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl">
                <p className="text-sm font-semibold leading-relaxed text-white">
                  «La mente se transforma en materia: comprender esa conexión es
                  el primer paso para cuidar tu salud.»
                </p>
                <p className="mt-2 text-xs text-leaf-200">
                  — Equipo Evolución Salud
                </p>
              </div>

              <div className="absolute right-6 top-6 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-xl">
                <PlayCircle className="h-4 w-4 text-leaf-300" aria-hidden="true" />
                PINE en 15 min
              </div>
            </div>

            <div className="pointer-events-none absolute -left-5 top-16 h-24 w-24 rounded-2xl bg-white/5 blur-sm" />
            <div className="pointer-events-none absolute -right-4 bottom-24 h-16 w-16 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-10 bottom-16 h-32 w-32 rounded-full border border-brand-400/20" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
