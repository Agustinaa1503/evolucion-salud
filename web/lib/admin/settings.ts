/**
 * Configuración del BackOffice (módulo Configuración).
 *
 * Los ajustes se guardan en la tabla `backoffice_settings` (migración
 * 20260731000010_admin_backoffice.sql), una fila por grupo con valor JSON.
 * Este módulo es la fuente de verdad de los valores por defecto y del esquema;
 * la UI y el server action solo guardan claves conocidas.
 */

export type SettingsGroup =
  | 'institucional'
  | 'seo'
  | 'social'
  | 'contacto'
  | 'logo'
  | 'analytics';

export const SETTINGS_GROUPS: { key: SettingsGroup; label: string; description: string }[] = [
  { key: 'institucional', label: 'Institucional', description: 'Identidad de la empresa.' },
  { key: 'seo', label: 'SEO', description: 'Títulos, descripciones y palabras clave.' },
  { key: 'social', label: 'Redes sociales', description: 'Enlaces a los perfiles públicos.' },
  { key: 'contacto', label: 'Contacto', description: 'Email y WhatsApp del equipo.' },
  { key: 'logo', label: 'Logo y favicon', description: 'Rutas de los activos de marca.' },
  { key: 'analytics', label: 'Analytics', description: 'IDs de medición de tráfico.' },
];

export type InstitutionalSettings = {
  nombre: string;
  slogan: string;
  descripcion: string;
  ubicacion: string;
};

export type SeoSettings = {
  titleTemplate: string;
  description: string;
  keywords: string;
};

export type SocialSettings = {
  instagram: string;
  facebook: string;
  tiktok: string;
  linkedin: string;
  threads: string;
  pinterest: string;
  youtube: string;
};

export type ContactoSettings = {
  email: string;
  whatsapp: string;
  horario: string;
};

export type LogoSettings = {
  logoPath: string;
  faviconPath: string;
};

export type AnalyticsSettings = {
  id: string;
  pixel: string;
};

export type BackofficeSettings = {
  institucional: InstitutionalSettings;
  seo: SeoSettings;
  social: SocialSettings;
  contacto: ContactoSettings;
  logo: LogoSettings;
  analytics: AnalyticsSettings;
};

export const DEFAULT_SETTINGS: BackofficeSettings = {
  institucional: {
    nombre: 'Evolución Salud',
    slogan: 'Descubre, Inspira, Transforma',
    descripcion: 'Plataforma educativa online de PsicoInmunoNeuroEndocrinología (PINE).',
    ubicacion: 'Córdoba, Argentina',
  },
  seo: {
    titleTemplate: '%s | Evolución Salud',
    description: 'Aprende sobre PsicoInmunoNeuroEndocrinología (PINE): mente, cuerpo, emociones y hábitos con evidencia científica.',
    keywords: 'PINE, psicoinmunoneuroendocrinología, salud integral, estrés, cronobiología, evolución salud',
  },
  social: {
    instagram: 'https://instagram.com/evolucion_salud',
    facebook: '',
    tiktok: '',
    linkedin: '',
    threads: '',
    pinterest: '',
    youtube: '',
  },
  contacto: {
    email: 'profesionales@evolucionsalud.com',
    whatsapp: '+54 9 3518 67-6602',
    horario: 'Lunes a viernes, 9:00 a 18:00 (GMT-3)',
  },
  logo: {
    logoPath: '/logo.png',
    faviconPath: '/icon.svg',
  },
  analytics: {
    id: '',
    pixel: '',
  },
};

export type SettingsField = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'email' | 'tel' | 'path';
  placeholder?: string;
};

export const SETTINGS_FIELDS: Record<SettingsGroup, SettingsField[]> = {
  institucional: [
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'slogan', label: 'Eslogan', type: 'text' },
    { key: 'descripcion', label: 'Descripción', type: 'textarea' },
    { key: 'ubicacion', label: 'Ubicación', type: 'text' },
  ],
  seo: [
    { key: 'titleTemplate', label: 'Plantilla de título', type: 'text', placeholder: '%s | Evolución Salud' },
    { key: 'description', label: 'Meta descripción', type: 'textarea' },
    { key: 'keywords', label: 'Palabras clave', type: 'text' },
  ],
  social: [
    { key: 'instagram', label: 'Instagram', type: 'url' },
    { key: 'facebook', label: 'Facebook', type: 'url' },
    { key: 'tiktok', label: 'TikTok', type: 'url' },
    { key: 'linkedin', label: 'LinkedIn', type: 'url' },
    { key: 'threads', label: 'Threads', type: 'url' },
    { key: 'pinterest', label: 'Pinterest', type: 'url' },
    { key: 'youtube', label: 'YouTube', type: 'url' },
  ],
  contacto: [
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'whatsapp', label: 'WhatsApp', type: 'tel' },
    { key: 'horario', label: 'Horario de atención', type: 'text' },
  ],
  logo: [
    { key: 'logoPath', label: 'Ruta del logo', type: 'path', placeholder: '/logo.png' },
    { key: 'faviconPath', label: 'Ruta del favicon', type: 'path', placeholder: '/icon.svg' },
  ],
  analytics: [
    { key: 'id', label: 'Google Analytics ID', type: 'text', placeholder: 'G-XXXXXXX' },
    { key: 'pixel', label: 'Pixel de Facebook', type: 'text', placeholder: '1234567890' },
  ],
};

export const DEFAULT_SETTINGS_BY_GROUP: Record<SettingsGroup, Record<string, string>> = {
  institucional: DEFAULT_SETTINGS.institucional,
  seo: DEFAULT_SETTINGS.seo,
  social: DEFAULT_SETTINGS.social,
  contacto: DEFAULT_SETTINGS.contacto,
  logo: DEFAULT_SETTINGS.logo,
  analytics: DEFAULT_SETTINGS.analytics,
};

/** Mezcla el valor guardado en BD con los defaults (el default cubre campos nuevos). */
export function mergeGroup(
  group: SettingsGroup,
  dbValue: Record<string, unknown> | null | undefined
): Record<string, string> {
  const defaults = DEFAULT_SETTINGS_BY_GROUP[group];
  const result: Record<string, string> = { ...defaults };
  if (dbValue) {
    for (const key of Object.keys(defaults)) {
      const v = dbValue[key];
      if (typeof v === 'string') result[key] = v;
      else if (typeof v === 'number') result[key] = String(v);
    }
  }
  return result;
}
