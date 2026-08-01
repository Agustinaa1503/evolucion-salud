import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import CourseCard from '@/components/CourseCard';
import BlogCard from '@/components/BlogCard';
import Reveal from '@/components/motion/Reveal';
import {
  CONTENT_TYPE_LABELS,
  courseItem,
  recommendItems,
  type TaxonomyItem,
} from '@/lib/taxonomy';
import type { Course } from '@/lib/courses/types';

/**
 * Contenido relacionado por afinidad de taxonomía (categorías + tags
 * compartidos). Muestra cursos, artículos y recursos relacionados con el
 * curso actual.
 */
export default function CourseRelatedCourses({ course }: { course: Course }) {
  const item = courseItem(course);
  const related = recommendItems(item, { limit: 6 });

  const courses = related.filter((r) => r.contentType === 'course');
  const others = related
    .filter((r) => r.contentType !== 'course')
    .reduce<Record<string, TaxonomyItem[]>>((acc, r) => {
      (acc[r.contentType] ??= []).push(r);
      return acc;
    }, {});

  if (!courses.length && !related.filter((r) => r.contentType !== 'course').length) return null;

  return (
    <section className="container-page py-16 lg:py-20">
      {courses.length ? (
        <>
          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Otros cursos que te pueden interesar
          </h2>
          <div className="mt-8 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((c, i) => {
              const data = c.data as Course;
              return (
                <Reveal key={c.slug} delay={i * 0.07}>
                  <CourseCard course={data} />
                </Reveal>
              );
            })}
          </div>
        </>
      ) : null}

      {Object.entries(others).map(([type, typeItems]) => (
        <div key={type} className="mt-16">
          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {type === 'blog'
              ? 'Artículos relacionados'
              : type === 'resource'
                ? 'Recursos relacionados'
                : `Contenido relacionado · ${CONTENT_TYPE_LABELS[type as keyof typeof CONTENT_TYPE_LABELS]}`}
          </h2>
          {type === 'blog' ? (
            <div className="mt-8 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {typeItems.map((post, i) => {
                const data = post.data as Parameters<typeof BlogCard>[0]['post'];
                return (
                  <Reveal key={post.slug} delay={i * 0.07}>
                    <BlogCard post={data} />
                  </Reveal>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {typeItems.map((r) => (
                <Link
                  key={r.id}
                  href={r.url}
                  className="group flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card transition duration-500 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                    {r.subtitle ? (
                      <span className="text-xs font-extrabold uppercase">{r.subtype.slice(0, 2)}</span>
                    ) : null}
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
                      {CONTENT_TYPE_LABELS[r.contentType]}
                    </p>
                    <p className="font-extrabold text-slate-900 transition group-hover:text-brand-700">
                      {r.title}
                    </p>
                  </div>
                  <ArrowRight
                    className="ml-auto h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-600"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
