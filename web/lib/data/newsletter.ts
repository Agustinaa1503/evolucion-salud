/**
 * Ediciones de la newsletter de Evolución Salud (puente).
 *
 * Los datos viven en `Contenido/newsletter/` (motor unificado FASE 12) y su
 * copia compilada en `generated/newsletter.ts`. Este módulo re-exporta la lista y los
 * tipos para no romper los importadores (taxonomía, backoffice).
 */
export { newsletterEditions } from './generated/newsletter';
export type { NewsletterEdition } from '@/lib/content/types';
