/**
 * Serializer del motor de cursos.
 *
 * Convierte un objeto Course en Markdown canónico (Front Matter YAML + body).
 * Diseñado para el CMS visual de cursos:
 *  - preserva el orden de los campos del Front Matter;
 *  - formato consistente (js-yaml con opciones fijas);
 *  - no reescribe archivos que no cambiaron (ver `courseChanged`).
 */
import yaml from 'js-yaml';
import fs from 'fs';
import { parseCourseFile } from './parser';
import type {
  CertificateConfig,
  Course,
  CourseLesson,
  CourseModule,
  CourseResource,
  CourseVideo,
  Quiz,
  QuizQuestion,
  Teacher,
} from './types';

const DUMP_OPTIONS: yaml.DumpOptions = {
  lineWidth: 120,
  noRefs: true,
  quotingType: '"',
  sortKeys: false,
};

/**
 * Orden canónico de las claves del Front Matter de cursos.
 * Los campos van en un orden lógico: identidad → contenido → academic →
 * commercial → SEO → metadata.
 */
const CANONICAL_ORDER = [
  'id', 'slug', 'title', 'subtitle', 'description', 'category', 'author',
  'tags', 'teachers', 'thumbnail', 'banner', 'icon', 'gradient',
  'type', 'status', 'visibility', 'cta', 'externalUrl',
  'duration', 'level', 'difficulty', 'featured', 'sequential',
  'hasQuiz', 'hasCertificate', 'certificateConfig',
  'price', 'currency',
  'modules', 'videos', 'resources', 'quiz',
  'objectives', 'learning', 'audience', 'requirements',
  'faq', 'bibliography',
  'seo', 'createdAt', 'updatedAt',
];

/** Devuelve el front matter con las claves en orden canónico. */
export function orderCourseFrontmatter(
  data: Record<string, unknown>
): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of CANONICAL_ORDER) {
    if (key in data) ordered[key] = data[key];
  }
  for (const key of Object.keys(data)) {
    if (!CANONICAL_ORDER.includes(key)) ordered[key] = data[key];
  }
  return ordered;
}

/* ---------- helpers de serialización ---------- */

function serializeTeacher(t: Teacher): Record<string, unknown> {
  const o: Record<string, unknown> = { name: t.name };
  if (t.role) o.role = t.role;
  if (t.credentials) o.credentials = t.credentials;
  return o;
}

function serializeLesson(l: CourseLesson): Record<string, unknown> {
  const o: Record<string, unknown> = { id: l.id, title: l.title, type: l.type };
  if (l.description) o.description = l.description;
  if (l.type === 'video' && l.videoUrl) {
    o.videoUrl = l.videoUrl;
    if (l.platform) o.platform = l.platform;
  }
  if ((l.type === 'pdf' || l.type === 'link') && l.resourceUrl) {
    o.resourceUrl = l.resourceUrl;
  }
  if (l.duration) o.duration = l.duration;
  if (l.free) o.free = true;
  return o;
}

function serializeModule(m: CourseModule): Record<string, unknown> {
  const o: Record<string, unknown> = { title: m.title };
  if (m.id) o.id = m.id;
  if (m.description) o.description = m.description;
  if (m.lessons?.length) o.lessons = m.lessons.map(serializeLesson);
  return o;
}

function serializeVideo(v: CourseVideo): Record<string, unknown> {
  const o: Record<string, unknown> = { title: v.title, url: v.url };
  if (v.description) o.description = v.description;
  if (v.duration) o.duration = v.duration;
  return o;
}

function serializeResource(r: CourseResource): Record<string, unknown> {
  const o: Record<string, unknown> = { title: r.title, type: r.type, url: r.url };
  if (r.description) o.description = r.description;
  return o;
}

function serializeQuizQuestion(q: QuizQuestion): Record<string, unknown> {
  const o: Record<string, unknown> = { type: q.type, label: q.label };
  if (q.options?.length) o.options = q.options;
  if (q.placeholder) o.placeholder = q.placeholder;
  if (q.required === false) o.required = false;
  if (q.scale) o.scale = q.scale;
  if (q.url) o.url = q.url;
  if (q.urlLabel) o.urlLabel = q.urlLabel;
  if (q.correct !== undefined) o.correct = q.correct;
  return o;
}

function serializeQuiz(quiz: Quiz): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  if (quiz.title) o.title = quiz.title;
  if (quiz.description) o.description = quiz.description;
  if (quiz.ctaLabel) o.ctaLabel = quiz.ctaLabel;
  if (quiz.passThreshold !== undefined) o.passThreshold = quiz.passThreshold;
  o.questions = quiz.questions.map(serializeQuizQuestion);
  return o;
}

function serializeCertificateConfig(cc: CertificateConfig): Record<string, unknown> {
  const o: Record<string, unknown> = { enabled: cc.enabled };
  if (cc.signers?.length) {
    o.signers = cc.signers.map((s) => {
      const so: Record<string, unknown> = { name: s.name };
      if (s.title) so.title = s.title;
      if (s.license) so.license = s.license;
      return so;
    });
  }
  return o;
}

function serializeFaqItem(item: { question: string; answer: string }): Record<string, unknown> {
  return { question: item.question, answer: item.answer };
}

function serializeBibliographyEntry(
  e: { id?: string; authors: string; year?: string; title: string; source?: string; url?: string }
): Record<string, unknown> {
  const o: Record<string, unknown> = { authors: e.authors, title: e.title };
  if (e.id) o.id = e.id;
  if (e.year) o.year = e.year;
  if (e.source) o.source = e.source;
  if (e.url) o.url = e.url;
  return o;
}

