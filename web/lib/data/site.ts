export type SocialLink = {
  label: string;
  short: string;
  url: string;
};

export const site = {
  name: 'Evolución Salud',
  tagline: 'Descubre, Inspira, Transforma',
  positioning: 'Líderes en PINE',
  description:
    'Plataforma educativa online de PsicoInmunoNeuroEndocrinología (PINE). Cursos, guías, podcast y recursos para integrar mente, cuerpo, emociones, hábitos y salud.',
  domain: 'https://evolucionsalud.com',
  email: 'profesionales@evolucionsalud.com',
  location: 'Córdoba, Argentina',
  whatsapp: {
    display: '+54 9 3518 67-6602',
    phone: '5493518676602',
    message:
      'Hola 👋, vengo de la web de Evolución Salud y quiero recibir más información.',
  },
  disclaimer:
    'Este material es de carácter psicoeducativo y no reemplaza la consulta con un profesional de la salud.',
};

export const whatsappLink = (message: string = site.whatsapp.message): string =>
  `https://wa.me/${site.whatsapp.phone}?text=${encodeURIComponent(message)}`;

// Nota: los enlaces de redes sociales usan el perfil real de Instagram
// (@evolucion_salud) y búsquedas de marca para el resto. En producción,
// reemplazar por las URLs oficiales de cada perfil.
export const socialLinks: SocialLink[] = [
  { label: 'Instagram', short: 'IG', url: 'https://instagram.com/evolucion_salud' },
  { label: 'Facebook', short: 'FB', url: 'https://www.facebook.com/search/top?q=Evoluci%C3%B3n%20Salud' },
  { label: 'TikTok', short: 'TT', url: 'https://www.tiktok.com/search?q=Evolucion%20Salud%20PINE' },
  { label: 'LinkedIn', short: 'LI', url: 'https://www.linkedin.com/search/results/all/?keywords=Evoluci%C3%B3n%20Salud' },
  { label: 'Threads', short: 'TH', url: 'https://www.threads.net/search?q=Evoluci%C3%B3n%20Salud' },
  { label: 'Pinterest', short: 'PT', url: 'https://ar.pinterest.com/search/pins/?q=Psicoinmunoneuroendocrinolog%C3%ADa' },
  { label: 'YouTube', short: 'YT', url: 'https://www.youtube.com/results?search_query=Evoluci%C3%B3n+Salud+PINE' },
];

export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  initials: string;
};

export const team: TeamMember[] = [
  {
    name: 'Lic. Claudia Espinoza',
    role: 'Equipo fundador · PINE',
    bio: 'Psicóloga especializada en PsicoInmunoNeuroEndocrinología. Forma parte del equipo que diseña los programas educativos y recursos psicoeducativos de Evolución Salud.',
    initials: 'CE',
  },
  {
    name: 'Lic. Carina Lescano',
    role: 'Equipo fundador · PINE',
    bio: 'Psicóloga con foco en la integración de mente, cuerpo y emociones. Participa en la creación de cursos, guías y contenidos para pacientes y familias.',
    initials: 'CL',
  },
  {
    name: 'Lic. Orietta Sferco',
    role: 'Neuropsicóloga · PINE intraquirúrgica',
    bio: 'Neuropsicóloga con experiencia en mapeo cortical intraoperatorio y acompañamiento prequirúrgico. Referente en la humanización de la alta complejidad médica.',
    initials: 'OS',
  },
];
