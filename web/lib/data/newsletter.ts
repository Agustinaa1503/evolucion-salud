import type { ContentStatus } from '@/lib/taxonomy/types';

/**
 * Ediciones de la newsletter de Evolución Salud.
 *
 * La newsletter es parte de la taxonomía unificada (FASE 10): cada edición
 * puede clasificarse con categorías, tags, nivel y audiencia. Hoy se publica
 * de forma regular en /newsletter; acá se registran las ediciones emitidas.
 */
export type NewsletterEdition = {
  slug: string;
  title: string;
  description: string;
  date?: string;
  /** Slugs de categorías de la taxonomía (FASE 10). */
  categories?: string[];
  /** Tags libres (FASE 10). */
  tags?: string[];
  /** Nivel de la taxonomía (FASE 10). */
  level?: string;
  /** Audiencias de la taxonomía (FASE 10). */
  audience?: string[];
  status?: ContentStatus;
  icon?: string;
  gradient?: string;
};

export const newsletterEditions: NewsletterEdition[] = [
  {
    slug: 'edicion-semanal-pine',
    title: 'Edición semanal PINE',
    description:
      'La newsletter de Evolución Salud: un email por semana con psicoeducación, herramientas prácticas y novedades de la plataforma.',
    categories: ['pine', 'psicoeducacion', 'bienestar-integral'],
    tags: ['newsletter', 'psicoeducación', 'herramientas'],
    level: 'introductorio',
    audience: ['publico-general'],
    status: 'published',
    icon: 'mail',
    gradient: 'from-brand-500 to-leaf-600',
  },
];
