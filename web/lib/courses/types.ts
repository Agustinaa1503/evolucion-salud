/**
 * Tipos del LMS de Evolución Salud.
 *
 * La fuente de verdad de cada curso es un archivo Markdown en `/Cursos`
 * con Front Matter (YAML). Este módulo define el contrato entre el archivo
 * y la aplicación. No tocar tipos aquí para agregar un curso: basta con
 * crear un nuevo `.md` (ver AGENT.md).
 */

/** Tipo comercial del curso. */
export type CourseType = 'free' | 'paid' | 'upcoming';

/** Estado del ciclo de vida del curso. */
export type CourseStatus = 'published' | 'in-development' | 'draft' | 'archived';

/** Visibilidad para el sitio público. */
export type CourseVisibility = 'public' | 'private';

/** CTA principal que decide el botón/acción del hero. */
export type CourseCTA =
  | 'ver-curso'
  | 'proximamente'
  | 'inscribirme'
  | 'lista-espera';

export type Teacher = {
  name: string;
  role?: string;
  credentials?: string;
};

export type CourseVideo = {
  title: string;
  description?: string;
  url: string;
  duration?: string;
};

/** Tipo de contenido de una lección. */
export type LessonType =
  | 'video'
  | 'pdf'
  | 'texto'
  | 'quiz'
  | 'link';

export type LessonPlatform =
  | 'youtube'
  | 'vimeo'
  | 'drive'
  | 'local'
  | 'link';

/**
 * Lección del curso. El `id` es estable y único dentro del curso: es la
 * clave que usarán las fases siguientes (progreso, certificado) para
 * registrar avance por lección.
 */
export type CourseLesson = {
  id: string;
  title: string;
  description?: string;
  type: LessonType;
  /** URL del video (si `type === 'video'`). */
  videoUrl?: string;
  /** Plataforma de alojamiento del video. */
  platform?: LessonPlatform;
  /** URL del recurso adjunto (si `type === 'pdf' | 'link'`). */
  resourceUrl?: string;
  duration?: string;
  /** Lección de muestra gratuita (visible sin compra). */
  free?: boolean;
};

export type ResourceType =
  | 'pdf'
  | 'ebook'
  | 'audio'
  | 'meditacion'
  | 'checklist'
  | 'plantilla'
  | 'archivo'
  | 'link'
  | 'video';

export type CourseResource = {
  title: string;
  type: ResourceType;
  url: string;
  description?: string;
};

export type QuizQuestionType =
  | 'texto'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'textarea'
  | 'escala'
  | 'link';

export type QuizScale = {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
};

export type QuizQuestion = {
  type: QuizQuestionType;
  label: string;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  scale?: QuizScale;
  url?: string;
  urlLabel?: string;
};

export type Quiz = {
  title?: string;
  description?: string;
  ctaLabel?: string;
  questions: QuizQuestion[];
};

export type CourseModule = {
  id?: string;
  title: string;
  description?: string;
  lessons?: CourseLesson[];
};

export type FaqItem = {
  question: string;
  answer: string;
};

/** Entrada bibliográfica / fuente citada del curso. */
export type BibliographyEntry = {
  id?: string;
  authors: string;
  year?: string;
  title: string;
  source?: string;
  url?: string;
};

export type CourseSEO = {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: string;
};

/** Tipos de sección que el renderizador sabe mostrar. */
export type CourseSectionType =
  | 'intro'
  | 'objectives'
  | 'audience'
  | 'requirements'
  | 'learning'
  | 'program'
  | 'modules'
  | 'videos'
  | 'resources'
  | 'quiz'
  | 'bibliography'
  | 'faq'
  | 'cta'
  | 'generic';

/** Sección detectada en el cuerpo del Markdown (título `## ...`). */
export type CourseSection = {
  type: CourseSectionType;
  title: string;
  /** HTML renderizado desde Markdown (secciones de prosa). */
  html?: string;
  /** Ítems de lista extraídos del cuerpo (objetivos, temario, etc.). */
  items?: string[];
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  author?: string;
  teachers: Teacher[];
  thumbnail?: string;
  banner?: string;
  duration?: string;
  level?: string;
  difficulty?: string;
  type: CourseType;
  status: CourseStatus;
  visibility: CourseVisibility;
  cta: CourseCTA;
  externalUrl?: string;
  price?: number;
  currency: string;
  seo: CourseSEO;
  createdAt?: string;
  updatedAt?: string;
  featured: boolean;
  hasQuiz: boolean;
  hasCertificate: boolean;
  videos: CourseVideo[];
  resources: CourseResource[];
  modules: CourseModule[];
  objectives: string[];
  learning: string[];
  audience: string[];
  requirements: string[];
  faq: FaqItem[];
  quiz?: Quiz;
  /** Bibliografía estructurada (autores, año, fuente). */
  bibliography: BibliographyEntry[];
  /** Secciones detectadas en el cuerpo, en orden de aparición. */
  sections: CourseSection[];
  /** Icono y gradiente de marca (fallback visual). */
  icon: string;
  gradient: string;
};

export const isPublicCourse = (course: Course): boolean =>
  course.visibility === 'public' &&
  course.status !== 'draft' &&
  course.status !== 'archived';

export const isFreeCourse = (course: Course): boolean =>
  isPublicCourse(course) && course.type === 'free';

export const isUpcomingCourse = (course: Course): boolean =>
  isPublicCourse(course) && course.type === 'upcoming';

/** Cantidad total de lecciones del curso (todos los módulos). */
export const countLessons = (course: Course): number =>
  course.modules.reduce((total, m) => total + (m.lessons?.length ?? 0), 0);
