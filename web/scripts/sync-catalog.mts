/**
 * Sincroniza el catálogo de cursos desde `Cursos/*.md` hacia Supabase.
 *
 * La fuente de verdad de cada curso es su Markdown (ver AGENT.md sección 9.1).
 * Este script upserta el catálogo en las tablas `courses`, `course_modules`,
 * `course_lessons`, `course_resources`, `course_videos`, `course_quizzes` y
 * `quiz_questions` para que progreso, panel de administración y analytics
 * consulten con FKs reales.
 *
 * Uso:  npm run db:sync-catalog
 *       (necesita NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY)
 *
 * Garantías:
 *  - Idempotente: se puede correr las veces que sea necesario.
 *  - Preserva IDs: las lecciones se matchean por `lesson_key` (id estable del
 *    Markdown), así el progreso de los alumnos no se pierde al re-sincronizar.
 *  - Eliminación segura: solo borra hijos huérfanos que no tengan referencias
 *    de progreso (las FKs protegen; si hay una, el borrado se omite).
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { getAllCourses } from '../lib/courses/registry';
import type {
  Course,
  CourseLesson,
  CourseModule,
  CourseResource,
  CourseVideo,
  Quiz,
  QuizQuestion,
} from '../lib/courses/types';

/* -------------------------------------------------------------------------- */
/* Carga de variables de entorno (process.env tiene prioridad)                */
/* -------------------------------------------------------------------------- */
function loadEnvFile(file: string): void {
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, key, value] = m;
    if (process.env[key] !== undefined) continue;
    process.env[key] = value.replace(/^["']|["']$/g, '').trim();
  }
}
loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    '[sync-catalog] Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY. ' +
      'Completá web/.env.local y volvé a intentar.'
  );
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */
/** Convierte "10:00", "1h 30m" o "45 min" en segundos (o null si no puede). */
export function parseDurationToSeconds(value: string | undefined): number | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  const hms = v.match(/^(\d{1,3}):(\d{2})(?::(\d{2}))?$/);
  if (hms) {
    return (
      Number(hms[1]) * 3600 + Number(hms[2]) * 60 + Number(hms[3] ?? 0)
    );
  }
  const total = v
    .split(/\s+/)
    .reduce<number>((acc, part) => {
      const h = part.match(/^(\d+(?:\.\d+)?)h$/);
      if (h) return acc + Math.round(Number(h[1]) * 3600);
      const m = part.match(/^(\d+(?:\.\d+)?)m$/);
      if (m) return acc + Math.round(Number(m[1]) * 60);
      const min = part.match(/^(\d+(?:\.\d+)?)min$/);
      if (min) return acc + Math.round(Number(min[1]) * 60);
      return acc;
    }, 0);
  return total > 0 ? total : null;
}

const quietDelete = (result: { error: unknown }): boolean => {
  if (!result.error) return true;
  const code = (result.error as { code?: string }).code;
  // 23503 = foreign key violation: está referenciado por progreso → se conserva.
  if (code === '23503') return false;
  console.warn('  (borrado omitido por error)', code ?? result.error);
  return false;
};

const now = new Date().toISOString();