/* ---------- serialización principal ---------- */

export function serializeCourseToData(course: Course): Record<string, unknown> {
  const data: Record<string, unknown> = {
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    description: course.description,
    category: course.category,
  };

  if (course.author) data.author = course.author;
  if (course.tags?.length) data.tags = course.tags;
  if (course.teachers?.length) data.teachers = course.teachers.map(serializeTeacher);
  if (course.thumbnail) data.thumbnail = course.thumbnail;
  if (course.banner) data.banner = course.banner;
  if (course.icon && course.icon !== 'book') data.icon = course.icon;
  if (course.gradient && course.gradient !== 'from-brand-500 to-leaf-600') data.gradient = course.gradient;

  data.type = course.type;
  data.status = course.status;
  data.visibility = course.visibility;
  data.cta = course.cta;

  if (course.externalUrl) data.externalUrl = course.externalUrl;
  if (course.duration) data.duration = course.duration;
  if (course.level) data.level = course.level;
  if (course.difficulty) data.difficulty = course.difficulty;
  if (course.featured) data.featured = true;
  data.hasQuiz = course.hasQuiz;
  data.hasCertificate = course.hasCertificate;
  if (course.certificateConfig) data.certificateConfig = serializeCertificateConfig(course.certificateConfig);
  if (course.price !== undefined) data.price = course.price;
  if (course.currency && course.currency !== 'ARS') data.currency = course.currency;

  if (course.modules?.length) data.modules = course.modules.map(serializeModule);
  if (course.videos?.length) data.videos = course.videos.map(serializeVideo);
  if (course.resources?.length) data.resources = course.resources.map(serializeResource);
  if (course.quiz) data.quiz = serializeQuiz(course.quiz);

  if (course.objectives?.length) data.objectives = course.objectives;
  if (course.learning?.length) data.learning = course.learning;
  if (course.audience?.length) data.audience = course.audience;
  if (course.requirements?.length) data.requirements = course.requirements;
  if (course.faq?.length) data.faq = course.faq.map(serializeFaqItem);
  if (course.bibliography?.length) data.bibliography = course.bibliography.map(serializeBibliographyEntry);

  const seo: Record<string, unknown> = {};
  if (course.seo?.title) seo.title = course.seo.title;
  if (course.seo?.description) seo.description = course.seo.description;
  if (course.seo?.keywords?.length) seo.keywords = course.seo.keywords;
  if (course.seo?.ogImage) seo.ogImage = course.seo.ogImage;
  if (course.seo?.ogType) seo.ogType = course.seo.ogType;
  if (Object.keys(seo).length) data.seo = seo;

  if (course.sequential) data.sequential = true;

  if (course.createdAt) data.createdAt = course.createdAt;
  if (course.updatedAt) data.updatedAt = course.updatedAt;

  return data;
}

/**
 * Genera el body Markdown a partir de las secciones del curso.
 * Las secciones de tipo known se serializan como ## headings.
 */
function serializeBody(course: Course): string {
  const parts: string[] = [];

  // Secciones que vivían en el body original
  for (const section of course.sections ?? []) {
    if (section.type === 'generic') continue;
    parts.push(`## ${section.title}\n`);
    if (section.html) {
      // El html viene de marked.parse; lo incluimos tal cual
      parts.push(section.html.trim() + '\n');
    }
    if (section.items?.length) {
      for (const item of section.items) {
        parts.push(`- ${item}`);
      }
      parts.push('');
    }
  }

  // Si no había secciones, generar desde los datos
  if (parts.length === 0) {
    if (course.objectives?.length) {
      parts.push('## Qué aprenderás\n');
      for (const o of course.objectives) parts.push(`- ${o}`);
      parts.push('');
    }
  }

  return parts.join('\n').trim() + '\n';
}

/** Serializa un curso completo a Markdown canónico. */
export function serializeCourse(course: Course): string {
  const data = serializeCourseToData(course);
  const ordered = orderCourseFrontmatter(data);
  const frontmatter = yaml.dump(ordered, DUMP_OPTIONS).trimEnd();
  const body = serializeBody(course);
  return `---\n${frontmatter}\n---\n\n${body}`;
}

/**
 * Compara semánticamente si un curso cambió respecto a su archivo existente.
 * Compara la serialización YAML del front matter (ignorando defaults del parser)
 * y el body regenerado. Devuelve `false` si el contenido es equivalente.
 */
export function courseChanged(filePath: string, course: Course): boolean {
  if (!fs.existsSync(filePath)) return true;
  try {
    const existingContent = fs.readFileSync(filePath, 'utf8');
    const newContent = serializeCourse(course);
    // Comparar front matter: extraer solo las claves que el serializer escribe
    const extractFrontmatter = (md: string): Record<string, unknown> | null => {
      const m = md.match(/^---\n([\s\S]*?)\n---/);
      if (!m) return null;
      try {
        return yaml.load(m[1]) as Record<string, unknown>;
      } catch {
        return null;
      }
    };
    const existingFM = extractFrontmatter(existingContent);
    const newFM = extractFrontmatter(newContent);
    if (JSON.stringify(existingFM) !== JSON.stringify(newFM)) return true;
    // Comparar body
    const extractBody = (md: string) => {
      const bodyMatch = md.match(/^---\n[\s\S]*?\n---\n\n([\s\S]*)$/);
      return bodyMatch?.[1]?.trim() ?? '';
    };
    return extractBody(existingContent) !== extractBody(newContent);
  } catch {
    return true;
  }
}
