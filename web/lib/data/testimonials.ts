export type Testimonial = {
  quote: string;
  author: string;
  role: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      'La forma de explicar la conexión entre emociones y cuerpo me cambió la manera de acompañar a mis pacientes. Por fin un material en español con rigor científico y lenguaje humano.',
    author: 'Participante de la formación PINE',
    role: 'Profesional de la salud',
  },
  {
    quote:
      'Llegamos al quirófano con mucho miedo. Las herramientas de respiración y la guía nos dieron una calma que no sabíamos que podíamos tener.',
    author: 'Familiar de paciente',
    role: 'Cirugía programada',
  },
  {
    quote:
      'El protocolo de quirófano y la sección de cirugía despierta son un antes y un después para quienes trabajamos en alta complejidad.',
    author: 'Colega profesional',
    role: 'Neuropsicología',
  },
];

// IMPORTANTE: estos testimonios son ilustrativos para la maqueta.
// En producción se publican testimonios reales verificados por el equipo.
export const testimonialsNote =
  'Testimonios ilustrativos de la maqueta. En producción se publican testimonios reales verificados por el equipo de Evolución Salud.';
