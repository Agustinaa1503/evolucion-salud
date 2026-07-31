export type ProductLevel =
  | 'lead-magnet'
  | 'entrada'
  | 'media'
  | 'alta'
  | 'b2b'
  | 'recurrente'
  | 'extra';

export type Product = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  compareAt?: number;
  interval?: 'monthly';
  level: ProductLevel;
  badge?: string;
  features: string[];
  includes: string[];
  icon: string;
  gradient: string;
  image: string;
  recommended?: boolean;
};

export const levelLabel: Record<ProductLevel, string> = {
  'lead-magnet': 'Gratis',
  entrada: 'Entrada',
  media: 'Media',
  alta: 'Alta',
  b2b: 'Profesionales',
  recurrente: 'Recurrente',
  extra: 'Extra',
};

// Escalera de valor según AGENT.md §4.4
export const products: Product[] = [
  {
    slug: 'checklist-matriz-pine',
    title: 'Checklist Matriz PINE',
    subtitle: 'Tu primer paso de autorreconocimiento (gratis)',
    description:
      'Un checklist imprimible de dos páginas para registrar cómo estás atravesando este momento: sueño, tensión, emociones, alimentación y red de apoyo. El punto de partida de todo proceso.',
    price: 0,
    level: 'lead-magnet',
    badge: 'Gratis',
    features: [
      'Checklist de autorreconocimiento',
      'Registro de las primeras 72 horas',
      'Pautas simples de respiración y descanso',
    ],
    includes: ['Descargable imprimible (2 páginas)', 'Guía breve de uso', 'Acceso inmediato'],
    icon: 'clipboard',
    gradient: 'from-leaf-400 to-leaf-600',
    image: "https://images.unsplash.com/photo-1507124484497-b7f446e65519?auto=format&fit=crop&w=1600&q=80",
  },
  {
    slug: 'guia-basica-dia-despues-del-diagnostico',
    title: 'Guía Básica · El Día Después del Diagnóstico',
    subtitle: 'Manual PINE de afrontamiento familiar (Capítulos 1-4)',
    description:
      'Las primeras herramientas para atravesar un diagnóstico y una cirugía programada: qué pasa en tu cuerpo, cómo regular la emoción y cómo preparar el terreno antes de entrar al quirófano.',
    price: 19,
    level: 'entrada',
    badge: 'Entrada',
    features: [
      'Capítulos 1-4 en PDF',
      'La biología de la incertidumbre',
      'Regulación emocional en dos pasos',
      'Cronobiología y nutrición perioperatoria',
      'Ambioma familiar y regreso al hogar',
    ],
    includes: ['PDF de 60+ páginas', 'Checklist de las primeras 72 horas', 'Acceso a la comunidad de lectores'],
    icon: 'book',
    gradient: 'from-brand-500 to-leaf-700',
    image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1600&q=80",
  },
  {
    slug: 'guia-premium-completa',
    title: 'Guía Premium · El Día Después del Diagnóstico',
    subtitle: 'Guía completa (Capítulos 1-6) + meditaciones guiadas',
    description:
      'La guía completa para pacientes, familias y profesionales: incluye la sección especializada de quirófano despierto y el protocolo de PsicoPINE para el equipo quirúrgico, más audios de meditación.',
    price: 49,
    compareAt: 68,
    level: 'media',
    badge: 'Más elegida',
    recommended: true,
    features: [
      'Capítulos 1-6 en PDF',
      'Capítulo 5: el desafío del quirófano despierto',
      'Capítulo 6: protocolo para el equipo quirúrgico',
      '3 meditaciones guiadas en audio',
      'Cuaderno de ruta quirúrgico',
    ],
    includes: ['PDF completo (120+ páginas)', 'Audios de meditación', 'Plantillas imprimibles', 'Acceso anticipado a nuevos materiales'],
    icon: 'sparkles',
    gradient: 'from-leaf-500 to-leaf-800',
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80",
  },
  {
    slug: 'bundle-pine-completo',
    title: 'Bundle PINE Completo',
    subtitle: 'Guía premium + meditaciones + plantillas + taller grabado',
    description:
      'Todo el kit PINE en un solo lugar: la guía completa, los audios, el cuaderno de ruta quirúrgico y materiales extras para el entorno familiar. El mejor valor de la escalera.',
    price: 79,
    compareAt: 110,
    level: 'alta',
    badge: 'Mejor valor',
    features: [
      'Guía Premium completa (caps. 1-6)',
      'Meditaciones guiadas',
      'Cuaderno de Ruta Quirúrgico',
      'Guía para el cuidador',
      'Taller grabado de preparación',
    ],
    includes: ['Todo el contenido de la Guía Premium', 'Materiales imprimibles para la familia', 'Taller grabado (60 min)', 'Actualizaciones de por vida'],
    icon: 'package',
    gradient: 'from-amber-500 to-orange-600',
    image: "https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?auto=format&fit=crop&w=1600&q=80",
  },
  {
    slug: 'protocolo-psicopine-en-quirofano',
    title: 'Protocolo PsicoPINE en Quirófano',
    subtitle: 'Intervención neuropsicológica e inserción en equipos quirúrgicos (B2B)',
    description:
      'Material técnico para psicólogos, neuropsicólogos y profesionales de la salud que quieren sistematizar la intervención en quirófano: diseño de pruebas personalizadas, manejo del estrés del equipo y humanización de la alta complejidad.',
    price: 99,
    level: 'b2b',
    badge: 'Profesionales',
    features: [
      'Protocolo de inserción en quirófano',
      'Diseño de pruebas personalizadas (lenguaje, motricidad, emociones)',
      'Manejo del estrés del equipo neuroquirúrgico',
      'Mapeo cortical: marco psicoeducativo',
    ],
    includes: ['PDF técnico (90+ páginas)', 'Casos de aplicación', 'Plantilla de informe', 'Certificado de participación'],
    icon: 'stethoscope',
    gradient: 'from-sky-600 to-indigo-700',
    image: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=1600&q=80",
  },
  {
    slug: 'membresia-biblioteca-pine',
    title: 'Membresía · Biblioteca PINE',
    subtitle: 'Acceso mensual a la biblioteca digital y nuevos materiales',
    description:
      'Una membresía para acompañar tu proceso mes a mes: biblioteca digital con guías, checklists, plantillas, meditaciones nuevas y contenido exclusivo para miembros.',
    price: 12,
    interval: 'monthly',
    level: 'recurrente',
    badge: 'Recurrente',
    features: [
      'Biblioteca digital PINE completa',
      'Material nuevo cada mes',
      'Meditaciones y audioguías',
      'Comunidad privada',
    ],
    includes: ['Acceso mensual', 'Cancelable cuando quieras', 'Nuevos contenidos cada mes'],
    icon: 'library',
    gradient: 'from-violet-500 to-purple-700',
    image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1600&q=80",
  },
  {
    slug: 'meditaciones-guiadas-pine',
    title: 'Meditaciones Guiadas PINE',
    subtitle: 'Audios para bajar la activación y preparar tu descanso',
    description:
      'Tres meditaciones guiadas basadas en la respiración vagal y el autorreconocimiento corporal, pensadas para los momentos de mayor tensión: antes de dormir, antes de la cirugía y en la recuperación.',
    price: 9,
    level: 'extra',
    badge: 'Bolsillo',
    features: [
      '3 audios guiados',
      'Respiración vagal',
      'Relajación prequirúrgica',
      'Descanso y recuperación',
    ],
    includes: ['Audios MP3', 'Guía de uso en PDF', 'Descarga ilimitada'],
    icon: 'music',
    gradient: 'from-pink-500 to-rose-600',
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80",
  },
  {
    slug: 'cuaderno-ruta-quirurgico',
    title: 'Cuaderno de Ruta Quirúrgico',
    subtitle: 'Plantillas para organizar el proceso en familia',
    description:
      'Hojas de trabajo para registrar dudas médicas, armar la red de contención, planificar el regreso al hogar y poner límites saludables a las visitas.',
    price: 12,
    level: 'extra',
    badge: 'Plantillas',
    features: [
      'Dudas médicas organizadas',
      'Red de contención',
      'Plan de regreso al hogar',
      'Registro de límites y visitas',
    ],
    includes: ['8 plantillas imprimibles', 'Cuaderno digital', 'Uso familiar ilimitado'],
    icon: 'layout',
    gradient: 'from-cyan-500 to-sky-700',
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80",
  },
];

export const getProduct = (slug: string): Product | undefined =>
  products.find((p) => p.slug === slug);

export const featuredProducts: Product[] = products
  .filter((p) => p.level !== 'lead-magnet')
  .slice(0, 3);
