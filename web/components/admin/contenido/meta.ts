/**
 * Metadatos de los tipos de contenido para el CMS (Subfase 12.2).
 *
 * Datos puros (sin filesystem): los importan tanto los server pages como los
 * componentes cliente del BackOffice. Nunca arrastra el parser/registry.
 */
import type { FileContentKind } from '@/lib/content/parser';

export const CONTENT_KINDS: FileContentKind[] = [
  'blog',
  'podcast',
  'product',
  'newsletter',
];

/** Etiqueta corta (para tabs y encabezados). */
export const CONTENT_KIND_LABELS: Record<FileContentKind, string> = {
  blog: 'Blog',
  podcast: 'Podcast',
  product: 'Productos',
  newsletter: 'Newsletter',
};

/** Plural descriptivo (para títulos y estados vacíos). */
export const CONTENT_KIND_PLURAL: Record<FileContentKind, string> = {
  blog: 'artículos',
  podcast: 'episodios',
  product: 'productos',
  newsletter: 'ediciones de newsletter',
};

/** Descripción breve por tipo (para el PageHeader). */
export const CONTENT_KIND_DESCRIPTIONS: Record<FileContentKind, string> = {
  blog: 'Artículos divulgativos publicados en /blog.',
  podcast: 'Episodios del podcast publicados en /podcast.',
  product: 'Productos digitales de la tienda.',
  newsletter: 'Ediciones de la newsletter enviadas por email.',
};

/** Prefijo de icono lucide por tipo. */
export const CONTENT_KIND_ICONS: Record<FileContentKind, string> = {
  blog: 'FileText',
  podcast: 'Mic',
  product: 'Package',
  newsletter: 'Mail',
};

/** Valores por defecto razonables para crear un documento nuevo de un tipo. */
export const KIND_DEFAULT_FRONTMATTER: Record<
  FileContentKind,
  Record<string, unknown>
> = {
  blog: {
    order: 0,
    title: 'Nuevo artículo',
    excerpt: '',
    date: new Date().toISOString().slice(0, 10),
    category: '',
    readTime: '5 min',
    categories: ['pine'],
    tags: [],
    level: 'introductorio',
    audience: ['publico-general'],
    icon: 'heart',
    gradient: 'from-brand-500 to-leaf-600',
    image: '',
    locale: 'es',
    version: 1,
    createdAt: new Date().toISOString().slice(0, 10),
  },
  podcast: {
    order: 0,
    title: 'Nuevo episodio',
    description: '',
    duration: '20:00',
    embedUrl: '',
    categories: ['pine'],
    tags: [],
    level: 'introductorio',
    audience: ['publico-general'],
    icon: 'mic',
    gradient: 'from-brand-500 to-clay-500',
    image: '',
    locale: 'es',
    version: 1,
    createdAt: new Date().toISOString().slice(0, 10),
  },
  product: {
    order: 0,
    title: 'Nuevo producto',
    subtitle: '',
    description: '',
    shortDescription: '',
    price: 0,
    currency: 'USD',
    taxRate: 0,
    level: 'entrada',
    productType: 'simple',
    format: 'pdf',
    author: '',
    features: [],
    includes: [],
    gallery: [],
    related: [],
    icon: 'file-down',
    gradient: 'from-brand-500 to-sun-500',
    image: '',
    locale: 'es',
    version: 1,
    createdAt: new Date().toISOString().slice(0, 10),
  },
  newsletter: {
    order: 0,
    title: 'Nueva edición',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    categories: ['pine'],
    tags: [],
    level: 'introductorio',
    audience: ['publico-general'],
    locale: 'es',
    version: 1,
    createdAt: new Date().toISOString().slice(0, 10),
  },
};
