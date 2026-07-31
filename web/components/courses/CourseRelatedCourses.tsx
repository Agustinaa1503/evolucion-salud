import CourseCard from '@/components/CourseCard';
import Reveal from '@/components/motion/Reveal';
import { getRelatedCourses } from '@/lib/courses/registry';
import type { Course } from '@/lib/courses/types';

/** Cursos relacionados (misma categoría primero). */
export default function CourseRelatedCourses({ course }: { course: Course }) {
  const related = getRelatedCourses(course, 3);
  if (!related.length) return null;

  return (
    <section className="container-page py-16 lg:py-20">
      <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
        Otros cursos que te pueden interesar
      </h2>
      <div className="mt-8 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
        {related.map((c, i) => (
          <Reveal key={c.slug} delay={i * 0.07}>
            <CourseCard course={c} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
