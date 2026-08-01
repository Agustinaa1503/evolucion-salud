import type { MetadataRoute } from 'next';
import { site } from '@/lib/data/site';
import { blogPosts } from '@/lib/data/blog';
import { getPublicCourses } from '@/lib/courses/registry';
import { getAllCategories, getAllTags } from '@/lib/taxonomy';

const mainRoutes = [
  { path: '', priority: 1, freq: 'weekly' },
  { path: '/cursos', priority: 0.9, freq: 'weekly' },
  { path: '/tienda', priority: 0.9, freq: 'weekly' },
  { path: '/blog', priority: 0.8, freq: 'weekly' },
  { path: '/podcast', priority: 0.7, freq: 'monthly' },
  { path: '/nosotros', priority: 0.6, freq: 'monthly' },
  { path: '/contacto', priority: 0.6, freq: 'monthly' },
  { path: '/newsletter', priority: 0.7, freq: 'monthly' },
  { path: '/descarga-gratuita', priority: 0.9, freq: 'weekly' },
  { path: '/cuestionario', priority: 0.9, freq: 'weekly' },
  { path: '/biblioteca', priority: 0.8, freq: 'weekly' },
  { path: '/categorias', priority: 0.8, freq: 'weekly' },
  { path: '/tags', priority: 0.7, freq: 'weekly' },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.domain;

  return [
    ...mainRoutes.map((r) => ({
      url: `${base}${r.path}`,
      lastModified: new Date(),
      changeFrequency: r.freq,
      priority: r.priority,
    })),
    ...getPublicCourses().map((course) => ({
      url: `${base}/cursos/${course.slug}`,
      lastModified: course.updatedAt ? new Date(course.updatedAt) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
    ...blogPosts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...getAllCategories().map((category) => ({
      url: `${base}/categorias/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...getAllTags().map((tag) => ({
      url: `${base}/tags/${tag.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  ];
}
