import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { marked } from 'marked';
import type {
  BibliographyEntry,
  Course,
  CourseLesson,
  CourseModule,
  CourseResource,
  CourseSection,
  CourseSectionType,
  CourseVideo,
  FaqItem,
  LessonPlatform,
  LessonType,
  Quiz,
  QuizQuestion,
  Teacher,
} from './types';

/**
 * Parser del LMS: convierte un archivo Markdown de `/Cursos` en un objeto
 * `Course` tipado. No tocar este archivo para agregar un curso: solo hay
 * que crear un nuevo `.md` con Front Matter (ver AGENT.md).
 */

marked.setOptions({ gfm: true, breaks: true });

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const SECTION_ALIASES: Record<CourseSectionType, string[]> = {
  intro: ['acerca de este curso', 'acerca de', 'introduccion', 'bienvenida', 'sobre el curso'],
  objectives: ['objetivos', 'objetivo del curso', 'objetivos del curso'],
  audience: ['a quien esta dirigido', 'a quien va dirigido', 'para quien es', 'destinatarios'],
  requirements: ['requisitos', 'requisitos previos', 'conocimientos previos'],
  learning: ['que aprenderas', 'resultados de aprendizaje', 'aprenderas', 'aprenderas a'],
  program: ['programa', 'contenido del curso', 'temario', 'programa del curso', 'contenido'],
  modules: ['modulos', 'modulos del curso', 'estructura del curso', 'programa por modulos'],
  videos: ['videos', 'clases', 'lecciones', 'video clases', 'clases en video'],
  resources: ['recursos', 'material descargable', 'materiales', 'recursos descargables', 'descargables'],
  quiz: ['cuestionario', 'cuestionario personal', 'evaluacion', 'autoevaluacion', 'encuesta'],
  bibliography: ['bibliografia', 'referencias', 'fuentes', 'referencias bibliograficas'],
  faq: ['preguntas frecuentes', 'faq', 'preguntas', 'dudas frecuentes'],
  cta: ['cta', 'siguiente paso', 'como continuar', 'inscripcion'],
  generic: [],
};

export function classifySection(title: string): CourseSectionType {
  const key = normalize(title);
  for (const [type, aliases] of Object.entries(SECTION_ALIASES)) {
    if (type === 'generic') continue;
    if (aliases.some((a) => key === a || key.startsWith(`${a} `) || key.endsWith(` ${a}`))) {
      return type as CourseSectionType;
    }
  }
  return 'generic';
}

/* ---------- helpers de normalización de Front Matter ---------- */

const asString = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : fallback;

const asStringArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map((x) => asString(x)).filter(Boolean);
  if (typeof v === 'string') return v.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  return [];
};

const asBoolean = (v: unknown, fallback = false): boolean =>
  typeof v === 'boolean' ? v : typeof v === 'string' ? ['true', '1', 'si', 'sí', 'yes'].includes(v.toLowerCase()) : fallback;

const asObject = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

/* ---------- normalización de datos estructurados ---------- */

const parseTeachers = (v: unknown): Teacher[] => {
  if (Array.isArray(v)) {
    return v.map((t) =>
      typeof t === 'string'
        ? { name: t }
        : {
            name: asString(asObject(t).name),
            role: asString(asObject(t).role) || undefined,
            credentials: asString(asObject(t).credentials) || undefined,
          }
    ).filter((t) => t.name);
  }
  if (typeof v === 'string') return [{ name: v }];
  return [];
};

const parseVideos = (v: unknown): CourseVideo[] => {
  if (!Array.isArray(v)) return [];
  return v.map((item): CourseVideo | null => {
    if (typeof item === 'string') return { title: '', url: item };
    const o = asObject(item);
    const url = asString(o.url);
    if (!url) return null;
    return {
      title: asString(o.title),
      description: asString(o.description) || undefined,
      url,
      duration: asString(o.duration) || undefined,
    };
  }).filter((x): x is CourseVideo => x !== null);
};

