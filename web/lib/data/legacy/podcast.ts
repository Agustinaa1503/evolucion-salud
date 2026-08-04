export type Episode = {
  slug: string;
  title: string;
  description: string;
  duration?: string;
  /** Serie del episodio (Mindfulness o Meditaciones PINE). */
  series?: 'mindfulness' | 'meditaciones-pine';
  // En producción: pegá el embed oficial de Spotify (iframe) o el video ID de YouTube.
  embedUrl?: string | null;
  spotifyUrl?: string;
  youtubeUrl?: string;
  /** Slugs de categorías de la taxonomía (FASE 10). */
  categories?: string[];
  /** Tags libres (FASE 10). */
  tags?: string[];
  /** Nivel de la taxonomía (FASE 10). */
  level?: string;
  /** Audiencias de la taxonomía (FASE 10). */
  audience?: string[];
  icon: string;
  image: string;
  gradient: string;
};

const spotifySearch =
  'https://open.spotify.com/search/Evoluci%C3%B3n%20Salud';

const episodes: Episode[] = [
    {
      slug: 'que-es-mindfulness',
      title: 'Qué es mindfulness?',
      description:
        'Introducción a la atención plena: qué es, de dónde viene y cómo transforma la relación con el momento presente.',
      series: 'mindfulness' as const,
      spotifyUrl: 'https://open.spotify.com/episode/1JIKbESInOT0XpTqdoCsFE',
      categories: ['mindfulness', 'meditacion'],
      tags: ['mindfulness', 'atención plena', 'práctica guiada'],
      level: 'introductorio',
      audience: ['publico-general'],
      icon: 'headphones',
      gradient: 'from-brand-500 to-leaf-600',
      image: '/mindfulness.png',
    },
    {
      slug: 'cualidades-de-mindfulness',
      title: 'Cualidades de Mindfulness',
      description:
        'Las cualidades que sostienen la práctica de la atención plena: apertura, curiosidad, amabilidad y ecuanimidad.',
      series: 'mindfulness' as const,
      spotifyUrl: 'https://open.spotify.com/episode/7oC1nTu9caNsInUrifdsqP',
      categories: ['mindfulness', 'meditacion'],
      tags: ['mindfulness', 'atención plena', 'práctica guiada'],
      level: 'introductorio',
      audience: ['publico-general'],
      icon: 'headphones',
      gradient: 'from-brand-500 to-leaf-600',
      image: '/mindfulness.png',
    },
    {
      slug: '7-cualidades-de-presencia',
      title: '7 cualidades de presencia',
      description:
        'Siete cualidades de presencia que cultivan una mente más serena, estable y compasiva en el día a día.',
      series: 'mindfulness' as const,
      spotifyUrl: 'https://open.spotify.com/episode/6dZd6fHqj46x4XLBCAS5GG',
      categories: ['mindfulness', 'meditacion'],
      tags: ['mindfulness', 'presencia', 'práctica guiada'],
      level: 'introductorio',
      audience: ['publico-general'],
      icon: 'headphones',
      gradient: 'from-brand-500 to-leaf-600',
      image: '/mindfulness.png',
    },
    {
      slug: 'modos-de-practica',
      title: 'Modos de Práctica',
      description:
        'Los distintos modos de practicar mindfulness: formal e informal, en quietud y en movimiento, con pautas claras.',
      series: 'mindfulness' as const,
      spotifyUrl: 'https://open.spotify.com/episode/70LdAMJ2kQXszCZaYVzcOh',
      categories: ['mindfulness', 'meditacion'],
      tags: ['mindfulness', 'práctica guiada', 'hábitos'],
      level: 'introductorio',
      audience: ['publico-general'],
      icon: 'headphones',
      gradient: 'from-brand-500 to-leaf-600',
      image: '/mindfulness.png',
    },
    {
      slug: '8-maneras-de-practicar',
      title: '8 Maneras de Practicar',
      description:
        'Ocho maneras sencillas de integrar la atención plena en la vida cotidiana, sin complicaciones y con constancia.',
      series: 'mindfulness' as const,
      spotifyUrl: 'https://open.spotify.com/episode/5154gJ9cwRy9zyj6tW1cwH',
      categories: ['mindfulness', 'meditacion'],
      tags: ['mindfulness', 'hábitos', 'práctica guiada'],
      level: 'introductorio',
      audience: ['publico-general'],
      icon: 'headphones',
      gradient: 'from-brand-500 to-leaf-600',
      image: '/mindfulness.png',
    },
    {
      slug: 'beneficios-del-mindfulness',
      title: 'Beneficios',
      description:
        'Qué dice la evidencia sobre los beneficios del mindfulness para el estrés, la atención, la regulación emocional y el descanso.',
      series: 'mindfulness' as const,
      spotifyUrl: 'https://open.spotify.com/episode/1hHZvrBGGXbfgiLp8n5eiu',
      categories: ['mindfulness', 'meditacion'],
      tags: ['mindfulness', 'bienestar', 'regulación emocional'],
      level: 'introductorio',
      audience: ['publico-general'],
      icon: 'headphones',
      gradient: 'from-brand-500 to-leaf-600',
      image: '/mindfulness.png',
    },
    {
      slug: 'practica-de-la-respiracion',
      title: 'Práctica de la respiración',
      description:
        'Práctica guiada de respiración consciente: una puerta directa para regular el sistema nervioso y volver al presente.',
      series: 'mindfulness' as const,
      spotifyUrl: 'https://open.spotify.com/episode/77o1kHJ8CFauF6LCG7Q7NE',
      categories: ['mindfulness', 'respiracion'],
      tags: ['mindfulness', 'respiración', 'sistema nervioso'],
      level: 'introductorio',
      audience: ['publico-general'],
      icon: 'headphones',
      gradient: 'from-brand-500 to-leaf-600',
      image: '/mindfulness.png',
    },
    {
      slug: 'practica-vipassana-tara-brach',
      title: 'Práctica de Vipassana de Tara Brach',
      description:
        'Práctica de Vipassana inspirada en la enseñanza de Tara Brach: observar el cuerpo y la respiración con amabilidad.',
      series: 'mindfulness' as const,
      spotifyUrl: 'https://open.spotify.com/episode/5jcli3F2qijARsisHCCFrF',
      categories: ['mindfulness', 'meditacion'],
      tags: ['mindfulness', 'vipassana', 'práctica guiada'],
      level: 'introductorio',
      audience: ['publico-general'],
      icon: 'headphones',
      gradient: 'from-brand-500 to-leaf-600',
      image: '/mindfulness.png',
    },
    {
      slug: 'abrazar-la-vida-con-una-sonrisa',
      title: 'Abrazar la Vida con una Sonrisa',
      description:
        'Una práctica de atención plena para ablandar el corazón, soltar la tensión y recibir la vida con una sonrisa.',
      series: 'mindfulness' as const,
      spotifyUrl: 'https://open.spotify.com/episode/3k4yXQuqRk4YLsaUAB4BgS',
      categories: ['mindfulness', 'meditacion'],
      tags: ['mindfulness', 'emociones', 'práctica guiada'],
      level: 'introductorio',
      audience: ['publico-general'],
      icon: 'headphones',
      gradient: 'from-brand-500 to-leaf-600',
      image: '/mindfulness.png',
    },
    {
      slug: 'visualizacion-del-nombre-y-evocacion',
      title: 'Visualización del nombre y evocación',
      description:
        'Práctica de visualización guiada: el poder del nombre propio y la evocación para anclar la atención y la calma.',
      series: 'mindfulness' as const,
      spotifyUrl: 'https://open.spotify.com/episode/4l2PNGjzFexeRkrs5i5vLc',
      categories: ['mindfulness', 'meditacion'],
      tags: ['mindfulness', 'visualización', 'práctica guiada'],
      level: 'introductorio',
      audience: ['publico-general'],
      icon: 'headphones',
      gradient: 'from-brand-500 to-leaf-600',
      image: '/mindfulness.png',
    },
    {
      slug: 'acunar-el-corazon-saki-santorelli',
      title: 'Acunar el Corazón - Saki Santorelli',
      description:
        'Práctica guiada basada en la tradición de Saki Santorelli para acunar el corazón y cultivar la autocompasión.',
      series: 'mindfulness' as const,
      spotifyUrl: 'https://open.spotify.com/episode/6PDzO2ypkLVX6whA2qyo6M',
      categories: ['mindfulness', 'meditacion'],
      tags: ['mindfulness', 'autocompasión', 'práctica guiada'],
      level: 'introductorio',
      audience: ['publico-general'],
      icon: 'headphones',
      gradient: 'from-brand-500 to-leaf-600',
      image: '/mindfulness.png',
    },
    {
      slug: 'precauciones-antes-de-las-practicas',
      title: 'Precauciones antes de realizar las prácticas',
      description:
        'Orientaciones importantes antes de comenzar a practicar: cómo acompañar las emociones intensas y cuándo consultar a un profesional.',
      series: 'mindfulness' as const,
      spotifyUrl: 'https://open.spotify.com/episode/4V7SRqyidBpdFavR3kcNaZ',
      categories: ['mindfulness', 'psicoeducacion'],
      tags: ['mindfulness', 'seguridad', 'acompañamiento'],
      level: 'introductorio',
      audience: ['publico-general'],
      icon: 'headphones',
      gradient: 'from-brand-500 to-leaf-600',
      image: '/mindfulness.png',
    },
    {
      slug: 'antes-de-la-practica-tonglen',
      title: 'Antes de la práctica Tonglen',
      description:
        'Preparación para la práctica de Tonglen: las intenciones, actitudes y condiciones previas para practicarla de forma segura.',
      series: 'mindfulness' as const,
      spotifyUrl: 'https://open.spotify.com/episode/7KDn8FIWs30oa1byWBqNZe',
      categories: ['mindfulness', 'meditacion'],
      tags: ['mindfulness', 'tonglen', 'práctica guiada'],
      level: 'introductorio',
      audience: ['publico-general'],
      icon: 'headphones',
      gradient: 'from-brand-500 to-leaf-600',
      image: '/mindfulness.png',
    },
    {
      slug: 'practica-tonglen',
      title: 'Práctica Tonglen',
      description:
        'Práctica guiada de Tonglen: respirar y entregar con el corazón abierto, transformando el sufrimiento en compasión.',
      series: 'mindfulness' as const,
      spotifyUrl: 'https://open.spotify.com/episode/1nu3o7yqVngAUdrGASOq41',
      categories: ['mindfulness', 'meditacion'],
      tags: ['mindfulness', 'tonglen', 'compasión'],
      level: 'introductorio',
      audience: ['publico-general'],
      icon: 'headphones',
      gradient: 'from-brand-500 to-leaf-600',
      image: '/mindfulness.png',
    },
    {
      slug: 'conciencia-de-pensamientos-y-emociones',
      title: 'Conciencia de los pensamientos y las emociones',
      description:
        'Práctica para observar pensamientos y emociones sin identificarse con ellos, cultivando distancia y claridad.',
      series: 'mindfulness' as const,
      spotifyUrl: 'https://open.spotify.com/episode/5IFCzCifKoU8Bsh9t9KE1M',
      categories: ['mindfulness', 'meditacion'],
      tags: ['mindfulness', 'pensamientos', 'emociones'],
      level: 'introductorio',
      audience: ['publico-general'],
      icon: 'headphones',
      gradient: 'from-brand-500 to-leaf-600',
      image: '/mindfulness.png',
    },
    {
      slug: 'comunicacion-corazon-intestino',
      title: 'Comunicación Corazón Intestino',
      description:
        'Meditación guiada para conectar el corazón y el intestino: dos centros que dialogan con el sistema nervioso y las emociones.',
      series: 'meditaciones-pine' as const,
      spotifyUrl: 'https://open.spotify.com/episode/3Z1UgTedW5VDBqO5YEHgrO',
      categories: ['meditacion', 'eje-intestino-cerebro'],
      tags: ['meditación guiada', 'eje intestino-cerebro', 'regulación'],
      level: 'introductorio',
      audience: ['publico-general'],
      icon: 'headphones',
      gradient: 'from-brand-600 to-clay-600',
      image: '/meditaciones-pine.png',
    },
    {
      slug: 'entrenar-la-calma-nervio-vago',
      title: 'Entrenar la calma activando el nervio vago',
      description:
        'Meditación guiada para activar el nervio vago y entrenar la calma desde la psiconeuroinmunoendocrinología.',
      series: 'meditaciones-pine' as const,
      spotifyUrl: 'https://open.spotify.com/episode/7ahcbn61058RXu7sjHjXfx',
      categories: ['meditacion', 'regulacion-emocional'],
      tags: ['meditación guiada', 'nervio vago', 'calma'],
      level: 'introductorio',
      audience: ['publico-general'],
      icon: 'headphones',
      gradient: 'from-brand-600 to-clay-600',
      image: '/meditaciones-pine.png',
    },
  ];

export const podcast = {
  title: 'Podcast Evolución Salud',
  description:
    'Prácticas guiadas de Mindfulness y Meditaciones PINE de Evolución Salud, para escuchar en Spotify.',
  spotifyUrl: spotifySearch,
  episodes,
};
