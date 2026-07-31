import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, Clock } from 'lucide-react';
import { blogPosts, getBlogPost } from '@/lib/data/blog';
import BlogCard from '@/components/BlogCard';
import Disclaimer from '@/components/Disclaimer';
import NewsletterForm from '@/components/NewsletterForm';
import Reveal from '@/components/motion/Reveal';
import { formatDateLong } from '@/lib/utils';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) notFound();

  const related = blogPosts.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <>
      <article>
        <header className="relative overflow-hidden bg-ink-950 py-16">
          <div className="absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-leaf-500/20 blur-3xl" aria-hidden="true" />
          <div className="container-page relative max-w-3xl">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-300 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver al blog
            </Link>
            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-400">
              <span className="rounded-full bg-brand-500/20 px-3 py-1 font-bold text-brand-200">
                {post.category}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {formatDateLong(post.date)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {post.readTime} de lectura
              </span>
            </div>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              {post.title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">
              {post.excerpt}
            </p>
          </div>
        </header>

        <div className="container-page py-14">
          <div className="mx-auto max-w-3xl">
            <div className="group relative h-64 overflow-hidden rounded-3xl shadow-lift">
              {post.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.image}
                  alt={post.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
              ) : (
                <div className={`flex h-full items-center justify-center bg-gradient-to-br ${post.gradient}`}>
                  <span className="text-7xl">🌿</span>
                </div>
              )}
            </div>

            <div className="mt-10 max-w-none">
              {post.sections.map((section) => (
                <section key={section.heading ?? section.paragraphs[0]}>
                  {section.heading ? (
                    <h2 className="mt-10 text-2xl font-extrabold tracking-tight text-slate-900">
                      {section.heading}
                    </h2>
                  ) : null}
                  {section.paragraphs.map((p, i) => (
                    <p
                      key={i}
                      className="mt-4 text-base leading-relaxed text-slate-700"
                    >
                      {p}
                    </p>
                  ))}
                </section>
              ))}
            </div>

            <Reveal>
              <div className="relative mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-leaf-800 p-8 text-white">
                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
                <div className="relative">
                  <h2 className="text-xl font-extrabold">
                    Empezá tu proceso con la Checklist Matriz PINE
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-leaf-50/90">
                    Este artículo es un punto de partida. La checklist gratuita
                    te ayuda a registrar tu estado actual y a organizar tu red
                    de apoyo en las primeras 72 horas.
                  </p>
                  <Link href="/descarga-gratuita" className="btn-dark mt-5">
                    Descargar la checklist gratis
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </Reveal>

            <Disclaimer className="mt-8" />

            <div className="mt-10 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
              <h2 className="text-lg font-extrabold text-slate-900">
                Recibí contenido así en tu email
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Sumate a la newsletter semanal de Evolución Salud.
              </p>
              <NewsletterForm compact />
            </div>
          </div>
        </div>
      </article>

      <section className="relative overflow-hidden border-t border-slate-200/60 bg-slate-50 py-16">
        <div className="absolute inset-0 bg-dots opacity-40" aria-hidden="true" />
        <div className="container-page relative">
          <h2 className="text-2xl font-extrabold text-slate-900">
            Artículos relacionados
          </h2>
          <div className="mt-8 grid gap-7 md:grid-cols-3">
            {related.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.07}>
                <BlogCard post={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