const parseResources = (v: unknown): CourseResource[] => {
  if (!Array.isArray(v)) return [];
  return v.map((item): CourseResource | null => {
    if (typeof item === 'string') return { title: item, type: 'link', url: '#' };
    const o = asObject(item);
    const url = asString(o.url);
    if (!url) return null;
    const type = asString(o.type);
    return {
      title: asString(o.title),
      type: (['pdf', 'ebook', 'audio', 'meditacion', 'checklist', 'plantilla', 'archivo', 'link', 'video'] as const).includes(type as never)
        ? (type as CourseResource['type'])
        : 'link',
      url,
      description: asString(o.description) || undefined,
    };
  }).filter((x): x is CourseResource => x !== null);
};

const LESSON_TYPES: LessonType[] = ['video', 'pdf', 'texto', 'quiz', 'link'];
const LESSON_PLATFORMS: LessonPlatform[] = ['youtube', 'vimeo', 'drive', 'local', 'link'];

const asLessonType = (v: string): LessonType =>
  LESSON_TYPES.includes(v as LessonType) ? (v as LessonType) : 'texto';

const asPlatform = (v: string): LessonPlatform | undefined =>
  LESSON_PLATFORMS.includes(v as LessonPlatform) ? (v as LessonPlatform) : undefined;

const guessPlatform = (url: string): LessonPlatform | undefined => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  if (url.includes('drive.google.com')) return 'drive';
  return undefined;
};

const parseLessons = (v: unknown, moduleIndex: number): CourseLesson[] => {
  if (!Array.isArray(v)) return [];
  let counter = 0;
  return v.map((item): CourseLesson | null => {
    if (typeof item === 'string') {
      const title = item.trim();
      if (!title) return null;
      counter += 1;
      return {
        id: `m${moduleIndex + 1}-l${counter}`,
        title,
        type: 'texto',
      };
    }
    const o = asObject(item);
    const title = asString(o.title);
    if (!title) return null;
    counter += 1;
    const videoUrl = asString(o.videoUrl ?? o.video_url ?? o.url);
    const type = asLessonType(asString(o.type, videoUrl ? 'video' : 'texto'));
    return {
      id: asString(o.id, `m${moduleIndex + 1}-l${counter}`),
      title,
      description: asString(o.description) || undefined,
      type,
      videoUrl: type === 'video' ? videoUrl || undefined : undefined,
      platform: asPlatform(asString(o.platform)) ?? guessPlatform(videoUrl),
      resourceUrl:
        type === 'pdf' || type === 'link' ? asString(o.resourceUrl ?? o.resource_url ?? o.url) || undefined : undefined,
      duration: asString(o.duration) || undefined,
      free: asBoolean(o.free, false),
    };
  }).filter((x): x is CourseLesson => x !== null);
};

const parseModules = (v: unknown): CourseModule[] => {
  if (!Array.isArray(v)) return [];
  return v.map((item, index): CourseModule | null => {
    if (typeof item === 'string') {
      const title = item.trim();
      return title ? { title } : null;
    }
    const o = asObject(item);
    const title = asString(o.title);
    if (!title) return null;
    return {
      id: asString(o.id) || undefined,
      title,
      description: asString(o.description) || undefined,
      lessons: parseLessons(o.lessons ?? o.items, index),
    };
  }).filter((x): x is CourseModule => x !== null);
};

const parseQuestions = (v: unknown): QuizQuestion[] => {
  if (!Array.isArray(v)) return [];
  return v.map((item): QuizQuestion | null => {
    const o = asObject(item);
    const type = asString(o.type);
    if (!type || !asString(o.label)) return null;
    const scaleRaw = asObject(o.scale);
    return {
      type: type as QuizQuestion['type'],
      label: asString(o.label),
      options: asStringArray(o.options),
      placeholder: asString(o.placeholder) || undefined,
      required: asBoolean(o.required, true),
      scale:
        typeof o.scale === 'object' && o.scale !== null && !Array.isArray(o.scale)
          ? {
              min: typeof scaleRaw.min === 'number' ? scaleRaw.min : 1,
              max: typeof scaleRaw.max === 'number' ? scaleRaw.max : 5,
              minLabel: asString(scaleRaw.minLabel) || undefined,
              maxLabel: asString(scaleRaw.maxLabel) || undefined,
            }
          : undefined,
      url: asString(o.url) || undefined,
      urlLabel: asString(o.urlLabel) || undefined,
    };
  }).filter((x): x is QuizQuestion => x !== null);
};

