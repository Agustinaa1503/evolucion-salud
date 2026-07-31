import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CourseHero from '@/components/courses/CourseHero';
import CourseSections from '@/components/courses/CourseSections';
import CourseObjectives from '@/components/courses/CourseObjectives';
import CourseModules from '@/components/courses/CourseModules';
import CourseVideoList from '@/components/courses/CourseVideoList';
import CourseResources from '@/components/courses/CourseResources';
import CourseBibliography from '@/components/courses/CourseBibliography';
import CourseQuiz from '@/components/courses/CourseQuiz';
import CourseFAQ from '@/components/courses/CourseFAQ';
import CourseSidebar from '@/components/courses/CourseSidebar';
import CourseRelatedCourses from '@/components/courses/CourseRelatedCourses';
import CourseSEO from '@/components/courses/CourseSEO';
import Disclaimer from '@/components/Disclaimer';
import { getAllCourses, getCourse } from '@/lib/courses/registry';
import { site } from '@/lib/data/site';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllCourses().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) return {};

  const title = course.seo.title ?? course.title;
  const description = course.seo.description ?? course.description;
  const url = `${site.domain}/cursos/${course.slug}`;

  return {
    title,
    description,
    ...(course.seo.keywords?.length ? { keywords: course.seo.keywords } : {}),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: (course.seo.ogType ?? 'article') as 'article',
      ...(course.seo.ogImage ? { images: [{ url: course.seo.ogImage }] } : {}),
    },
    robots:
      course.status === 'draft' || course.status === 'archived'
        ? { index: false, follow: false }
        : undefined,
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  const isUpcoming =
    course.type === 'upcoming' ||
    course.cta === 'lista-espera' ||
    course.status === 'in-development';

  return (
    <>
      <CourseSEO course={course} />
      <CourseHero course={course} />

      <div className="container-page py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="space-y-14 lg:col-span-2">
            <CourseSections course={course} />

            <CourseObjectives
              course={course}
              kind={course.learning.length ? 'learning' : 'objectives'}
            />

            {isUpcoming ? (
              <CourseModules course={course} />
            ) : (
              <>
                <CourseModules course={course} />
                <CourseVideoList course={course} />
                <CourseResources course={course} />
                <CourseQuiz course={course} />
                <CourseBibliography course={course} />
                <CourseFAQ course={course} />
              </>
            )}

            <Disclaimer />
          </div>

          <CourseSidebar course={course} />
        </div>
      </div>

      <CourseRelatedCourses course={course} />
    </>
  );
}
