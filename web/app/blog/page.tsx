import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Newspaper } from 'lucide-react';
import BlogCard from '@/components/BlogCard';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/motion/Reveal';
import NewsletterForm from '@/components/NewsletterForm';
import { blogPosts } from '@/lib/data/blog';
import { img } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Artículos de PsicoInmunoNeuroEndocrinología (PINE): estrés prequirúrgico, carga alostática, melatonina, cronobiología, cirugía despierta y cuidado del cuidador.',
};

export default function BlogPage() {
  const categories = Array.from(new Set(blogPosts.map((p) => p.category)));

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title={
          <>
            Conocimiento PINE para tu <span className="text-gradient">bienestar</span>
          </>
        }
        description="Artículos divulgativos con evidencia científica. Cada artículo termina con una herramienta práctica para tu proceso."
        image={img.blog}
      />

      <section className="container-page py-16 lg:py-24">
        <Reveal>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((c) => (
              <span
                key={c}
                className="rounded-full border border-brand-200/80 bg-white px-4 py-1.5 text-xs font-semibold text-brand-700 shadow-sm"
              >
                {c}
              </span>
            ))}
          </div>
        </Reveal>

        <div className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post, i) => (
            <Reveal key={post.slug} delay={(i % 3) * 0.07}>
              <BlogCard post={post} />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="relative mt-16 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-leaf-800 p-8 text-white sm:p-10">
            <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-leaf-400/20 blur-3xl" aria-hidden="true" />
            <div className="relative grid items-center gap-6 lg:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-leaf-100">
                  <Newspaper className="h-3.5 w-3.5" aria-hidden="true" />
                  Newsletter semanal
                </span>
                <h2 className="mt-4 text-2xl font-extrabold">
                  No te pierdas los próximos artículos
                </h2>
                <p className="mt-3 leading-relaxed text-leaf-50/90">
                  Un email por semana con contenido educativo PINE, herramientas
                  prácticas y novedades. Gratis y sin spam.
                </p>
              </div>
              <NewsletterForm compact />
            </div>
          </div>
        </Reveal>

        <div className="mt-10 text-center">
          <Link href="/podcast" className="btn-outline">
            También puedes escuchar el podcast
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