/* -------------------------------------------------------------------------- */
/* Sincronización de un curso                                                  */
/* -------------------------------------------------------------------------- */
async function syncQuiz(sb: typeof import('@supabase/supabase-js').default, courseId: string, quiz: Quiz | undefined) {
  const { data: existing, error: listErr } = await sb
    .from('course_quizzes')
    .select('id, position')
    .eq('course_id', courseId)
    .order('position');
  if (listErr) throw new Error(`list course_quizzes: ${listErr.message}`);

  const existingByPos = new Map((existing ?? []).map((q) => [q.position, q.id]));
  const seenPositions = new Set<number>();

  if (quiz && quiz.questions.length) {
    const position = 0;
    seenPositions.add(position);
    let quizId = existingByPos.get(position);
    const quizRow = {
      course_id: courseId,
      position,
      title: quiz.title ?? null,
      description: quiz.description ?? null,
      cta_label: quiz.ctaLabel ?? null,
      pass_threshold: quiz.passThreshold ?? 60,
    };

    if (quizId) {
      await sb.from('course_quizzes').update(quizRow).eq('id', quizId);
    } else {
      const { data, error } = await sb
        .from('course_quizzes')
        .insert(quizRow)
        .select('id')
        .single();
      if (error) throw new Error(`insert course_quizzes: ${error.message}`);
      quizId = data.id;
    }

    // Preguntas (match por posición dentro del quiz)
    const { data: qExisting, error: qListErr } = await sb
      .from('quiz_questions')
      .select('id, position')
      .eq('quiz_id', quizId)
      .order('position');
    if (qListErr) throw new Error(`list quiz_questions: ${qListErr.message}`);
    const qExistingByPos = new Map((qExisting ?? []).map((q) => [q.position, q.id]));
    const qSeen = new Set<number>();

    for (const [index, question] of quiz.questions.entries()) {
      const pos = index;
      qSeen.add(pos);
      const row = {
        quiz_id: quizId,
        position: pos,
        type: question.type,
        label: question.label,
        options: question.options ?? [],
        scale: question.scale ?? null,
        correct: question.correct ?? null,
        placeholder: question.placeholder ?? null,
        url: question.url ?? null,
        url_label: question.urlLabel ?? null,
        required: question.required ?? true,
      };
      const existingId = qExistingByPos.get(pos);
      if (existingId) {
        await sb.from('quiz_questions').update(row).eq('id', existingId);
      } else {
        await sb.from('quiz_questions').insert(row);
      }
    }

    // Preguntas huérfanas
    for (const [pos, id] of qExistingByPos) {
      if (!qSeen.has(pos)) await quietDelete(await sb.from('quiz_questions').delete().eq('id', id));
    }
  }

  // Quizzes huérfanos (no hay quiz nuevo): borrado seguro
  for (const [pos, id] of existingByPos) {
    if (!seenPositions.has(pos)) await quietDelete(await sb.from('course_quizzes').delete().eq('id', id));
  }
}

async function syncCourse(course: Course): Promise<void> {
  const courseRow = {
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle || null,
    description: course.description,
    category: course.category,
    level: course.level ?? null,
    difficulty: course.difficulty ?? null,
    duration: course.duration ?? null,
    duration_seconds: null,
    type: course.type,
    status: course.status,
    visibility: course.visibility,
    cta: course.cta,
    external_url: course.externalUrl ?? null,
    price: course.price ?? null,
    currency: course.currency,
    featured: course.featured,
    has_quiz: course.hasQuiz,
    has_certificate: course.hasCertificate,
    thumbnail: course.thumbnail ?? null,
    banner: course.banner ?? null,
    tags: [],
    seo: {
      title: course.seo.title ?? null,
      description: course.seo.description ?? null,
      keywords: course.seo.keywords ?? [],
      ogImage: course.seo.ogImage ?? null,
      ogType: course.seo.ogType ?? 'article',
    },
    updated_at: now,
  };

  const { data: upserted, error: courseErr } = await sb
    .from('courses')
    .upsert(courseRow, { onConflict: 'slug' })
    .select('id')
    .single();
  if (courseErr) throw new Error(`upsert courses "${course.slug}": ${courseErr.message}`);
  const courseId = upserted.id;

  /* ---- duration total (suma de duraciones de lecciones) ---- */
  let totalSeconds = 0;
  let hasDuration = false;
  for (const m of course.modules) {
    for (const l of m.lessons ?? []) {
      const s = parseDurationToSeconds(l.duration);
      if (s !== null) {
        totalSeconds += s;
        hasDuration = true;
      }
    }
  }
  if (hasDuration) {
    await sb.from('courses').update({ duration_seconds: totalSeconds }).eq('id', courseId);
  }

  /* ---- módulos (match por md_id o título) ---- */
  const { data: modExisting, error: modListErr } = await sb
    .from('course_modules')
    .select('id, md_id, title, position')
    .eq('course_id', courseId);
  if (modListErr) throw new Error(`list course_modules: ${modListErr.message}`);

  const existingModules = modExisting ?? [];
  const byMdId = new Map(existingModules.filter((m) => m.md_id).map((m) => [m.md_id, m.id]));
  const byTitle = new Map(existingModules.map((m) => [m.title, m.id]));
  const keptModuleIds = new Set<string>();
  const moduleIdByIndex = new Map<number, string>();

  for (const [index, module] of course.modules.entries()) {
    let moduleId = module.id ? byMdId.get(module.id) : undefined;
    if (!moduleId) moduleId = byTitle.get(module.title);
    const row = {
      course_id: courseId,
      position: index,
      md_id: module.id ?? null,
      title: module.title,
      description: module.description ?? null,
      updated_at: now,
    };
    if (moduleId) {
      await sb.from('course_modules').update(row).eq('id', moduleId);
    } else {
      const { data, error } = await sb
        .from('course_modules')
        .insert(row)
        .select('id')
        .single();
      if (error) throw new Error(`insert course_modules: ${error.message}`);
      moduleId = data.id;
    }
    keptModuleIds.add(moduleId);
    moduleIdByIndex.set(index, moduleId);

    await syncLessons(sb, courseId, moduleId, module, index);
  }

  /* ---- borrado seguro de módulos huérfanos ---- */
  for (const m of existingModules) {
    if (!keptModuleIds.has(m.id)) await quietDelete(await sb.from('course_modules').delete().eq('id', m.id));
  }

  /* ---- recursos y videos (match por posición) ---- */
  await syncPositional(sb, 'course_resources', courseId, course.resources.map((r) => ({
    title: r.title,
    type: r.type,
    url: r.url,
    description: r.description ?? null,
  })));
  await syncPositional(sb, 'course_videos', courseId, course.videos.map((v) => ({
    title: v.title || 'Video',
    url: v.url,
    duration: v.duration ?? null,
    description: v.description ?? null,
  })));

  await syncQuiz(sb, courseId, course.quiz);

  console.log(`  ✔ ${course.slug} (${course.modules.length} módulos, ${countLessonsOf(course)} lecciones)`);
}

