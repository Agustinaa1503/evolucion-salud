/**
 * Utilidades de slugs del motor de contenido.
 *
 * Re-exportan la normalización de la taxonomía unificada (FASE 10) para no
 * duplicar lógica: todo slug del sitio usa la misma regla NFD (sin tildes,
 * sin signos, kebab-case).
 */
export { slugify, slugifyTag } from '@/lib/taxonomy/types';

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
