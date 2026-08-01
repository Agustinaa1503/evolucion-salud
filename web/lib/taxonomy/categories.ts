import type { Category } from './types';

/**
 * Catálogo fijo de categorías de Evolución Salud.
 *
 * Es la fuente única de categorías para todos los tipos de contenido.
 * Los ítems de contenido guardan el `slug` de la categoría. Agregar una
 * categoría nueva aquí la habilita automáticamente en índices y filtros.
 */
export const categories: Category[] = [
  // Fundamentos PINE
  { slug: 'pine', name: 'PINE', group: 'Fundamentos PINE', description: 'PsicoInmunoNeuroEndocrinología: la ciencia de la conexión mente-cuerpo.' },
  { slug: 'psiconeuroinmunoendocrinologia', name: 'Psiconeuroinmunoendocrinología', group: 'Fundamentos PINE', description: 'El estudio integrado de los sistemas nervioso, inmunitario y endocrino.' },

  // Estrés
  { slug: 'estres', name: 'Estrés', group: 'Estrés', description: 'Respuesta adaptativa del organismo y su gestión desde la PINE.' },
  { slug: 'estres-cronico', name: 'Estrés Crónico', group: 'Estrés', description: 'Cuando la respuesta de alerta se sostiene y desgasta los sistemas basales.' },
  { slug: 'estres-ocupacional', name: 'Estrés Ocupacional', group: 'Estrés', description: 'El estrés en el ámbito laboral: reconocerlo y gestionarlo.' },

  // Sistemas biológicos
  { slug: 'neurociencias', name: 'Neurociencias', group: 'Sistemas biológicos', description: 'Cómo el sistema nervioso procesa, regula y da forma a la experiencia.' },
  { slug: 'sistema-nervioso', name: 'Sistema Nervioso', group: 'Sistemas biológicos', description: 'Eje central de la respuesta al estrés y de la regulación corporal.' },
  { slug: 'sistema-inmunologico', name: 'Sistema Inmunológico', group: 'Sistemas biológicos', description: 'La defensa del organismo y su diálogo con mente y hormonas.' },
  { slug: 'sistema-endocrino', name: 'Sistema Endocrino', group: 'Sistemas biológicos', description: 'Hormonas, cortisol, melatonina y la regulación del equilibrio interno.' },
  { slug: 'inflamacion', name: 'Inflamación', group: 'Sistemas biológicos', description: 'La respuesta inflamatoria y su vínculo con estrés, hábitos y enfermedad.' },
  { slug: 'microbiota', name: 'Microbiota', group: 'Sistemas biológicos', description: 'Las comunidades microbianas que habitan el cuerpo y modulan la salud.' },
  { slug: 'eje-intestino-cerebro', name: 'Eje Intestino-Cerebro', group: 'Sistemas biológicos', description: 'La comunicación bidireccional entre el aparato digestivo y el cerebro.' },

  // Mente y emociones
  { slug: 'psicologia', name: 'Psicología', group: 'Mente y emociones', description: 'Procesos mentales, conducta y bienestar emocional.' },
  { slug: 'salud-mental', name: 'Salud Mental', group: 'Mente y emociones', description: 'Cuidado emocional y psicológico en el marco de la salud integral.' },
  { slug: 'emociones', name: 'Emociones', group: 'Mente y emociones', description: 'Qué son las emociones y su traducción biológica.' },
  { slug: 'regulacion-emocional', name: 'Regulación Emocional', group: 'Mente y emociones', description: 'Herramientas para modular la activación y las emociones.' },
  { slug: 'ansiedad', name: 'Ansiedad', group: 'Mente y emociones', description: 'Comprensión psicoeducativa de la ansiedad y estrategias de manejo.' },
  { slug: 'depresion', name: 'Depresión', group: 'Mente y emociones', description: 'Conocimiento psicoeducativo sobre la depresión y el acompañamiento.' },

  // Hábitos y estilo de vida
  { slug: 'sueno', name: 'Sueño', group: 'Hábitos y estilo de vida', description: 'El descanso como pilar terapéutico y su impacto en la recuperación.' },
  { slug: 'cronobiologia', name: 'Cronobiología', group: 'Hábitos y estilo de vida', description: 'Los ritmos biológicos y cómo alinearse con ellos.' },
  { slug: 'habitos-saludables', name: 'Hábitos Saludables', group: 'Hábitos y estilo de vida', description: 'Pequeños cambios sostenibles que transforman la salud.' },
  { slug: 'estilo-de-vida', name: 'Estilo de Vida', group: 'Hábitos y estilo de vida', description: 'El conjunto de decisiones diarias que modulan tu biología.' },
  { slug: 'mindfulness', name: 'Mindfulness', group: 'Hábitos y estilo de vida', description: 'Atención plena como práctica de regulación del sistema nervioso.' },
  { slug: 'meditacion', name: 'Meditación', group: 'Hábitos y estilo de vida', description: 'Prácticas meditativas y audios guiados para la calma.' },
  { slug: 'respiracion', name: 'Respiración', group: 'Hábitos y estilo de vida', description: 'La respiración como puerta directa al sistema nervioso autónomo.' },
  { slug: 'nutricion', name: 'Nutrición', group: 'Hábitos y estilo de vida', description: 'Alimentación antiinflamatoria y su rol en la salud integral.' },
  { slug: 'actividad-fisica', name: 'Actividad Física', group: 'Hábitos y estilo de vida', description: 'El movimiento como modulador de cortisol, melatonina e inmunidad.' },

  // Salud y bienestar
  { slug: 'prevencion', name: 'Prevención', group: 'Salud y bienestar', description: 'Anticipar y reducir el riesgo cuidando los sistemas basales.' },
  { slug: 'promocion-de-la-salud', name: 'Promoción de la Salud', group: 'Salud y bienestar', description: 'Acciones que fortalecen la salud y el bienestar a largo plazo.' },
  { slug: 'autoconocimiento', name: 'Autoconocimiento', group: 'Salud y bienestar', description: 'Reconocer señales propias: el primer paso de todo proceso.' },
  { slug: 'psicoeducacion', name: 'Psicoeducación', group: 'Salud y bienestar', description: 'Conocimiento claro y basado en evidencia, sin diagnóstico a distancia.' },
  { slug: 'bienestar-integral', name: 'Bienestar Integral', group: 'Salud y bienestar', description: 'La salud como integración de mente, cuerpo, emociones y hábitos.' },
  { slug: 'calidad-de-vida', name: 'Calidad de Vida', group: 'Salud y bienestar', description: 'Cómo las decisiones y el entorno configuran el bienestar cotidiano.' },
  { slug: 'relaciones-interpersonales', name: 'Relaciones Interpersonales', group: 'Salud y bienestar', description: 'Vínculos, ambioma y su influencia en la salud.' },

  // Ámbitos
  { slug: 'trabajo-y-salud', name: 'Trabajo y Salud', group: 'Ámbitos', description: 'Salud ocupacional, clima laboral y bienestar en el trabajo.' },

  // Profesionales
  { slug: 'profesionales-de-la-salud', name: 'Profesionales de la Salud', group: 'Profesionales', description: 'Contenido y herramientas para equipos de salud.' },
  { slug: 'formacion-profesional', name: 'Formación Profesional', group: 'Profesionales', description: 'Capacitación y protocolos para especialistas y estudiantes.' },
];

export const getAllCategories = (): Category[] => categories;

export const getCategory = (slug: string): Category | undefined =>
  categories.find((c) => c.slug === slug);

export const getCategoryName = (slug: string): string =>
  getCategory(slug)?.name ?? slug;

/** Categorías agrupadas para el índice (orden del catálogo). */
export const getCategoryGroups = (): { group: string; items: Category[] }[] => {
  const groups = new Map<string, Category[]>();
  for (const c of categories) {
    if (!groups.has(c.group)) groups.set(c.group, []);
    groups.get(c.group)?.push(c);
  }
  return Array.from(groups.entries()).map(([group, items]) => ({ group, items }));
};
