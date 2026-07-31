export type Episode = {
  slug: string;
  title: string;
  description: string;
  duration: string;
  // En producción: pegá el embed oficial de Spotify (iframe) o el video ID de YouTube.
  embedUrl?: string | null;
  spotifyUrl?: string;
  youtubeUrl?: string;
  icon: string;
  image: string;
  gradient: string;
};

const spotifySearch =
  'https://open.spotify.com/search/Evoluci%C3%B3n%20Salud';
const youtubeSearch =
  'https://www.youtube.com/results?search_query=Evoluci%C3%B3n+Salud+PINE';

export const podcast = {
  title: 'Podcast Evolución Salud',
  description:
    'Charlas de PsicoInmunoNeuroEndocrinología en lenguaje claro, con el equipo de Evolución Salud.',
  spotifyUrl: spotifySearch,
  youtubeUrl: youtubeSearch,
  episodes: [
    {
      slug: 'pine-ciencia-conexion-mente-cuerpo',
      title: 'PINE: la ciencia detrás de la conexión mente-cuerpo',
      description:
        'En este episodio contamos qué es la PsicoInmunoNeuroEndocrinología y por qué cada emoción tiene una traducción molecular.',
      duration: '32 min',
      embedUrl: null,
      spotifyUrl: spotifySearch,
      youtubeUrl: youtubeSearch,
      icon: 'brain',
      gradient: 'from-brand-500 to-leaf-600',
      image: "https://images.unsplash.com/photo-1590602847861-f357e9332bbc?auto=format&fit=crop&w=1600&q=80",
    },
    {
      slug: 'carga-alostatica-precio-invisible-del-estres',
      title: 'Carga alostática: el precio invisible del estrés',
      description:
        'Cuando el estrés se vuelve crónico, el cuerpo paga con desgaste. Te contamos cómo reconocerlo y qué hacer.',
      duration: '28 min',
      embedUrl: null,
      spotifyUrl: spotifySearch,
      youtubeUrl: youtubeSearch,
      icon: 'waves',
      gradient: 'from-sky-500 to-indigo-600',
      image: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=1600&q=80",
    },
    {
      slug: 'melatonina-descanso-hormona-recuperacion',
      title: 'Melatonina y descanso: la hormona que protege tu recuperación',
      description:
        'El rol de la melatonina, la higiene del sueño y cómo preparar tu descanso antes de una cirugía.',
      duration: '24 min',
      embedUrl: null,
      spotifyUrl: spotifySearch,
      youtubeUrl: youtubeSearch,
      icon: 'moon',
      gradient: 'from-violet-500 to-purple-700',
      image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1600&q=80",
    },
    {
      slug: 'cirugia-despierta-neuropsicologia-quirofano',
      title: 'Cirugía despierta: la neuropsicología dentro del quirófano',
      description:
        'Conversamos sobre el mapeo cortical intraoperatorio y cómo se humaniza la alta complejidad médica.',
      duration: '35 min',
      embedUrl: null,
      spotifyUrl: spotifySearch,
      youtubeUrl: youtubeSearch,
      icon: 'stethoscope',
      gradient: 'from-leaf-500 to-leaf-800',
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80",
    },
    {
      slug: 'cronobiologia-sincroniza-cuerpo-cirugia',
      title: 'Cronobiología: sincronizá tu cuerpo antes de la cirugía',
      description:
        'Tu reloj interno decide cómo te recuperas. Aprende a alinearlo con luz, comidas y descanso.',
      duration: '26 min',
      embedUrl: null,
      spotifyUrl: spotifySearch,
      youtubeUrl: youtubeSearch,
      icon: 'clock',
      gradient: 'from-amber-500 to-orange-600',
      image: "https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?auto=format&fit=crop&w=1600&q=80",
    },
    {
      slug: 'cuidar-al-cuidador-pine-ambioma-familiar',
      title: 'Cuidar al cuidador: PINE para el ambioma familiar',
      description:
        'El estrés es transversal a toda la familia. Herramientas para que quien acompaña también se sostenga.',
      duration: '22 min',
      embedUrl: null,
      spotifyUrl: spotifySearch,
      youtubeUrl: youtubeSearch,
      icon: 'heart',
      gradient: 'from-pink-500 to-rose-600',
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80",
    },
  ],
};