const parseQuiz = (v: unknown): Quiz | undefined => {
  if (Array.isArray(v)) {
    const questions = parseQuestions(v);
    return questions.length ? { questions } : undefined;
  }
  const o = asObject(v);
  const questions = parseQuestions(o.questions ?? o.items);
  if (!questions.length) return undefined;
  return {
    title: asString(o.title) || undefined,
    description: asString(o.description) || undefined,
    ctaLabel: asString(o.ctaLabel) || undefined,
    questions,
  };
};

const parseFaq = (v: unknown): FaqItem[] => {
  if (!Array.isArray(v)) return [];
  return v.map((item): FaqItem | null => {
    const o = asObject(item);
    const question = asString(o.question);
    const answer = asString(o.answer);
    if (!question || !answer) return null;
    return { question, answer };
  }).filter((x): x is FaqItem => x !== null);
};

const parseBibliography = (v: unknown): BibliographyEntry[] => {
  if (!Array.isArray(v)) return [];
  return v.map((item): BibliographyEntry | null => {
    if (typeof item === 'string') {
      const title = item.trim();
      return title ? { authors: '—', title } : null;
    }
    const o = asObject(item);
    const title = asString(o.title);
    if (!title) return null;
    const authors = asString(o.authors ?? o.author);
    return {
      id: asString(o.id) || undefined,
      authors: authors || '—',
      year: asString(o.year) || undefined,
      title,
      source: asString(o.source ?? o.journal ?? o.publisher) || undefined,
      url: asString(o.url) || undefined,
    };
  }).filter((x): x is BibliographyEntry => x !== null);
};

/* ---------- extracción del cuerpo del Markdown ---------- */

type Block = { language: string; data: unknown };

const extractDataBlocks = (md: string): Block[] => {
  const blocks: Block[] = [];
  const fenceRe = /^```(yaml|yml|json)\s*\n([\s\S]*?)\n?```\s*$/gm;
  let match: RegExpExecArray | null;
  while ((match = fenceRe.exec(md)) !== null) {
    try {
      const raw = match[2];
      const data = match[1] === 'json' ? JSON.parse(raw) : yaml.load(raw);
      blocks.push({ language: match[1], data });
    } catch {
      // Bloque no parseable: se ignora y el resto del curso sigue intacto.
    }
  }
  return blocks;
};

const extractBulletItems = (md: string): string[] => {
  const items: string[] = [];
  for (const line of md.split('\n')) {
    const m = line.match(/^\s*(?:[-*+]|\d+\.)\s+(.+)$/);
    if (m) items.push(m[1].trim());
  }
  return items;
};

/** Quita los bloques delimitados ```yaml/json del cuerpo (datos estructurados). */
const stripFences = (md: string): string =>
  md.replace(/^```(yaml|yml|json)\s*\n[\s\S]*?\n?```\s*\n?/gm, '');

/** Quita líneas de lista del cuerpo (los ítems se renderizan con datos). */
const stripBulletLines = (md: string): string =>
  md
    .split('\n')
    .filter((line) => !/^\s*(?:[-*+]|\d+\.)\s+/.test(line))
    .join('\n');

const splitSections = (content: string): { title: string; body: string }[] => {
  const lines = content.split('\n');
  const sections: { title: string; body: string }[] = [];
  let current: { title: string; body: string } | null = null;

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      current = { title: heading[1].trim(), body: '' };
      sections.push(current);
    } else if (current) {
      current.body += `${line}\n`;
    }
  }
  return sections;
};

