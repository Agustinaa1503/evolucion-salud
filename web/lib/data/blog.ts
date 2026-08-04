/**
 * Blog de Evolución Salud (puente).
 *
 * Los datos ya no viven acá: la fuente de verdad editorial son los archivos
 * Markdown de `Contenido/blog/` (motor unificado FASE 12). Este módulo solo
 * re-exporta la copia compilada en `generated/blog.ts` (generada por
 * `npm run db:sync-content`) y los tipos, para no romper los importadores
 * (`app/blog/*`, taxonomía, buscador, backoffice).
 */
export { blogPosts, featuredPosts, getBlogPost } from './generated/blog';
export type { BlogPost, BlogSection } from '@/lib/content/types';
