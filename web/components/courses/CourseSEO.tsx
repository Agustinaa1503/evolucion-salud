import JsonLd from '@/components/JsonLd';
import { site } from '@/lib/data/site';
import type { Course } from '@/lib/courses/types';

/**
 * Datos estructurados (JSON-LD) del curso para SEO: schema.org `Course`.
 */
export default function CourseSEO({ course }: { course: Course }) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.seo.description ?? course.description,
    provider: {
      '@type': 'Organization',
      name: site.name,
      url: site.domain,
    },
    inLanguage: 'es-AR',
    ...(course.category ? { courseMode: course.category } : {}),
  };

  if (course.teachers.length) {
    data.instructor = course.teachers.map((t) => ({
      '@type': 'Person',
      name: t.name,
      ...(t.credentials ? { honorificSuffix: t.credentials } : {}),
    }));
  }

  if (course.type === 'free') {
    data.isAccessibleForFree = true;
    data.offers = { '@type': 'Offer', price: 0, priceCurrency: 'USD', category: 'Free' };
  } else {
    data.offers = course.price
      ? {
          '@type': 'Offer',
          price: course.price,
          priceCurrency: course.currency,
          availability: 'https://schema.org/PreOrder',
        }
      : { '@type': 'Offer', availability: 'https://schema.org/PreOrder' };
  }

  if (course.updatedAt) data.dateModified = course.updatedAt;

  return <JsonLd data={data} />;
}
