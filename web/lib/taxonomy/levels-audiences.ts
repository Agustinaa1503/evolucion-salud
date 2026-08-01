import type { Audience, Level } from './types';

/** Niveles de formación del catálogo. */
export const levels: Level[] = [
  { slug: 'introductorio', name: 'Introductorio', sortOrder: 1 },
  { slug: 'inicial', name: 'Inicial', sortOrder: 2 },
  { slug: 'intermedio', name: 'Intermedio', sortOrder: 3 },
  { slug: 'avanzado', name: 'Avanzado', sortOrder: 4 },
  { slug: 'profesional', name: 'Profesional', sortOrder: 5 },
];

export const getAllLevels = (): Level[] => levels;

export const getLevel = (slug?: string): Level | undefined =>
  slug ? levels.find((l) => l.slug === slug) : undefined;

export const getLevelName = (slug?: string): string | undefined =>
  getLevel(slug)?.name;

/** Audiencias objetivo del catálogo. */
export const audiences: Audience[] = [
  { slug: 'publico-general', name: 'Público General' },
  { slug: 'profesionales-de-la-salud', name: 'Profesionales de la Salud' },
  { slug: 'psicologos', name: 'Psicólogos' },
  { slug: 'medicos', name: 'Médicos' },
  { slug: 'nutricionistas', name: 'Nutricionistas' },
  { slug: 'coaches', name: 'Coaches' },
  { slug: 'docentes', name: 'Docentes' },
  { slug: 'empresas', name: 'Empresas' },
];

export const getAllAudiences = (): Audience[] => audiences;

export const getAudience = (slug?: string): Audience | undefined =>
  slug ? audiences.find((a) => a.slug === slug) : undefined;

export const getAudienceName = (slug?: string): string | undefined =>
  getAudience(slug)?.name;
