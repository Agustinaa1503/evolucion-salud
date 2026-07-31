export type Question = {
  id: string;
  text: string;
  emoji: string;
};

export type QuestionBlock = {
  id: string;
  title: string;
  description: string;
  kind: 'select' | 'scale';
  options?: string[];
  questions: Question[];
};

export const questionnaire = {
  title: 'Matriz PINE de Autorreconocimiento',
  subtitle: 'Preparación Quirúrgica Integral',
  intro:
    'Bienvenido a tu espacio de preparación. Desde la PsicoInmunoNeuroEndocrinología (PINE), sabemos que cada cerebro se configura según su propia historia vital. Este cuestionario no es un diagnóstico clínico a distancia, sino una guía de autorreconocimiento para que identifiques cómo el impacto de la situación actual afecta tu biología. Al completarlo de forma individual, habilitarás tu acceso exclusivo a las herramientas personalizadas de afrontamiento.',
  googleFormUrl:
    'https://docs.google.com/forms/d/e/1FAIpQLSe_JfRLCEZCfpZ71IwbWD_smmp9mdVOUkCjh9EI6t36x5T8Mg/viewform?usp=header',
  blocks: [
    {
      id: 'perfil',
      title: 'Datos de registro y perfil',
      description:
        'Cuéntanos quién eres en este proceso. Cada persona tiene su propio camino: por eso cada quien completa su propia matriz.',
      kind: 'select' as const,
      options: [
        'Paciente programado/a para cirugía',
        'Referente familiar o cuidador/a principal',
        'Profesional de la salud',
      ],
      questions: [
        {
          id: 'participante',
          text: '¿Cómo participas de este proceso?',
          emoji: '👥',
        },
      ],
    },
    {
      id: 'percepcion',
      title: 'Bloque 1 · Percepción del desafío clínico',
      description:
        'Escala del 1 al 10 (1 = no me identifica nada · 10 = me identifica completamente)',
      kind: 'scale' as const,
      questions: [
        {
          id: 'novedad',
          text: 'Siento que esta situación médica y los procedimientos que se aproximan son completamente desconocidos para mí.',
          emoji: '🌀',
        },
        {
          id: 'impredecibilidad',
          text: 'Me resulta difícil anticipar o imaginar cómo organizaremos la rutina familiar y los tiempos en los próximos días.',
          emoji: '⏳',
        },
        {
          id: 'descontrol',
          text: 'Siento que he perdido el control sobre las prioridades diarias, mis actividades laborales o mi propio cuerpo.',
          emoji: '🧭',
        },
        {
          id: 'amenaza',
          text: 'Percibo el diagnóstico y el ingreso al quirófano como un peligro importante para mi integridad física o emocional.',
          emoji: '⚠️',
        },
      ],
    },
    {
      id: 'corporal',
      title: 'Bloque 2 · Autorreconocimiento de la activación corporal',
      description:
        'Escala del 1 al 10 (1 = no lo noto · 10 = lo noto todo el tiempo)',
      kind: 'scale' as const,
      questions: [
        {
          id: 'sueno',
          text: 'He notado insomnio, dificultades para conciliar el descanso o un agotamiento físico constante en los últimos días.',
          emoji: '💤',
        },
        {
          id: 'tension',
          text: 'Registro molestias corporales recurrentes como dolores de cabeza por tensión, palpitaciones o rigidez muscular.',
          emoji: '⚡',
        },
        {
          id: 'intestino',
          text: 'Presento alteraciones digestivas (acidez, náuseas, nudos en el estómago) o variaciones marcadas en el apetito.',
          emoji: '🍏',
        },
        {
          id: 'emociones',
          text: 'Me reconozco con mayor irritabilidad, sentimientos de frustración, confusión o tendencia al aislamiento.',
          emoji: '🌊',
        },
      ],
    },
    {
      id: 'ambioma',
      title: 'Bloque 3 · Recursos del ambioma y red de sostén',
      description:
        'Evalúa tu entorno de contención. El ambioma (tu familia, tus redes y tu hogar) también forma parte de tu biología.',
      kind: 'select' as const,
      options: ['Sí', 'Parcialmente', 'No'],
      questions: [
        {
          id: 'red_apoyo',
          text: '¿Siento que cuento con una red de apoyo familiar o social activa que me acompaña afectivamente en este proceso?',
          emoji: '👥',
        },
        {
          id: 'comunicacion',
          text: '¿Podemos expresar con claridad nuestros miedos, deseos y pensamientos dentro del núcleo familiar?',
          emoji: '💬',
        },
        {
          id: 'limites',
          text: '¿Conozco qué límites específicos necesitaré poner a los contactos sociales en el hogar para resguardar el descanso posquirúrgico?',
          emoji: '🏠',
        },
      ],
    },
  ],
};

export type QuestionnaireResult = {
  percepcionAvg: number;
  corporalAvg: number;
  ambiomaScore: number; // 0-6
  accessCode: string;
};