/* ---------- ensamblado final ---------- */

const LIST_SECTION_TYPES = new Set<CourseSectionType>([
  'objectives',
  'audience',
  'requirements',
  'learning',
  'program',
  'bibliography',
]);

export function parseCourseFile(filePath: string): Course {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const d = data as Record<string, unknown>;

  /* Cuerpo: secciones + bloques YAML estructurados por sección. */
  const rawSections = splitSections(content);

  const sectionBlocks: Record<string, Block[]> = {};
  const sections: CourseSection[] = rawSections.map((s) => {
    const type = classifySection(s.title);
    const blocks = extractDataBlocks(s.body);
    if (!sectionBlocks[type]) sectionBlocks[type] = [];
    sectionBlocks[type].push(...blocks);

    let prose = stripFences(s.body);
    if (type === 'videos' || type === 'resources' || type === 'modules' || type === 'quiz' || type === 'faq') {
      prose = stripBulletLines(prose);
    }

    return {
      type,
      title: s.title.trim(),
      html: marked.parse(prose.trim(), { async: false }),
      items: LIST_SECTION_TYPES.has(type) ? extractBulletItems(s.body) : undefined,
    };
  });

  const bodyData = (type: CourseSectionType): unknown[] =>
    (sectionBlocks[type] ?? []).map((b) => b.data);

  const sectionItems = (type: CourseSectionType): string[] =>
    sections.filter((s) => s.type === type).flatMap((s) => s.items ?? []);

  /* Recursos: front matter o bloque YAML de la sección "Recursos". */
  const resourcesBlock = bodyData('resources').find(
    (b) => Array.isArray(b) || Array.isArray(asObject(b).resources)
  );
  const resourcesRaw =
    resourcesBlock !== undefined
      ? Array.isArray(resourcesBlock)
        ? resourcesBlock
        : asObject(resourcesBlock).resources
      : d.resources;
  const resources = parseResources(resourcesRaw);

  /* Módulos: front matter o bloque YAML de la sección "Módulos". */
  const modulesBlock = bodyData('modules').find(
    (b) => Array.isArray(b) || Array.isArray(asObject(b).modules)
  );
  const modulesRaw =
    modulesBlock !== undefined
      ? Array.isArray(modulesBlock)
        ? modulesBlock
        : asObject(modulesBlock).modules
      : d.modules;
  const modules = parseModules(modulesRaw);

  /* Videos: front matter o bloque YAML, más las lecciones `video` de los
     módulos (fuente única: si el video está en un módulo no hace falta
     repetirlo en `videos`). Se eliminan duplicados por URL. */
  const videosBlock = bodyData('videos').find(
    (b) => Array.isArray(b) || Array.isArray(asObject(b).videos)
  );
  const videosRaw =
    videosBlock !== undefined
      ? Array.isArray(videosBlock)
        ? videosBlock
        : asObject(videosBlock).videos
      : d.videos;
  const explicitVideos = parseVideos(videosRaw);
  const moduleVideos = modules
    .flatMap((m) => m.lessons ?? [])
    .filter((l) => l.type === 'video' && l.videoUrl)
    .map((l): CourseVideo => ({
      title: l.title,
      description: l.description,
      url: l.videoUrl as string,
      duration: l.duration,
    }));
  const seen = new Set<string>();
  const videos = [...moduleVideos, ...explicitVideos]
    .filter((v) => {
      if (!v.url || seen.has(v.url)) return false;
      seen.add(v.url);
      return true;
    })
    .map((v, i) => (v.title ? v : { ...v, title: `Video ${i + 1}` }));

  /* Cuestionario: front matter o bloque YAML de la sección "Cuestionario". */
  const quizBodyBlocks = bodyData('quiz');
  const quizBlock = quizBodyBlocks.find(
    (b) =>
      Array.isArray(b) ||
      Array.isArray(asObject(b).questions) ||
      Array.isArray(asObject(b).items)
  );
  const quiz =
    quizBlock !== undefined
      ? parseQuiz(quizBlock)
      : d.quiz
        ? parseQuiz(d.quiz)
        : d.questions
          ? parseQuiz(d.questions)
          : undefined;

  /* FAQ: front matter o bloque YAML de la sección "Preguntas frecuentes". */
  const faqBlock = bodyData('faq').find((b) => Array.isArray(b));
  const faq = faqBlock !== undefined ? parseFaq(faqBlock) : parseFaq(d.faq);

  /* Bibliografía: front matter o bloque YAML de la sección "Bibliografía". */
  const biblioBlock = bodyData('bibliography').find(
    (b) => Array.isArray(b) || Array.isArray(asObject(b).bibliography ?? asObject(b).references)
  );
  const bibliographyRaw =
    biblioBlock !== undefined
      ? Array.isArray(biblioBlock)
        ? biblioBlock
        : asObject(biblioBlock).bibliography ?? asObject(biblioBlock).references
      : d.bibliography ?? d.references;
  const bibliography =
    bibliographyRaw !== undefined && parseBibliography(bibliographyRaw).length
      ? parseBibliography(bibliographyRaw)
      : sectionItems('bibliography').map((t): BibliographyEntry => ({ authors: '—', title: t }));

  const type = asString(d.type, 'free') as Course['type'];
  const status = asString(d.status, 'published') as Course['status'];

  const baseCta = type === 'upcoming' ? 'lista-espera' : type === 'paid' ? 'inscribirme' : 'ver-curso';
  const cta = asString(d.cta, baseCta) as Course['cta'];

  return {
    id: asString(d.id, path.basename(filePath, '.md')),
    slug: asString(d.slug, asString(d.id, path.basename(filePath, '.md'))),
    title: asString(d.title),
    subtitle: asString(d.subtitle),
    description: asString(d.description),
    category: asString(d.category, 'PINE'),
    author: asString(d.author) || undefined,
    teachers: parseTeachers(d.teachers ?? d.teacher ?? d.docentes),
    thumbnail: asString(d.thumbnail) || undefined,
    banner: asString(d.banner) || undefined,
    duration: asString(d.duration) || undefined,
    level: asString(d.level) || undefined,
    difficulty: asString(d.difficulty) || undefined,
    type,
    status,
    visibility: asString(d.visibility, 'public') as Course['visibility'],
    cta,
    externalUrl: asString(d.externalUrl ?? d.url) || undefined,
    price: typeof d.price === 'number' ? d.price : undefined,
    currency: asString(d.currency, 'ARS'),
    seo: {
      title: asString(asObject(d.seo).title) || undefined,
      description: asString(asObject(d.seo).description) || undefined,
      keywords: asStringArray(asObject(d.seo).keywords),
      ogImage: asString(asObject(d.seo).ogImage) || undefined,
      ogType: asString(asObject(d.seo).ogType, 'article') || undefined,
    },
    createdAt: asString(d.createdAt) || undefined,
    updatedAt: asString(d.updatedAt) || undefined,
    featured: asBoolean(d.featured, false),
    hasQuiz: quiz !== undefined || asBoolean(d.hasQuiz, false),
    hasCertificate: asBoolean(d.hasCertificate, false),
    videos,
    resources,
    modules,
    objectives: asStringArray(d.objectives).length ? asStringArray(d.objectives) : sectionItems('objectives'),
    learning: asStringArray(d.learning).length ? asStringArray(d.learning) : sectionItems('learning'),
    audience: asStringArray(d.audience).length ? asStringArray(d.audience) : sectionItems('audience'),
    requirements: asStringArray(d.requirements).length ? asStringArray(d.requirements) : sectionItems('requirements'),
    faq,
    quiz,
    bibliography,
    sections,
    icon: asString(d.icon, 'book'),
    gradient: asString(d.gradient, 'from-brand-500 to-leaf-600'),
  };
}