async function syncLessons(
  sb: typeof import('@supabase/supabase-js').default,
  courseId: string,
  moduleId: string,
  module: CourseModule,
  moduleIndex: number
) {
  const { data: lessonExisting, error: listErr } = await sb
    .from('course_lessons')
    .select('id, lesson_key')
    .eq('course_id', courseId);
  if (listErr) throw new Error(`list course_lessons: ${listErr.message}`);

  const existingByKey = new Map((lessonExisting ?? []).map((l) => [l.lesson_key, l.id]));
  const seenKeys = new Set<string>();
  const lessons = module.lessons ?? [];

  for (const [index, lesson] of lessons.entries()) {
    const key = lesson.id;
    seenKeys.add(key);
    const existingId = existingByKey.get(key);
    const row = {
      course_id: courseId,
      module_id: moduleId,
      position: index,
      lesson_key: key,
      title: lesson.title,
      description: lesson.description ?? null,
      type: lesson.type,
      platform: lesson.platform ?? null,
      video_url: lesson.videoUrl ?? null,
      resource_url: lesson.resourceUrl ?? null,
      duration: lesson.duration ?? null,
      duration_seconds: parseDurationToSeconds(lesson.duration),
      is_free: lesson.free ?? false,
      updated_at: now,
    };
    if (existingId) {
      await sb.from('course_lessons').update(row).eq('id', existingId);
    } else {
      await sb.from('course_lessons').insert(row);
    }
  }

  // Borrado seguro: solo lecciones que no estén en el Markdown actual
  for (const [key, id] of existingByKey) {
    if (!seenKeys.has(key)) await quietDelete(await sb.from('course_lessons').delete().eq('id', id));
  }
}

/** Para resources y videos: upsert por posición dentro del curso. */
async function syncPositional(
  sb: typeof import('@supabase/supabase-js').default,
  table: 'course_resources' | 'course_videos',
  courseId: string,
  rows: Record<string, unknown>[]
) {
  const { data: existing, error: listErr } = await sb
    .from(table)
    .select('id, position')
    .eq('course_id', courseId);
  if (listErr) throw new Error(`list ${table}: ${listErr.message}`);

  const byPos = new Map((existing ?? []).map((r) => [r.position, r.id]));
  const seen = new Set<number>();

  for (const [index, row] of rows.entries()) {
    seen.add(index);
    const base = { course_id: courseId, position: index };
    const existingId = byPos.get(index);
    if (existingId) {
      await sb.from(table).update({ ...base, ...row, updated_at: now }).eq('id', existingId);
    } else {
      await sb.from(table).insert({ ...base, ...row });
    }
  }

  for (const [pos, id] of byPos) {
    if (!seen.has(pos)) await quietDelete(await sb.from(table).delete().eq('id', id));
  }
}

function countLessonsOf(course: Course): number {
  return course.modules.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0);
}

/* -------------------------------------------------------------------------- */
/* Ejecución                                                                  */
/* -------------------------------------------------------------------------- */
async function main() {
  const courses = getAllCourses();
  if (!courses.length) {
    console.error('[sync-catalog] No se encontraron cursos en Cursos/');
    process.exit(1);
  }
  console.log(`[sync-catalog] Sincronizando ${courses.length} cursos…`);
  for (const course of courses) {
    await syncCourse(course);
  }
  console.log('[sync-catalog] Catálogo sincronizado correctamente.');
}

main().catch((err) => {
  console.error('[sync-catalog] Error:', err?.message ?? err);
  process.exit(1);
});
