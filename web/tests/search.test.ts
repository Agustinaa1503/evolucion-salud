import { describe, expect, it } from 'vitest';
import {
  normalizeSearchTerm,
  courseMatches,
  blogPostMatches,
  searchCourses,
  searchBlogPosts,
} from '../lib/search';
import type { Course } from '../lib/courses/types';
import type { BlogPost } from '../lib/data/blog';

function makeCourse(overrides: Partial<Course>): Course {
  return {
    id: 'c1',
    slug: 'pine-15-minutos',
    title: 'PINE en 15 minutos',
    subtitle: 'Primeros pasos',
    description: 'Un recorrido rápido por la PINE.',
    category: 'Salud',
    teachers: [],
    type: 'free',
    status: 'published',
    visibility: 'public',
    cta: 'ver-curso',
    currency: 'ARS',
    seo: { title: '', description: '', keywords: ['psicoinmunoneuroendocrinologia'] },
    featured: false,
    hasQuiz: false,
    hasCertificate: false,
    videos: [],
    resources: [],
    modules: [{ id: 'm1', title: 'Introducción', lessons: [{ id: 'l1', title: '¿Qué es la PINE?', type: 'texto' }] }],
    objectives: [],
    learning: ['Comprender la PINE'],
    audience: [],
    requirements: [],
    faq: [],
    bibliography: [],
    sections: [],
    icon: 'brain',
    gradient: 'from-brand-600 to-leaf-600',
    ...overrides,
  };
}

const post: BlogPost = {
  slug: 'estres-prequirurgico-como-preparar-cuerpo-y-mente',
  title: 'Estrés prequirúrgico: cómo preparar cuerpo y mente',
  excerpt: 'Técnicas para afrontar la ansiedad antes de una operación.',
  date: '2026-01-01',
  category: 'Cirugía',
  readTime: '5 min',
  icon: 'heart',
  gradient: 'from-brand-600 to-leaf-600',
  image: '',
  sections: [],
};

describe('normalizeSearchTerm (FASE 9)', () => {
  it('normaliza minúsculas, espacios y acentos', () => {
    expect(normalizeSearchTerm('  Ansiedad Pre-Quirúrgica  ')).toBe('ansiedad pre-quirurgica');
  });

  it('devuelve vacío para vacío', () => {
    expect(normalizeSearchTerm('')).toBe('');
  });
});

describe('courseMatches', () => {
  it('coincide en título, sin tildes en la consulta', () => {
    expect(courseMatches(makeCourse({}), 'pine')).toBe(true);
  });

  it('coincide en description y keywords', () => {
    expect(courseMatches(makeCourse({}), 'psicoinmunoneuroendocrinologia')).toBe(true);
  });

  it('coincide en lecciones', () => {
    expect(courseMatches(makeCourse({}), 'que es la pine')).toBe(true);
  });

  it('no coincide si el término no aparece', () => {
    expect(courseMatches(makeCourse({}), 'cocina')).toBe(false);
  });
});

describe('searchCourses', () => {
  it('devuelve vacío sin query', () => {
    expect(searchCourses([makeCourse({})], '')).toEqual([]);
    expect(searchCourses([makeCourse({})], '   ')).toEqual([]);
  });

  it('devuelve cursos que coinciden y vacío si ninguno', () => {
    const hits = searchCourses([makeCourse({})], 'estrés');
    expect(hits).toEqual([]);
    expect(searchCourses([makeCourse({})], 'pine').map((h) => h.slug)).toEqual(['pine-15-minutos']);
  });
});

describe('blogPostMatches / searchBlogPosts', () => {
  it('coincide en título y categoría con acentos', () => {
    expect(blogPostMatches(post, 'estres')).toBe(true);
    expect(blogPostMatches(post, 'cirugia')).toBe(true);
  });

  it('no coincide si no aparece', () => {
    expect(blogPostMatches(post, 'melatonina')).toBe(false);
  });

  it('searchBlogPosts devuelve los artículos coincidentes', () => {
    expect(searchBlogPosts([post], 'ansiedad').map((h) => h.slug)).toEqual([post.slug]);
    expect(searchBlogPosts([post], 'zzz')).toEqual([]);
  });
});
