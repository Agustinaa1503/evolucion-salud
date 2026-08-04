import { describe, expect, it } from 'vitest';
import {
  normalizeSearchTerm,
  courseMatches,
  blogPostMatches,
  productMatches,
  searchCourses,
  searchBlogPosts,
  searchProducts,
  searchAll,
} from '../lib/search';
import type { Course } from '../lib/courses/types';
import type { BlogPost } from '../lib/data/blog';
import type { Product } from '../lib/content/types';

function makeCourse(overrides: Partial<Course>): Course {
  return {
    id: 'c1',
    slug: 'pine-15-minutos',
    title: 'PINE en 15 minutos',
    subtitle: 'Primeros pasos',
    description: 'Un recorrido rápido por la PINE.',
    category: 'Salud',
    teachers: [],
    tags: [],
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

const sampleProduct: Product = {
  slug: 'guia-basica',
  title: 'Guía Básica',
  subtitle: 'El día después del diagnóstico',
  description: 'Una guía para afrontar el diagnóstico.',
  shortDescription: 'Guía de apoyo emocional.',
  price: 19,
  level: 'entrada',
  productType: 'simple',
  author: 'Lic. Claudia Espinoza',
  format: 'guia',
  features: [],
  includes: [],
  categories: ['diagnostico'],
  tags: ['guia', 'diagnostico'],
  audience: ['publico-general'],
  icon: 'book',
  gradient: 'from-brand-500 to-leaf-600',
  image: '',
};

describe('productMatches / searchProducts (12.3.3)', () => {
  it('coincide en título, subtítulo, autor y formato', () => {
    expect(productMatches(sampleProduct, 'guia basica')).toBe(true);
    expect(productMatches(sampleProduct, 'diagnostico')).toBe(true);
    expect(productMatches(sampleProduct, 'espinoza')).toBe(true);
    expect(productMatches(sampleProduct, 'guia')).toBe(true);
  });

  it('coincide en tags y categorías', () => {
    expect(productMatches(sampleProduct, 'diagnostico')).toBe(true);
  });

  it('no coincide si el término no aparece', () => {
    expect(productMatches(sampleProduct, 'cocina')).toBe(false);
  });

  it('searchProducts devuelve productos coincidentes', () => {
    const hits = searchProducts([sampleProduct], 'guia');
    expect(hits).toHaveLength(1);
    expect(hits[0].slug).toBe('guia-basica');
    expect(hits[0].type).toBe('product');
  });

  it('searchProducts devuelve vacío sin query', () => {
    expect(searchProducts([sampleProduct], '')).toEqual([]);
    expect(searchProducts([sampleProduct], '   ')).toEqual([]);
  });
});

describe('searchAll incluye productos (12.3.3)', () => {
  it('devuelve cursos, blog y productos', () => {
    const result = searchAll([makeCourse({})], [post], 'pine', [sampleProduct]);
    expect(result.courses.length).toBe(1);
    expect(result.posts.length).toBe(0);
    expect(result.products.length).toBe(0);
  });

  it('encuentra productos en searchAll', () => {
    const result = searchAll([makeCourse({})], [post], 'guia', [sampleProduct]);
    expect(result.products.length).toBe(1);
    expect(result.products[0].slug).toBe('guia-basica');
  });
});
