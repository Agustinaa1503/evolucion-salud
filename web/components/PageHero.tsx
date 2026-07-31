'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type PageHeroProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  image?: string;
  children?: ReactNode;
};

export default function PageHero({
  eyebrow,
  title,
  description,
  image,
  children,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-ink-950 pt-32 pb-20 lg:pt-40 lg:pb-28">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute -left-40 top-0 h-[28rem] w-[28rem] animate-blob rounded-full bg-brand-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-24 h-96 w-96 animate-blob rounded-full bg-leaf-500/15 blur-3xl [animation-delay:4s]" />
      {image ? (
        <div className="pointer-events-none absolute inset-0 opacity-[0.16]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div className="container-page relative">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          {eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-leaf-200 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-sun-400" />
              {eyebrow}
            </span>
          ) : null}
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
              {description}
            </p>
          ) : null}
          {children}
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" />
    </section>
  );
}
