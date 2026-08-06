'use client';

/**
 * SyllabusBuilder — Editor visual del programa de un curso.
 *
 * Componente cliente que permite editar:
 *  - Metadatos generales (título, subtítulo, descripción, categoría, estado, etc.)
 *  - Módulos (crear, reordenar, editar, eliminar vacíos)
 *  - Lecciones (crear, reordenar, editar título/tipo/duración/URLs, conservar ID)
 *  - Quiz (preguntas, umbral de aprobación, respuestas correctas)
 *  - Recursos adjuntos
 *
 * El slug es inmutable al editar (preserva SEO e historial).
 * El `id` de cada lección se conserva estrictamente al editar (estabilidad de progreso).
 */
import { useState, useTransition, useCallback } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Save,
  Send,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import {
  cmsSaveCourse,
  cmsAddModule,
  cmsUpdateModule,
  cmsDeleteModule,
  cmsAddLesson,
  cmsUpdateLesson,
  cmsDeleteLesson,
  cmsSaveQuiz,
} from '@/lib/courses/actions';
import type {
  Course,
  CourseModule,
  CourseLesson,
  Quiz,
  QuizQuestion,
  CourseResource,
  LessonType,
  CourseType,
  CourseStatus,
  CourseVisibility,
  CourseCTA,
} from '@/lib/courses/types';

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const INPUT =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-brand-400 dark:focus:ring-brand-900';

const TEXTAREA =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-brand-400 dark:focus:ring-brand-900 font-mono text-[13px] leading-relaxed';

const TYPES: { value: CourseType; label: string }[] = [
  { value: 'free', label: 'Gratuito' },
  { value: 'paid', label: 'De pago' },
  { value: 'upcoming', label: 'Próximamente' },
];

const STATUSES: { value: CourseStatus; label: string }[] = [
  { value: 'published', label: 'Publicado' },
  { value: 'in-development', label: 'En desarrollo' },
  { value: 'draft', label: 'Borrador' },
  { value: 'archived', label: 'Archivado' },
];

const VISIBILITIES: { value: CourseVisibility; label: string }[] = [
  { value: 'public', label: 'Público' },
  { value: 'private', label: 'Privado' },
];

const CTAS: { value: CourseCTA; label: string }[] = [
  { value: 'ver-curso', label: 'Ver curso' },
  { value: 'proximamente', label: 'Próximamente' },
  { value: 'inscribirme', label: 'Inscribirme' },
  { value: 'lista-espera', label: 'Lista de espera' },
];

const LESSON_TYPES: { value: LessonType; label: string }[] = [
  { value: 'video', label: 'Video' },
  { value: 'pdf', label: 'PDF' },
  { value: 'texto', label: 'Texto' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'link', label: 'Enlace' },
];

type Tab = 'metadata' | 'modules' | 'quiz' | 'resources';

/* -------------------------------------------------------------------------- */
/* Componente principal                                                         */
/* -------------------------------------------------------------------------- */

export default function SyllabusBuilder({ initial }: { initial: Course }) {
  const [course, setCourse] = useState<Course>(JSON.parse(JSON.stringify(initial)));
  const [tab, setTab] = useState<Tab>('metadata');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [expandedModule, setExpandedModule] = useState<number | null>(0);

  const update = useCallback((fn: (c: Course) => void) => {
    setCourse((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as Course;
      fn(next);
      return next;
    });
  }, []);

  const submit = (publish: boolean) => {
    setMessage(null);
    setErrors([]);
    setSaved(false);
    startTransition(async () => {
      const toSave = publish ? { ...course, status: 'published' as CourseStatus } : course;
      const res = await cmsSaveCourse({ slug: course.slug, course: toSave });
      if (res.ok) {
        setSaved(true);
        setMessage(
          publish
            ? 'Curso publicado. La web se actualizó.'
            : 'Borrador guardado.'
        );
        if (publish) setCourse((c) => ({ ...c, status: 'published' }));
      } else {
        setMessage(res.error ?? 'No se pudo guardar.');
        setErrors(res.issues?.filter((i) => i.severity === 'error').map((i) => i.message) ?? []);
      }
    });
  };

  /* -------- Módulos -------- */

  const addModule = () => {
    update((c) => {
      c.modules.push({ title: `Módulo ${c.modules.length + 1}`, lessons: [] });
    });
    setExpandedModule(course.modules.length);
  };

  const updateModule = (idx: number, patch: Partial<CourseModule>) => {
    update((c) => {
      Object.assign(c.modules[idx], patch);
    });
  };

  const deleteModule = (idx: number) => {
    const mod = course.modules[idx];
    if ((mod.lessons ?? []).length > 0) {
      setMessage('No se puede eliminar un módulo con lecciones. Elimine las lecciones primero.');
      return;
    }
    update((c) => { c.modules.splice(idx, 1); });
    if (expandedModule === idx) setExpandedModule(null);
    else if (expandedModule !== null && expandedModule > idx) setExpandedModule(expandedModule - 1);
  };

  const moveModule = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= course.modules.length) return;
    update((c) => {
      const temp = c.modules[idx];
      c.modules[idx] = c.modules[target];
      c.modules[target] = temp;
    });
    setExpandedModule(target);
  };

  /* -------- Lecciones -------- */

  const addLesson = (modIdx: number) => {
    update((c) => {
      const mod = c.modules[modIdx];
      if (!mod.lessons) mod.lessons = [];
      const prefix = `m${modIdx + 1}`;
      const existing = mod.lessons
        .filter((l) => l.id.startsWith(prefix))
        .map((l) => {
          const m = l.id.match(/-l(\d+)$/);
          return m ? Number(m[1]) : 0;
        });
      const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
      mod.lessons.push({
        id: `${prefix}-l${nextNum}`,
        title: 'Nueva lección',
        type: 'texto',
      });
    });
  };

  const updateLesson = (modIdx: number, lesIdx: number, patch: Partial<CourseLesson>) => {
    update((c) => {
      const lesson = c.modules[modIdx].lessons![lesIdx];
      // NUNCA cambiar el ID
      Object.assign(lesson, patch, { id: lesson.id });
    });
  };

  const deleteLesson = (modIdx: number, lesIdx: number) => {
    update((c) => { c.modules[modIdx].lessons!.splice(lesIdx, 1); });
  };

  const moveLesson = (modIdx: number, lesIdx: number, dir: -1 | 1) => {
    const target = lesIdx + dir;
    const lessons = course.modules[modIdx].lessons ?? [];
    if (target < 0 || target >= lessons.length) return;
    update((c) => {
      const temp = c.modules[modIdx].lessons![lesIdx];
      c.modules[modIdx].lessons![lesIdx] = c.modules[modIdx].lessons![target];
      c.modules[modIdx].lessons![target] = temp;
    });
  };

  /* -------- Quiz -------- */

  const quiz = course.quiz ?? { questions: [] as QuizQuestion[] };

  const setQuiz = (fn: (q: Quiz) => void) => {
    update((c) => {
      if (!c.quiz) c.quiz = { questions: [] };
      fn(c.quiz);
    });
  };

  const addQuestion = () => {
    setQuiz((q) => {
      q.questions.push({ type: 'radio', label: '', options: [''], required: true });
    });
  };

  const updateQuestion = (idx: number, patch: Partial<QuizQuestion>) => {
    setQuiz((q) => { Object.assign(q.questions[idx], patch); });
  };

  const deleteQuestion = (idx: number) => {
    setQuiz((q) => { q.questions.splice(idx, 1); });
  };

  const addOption = (qIdx: number) => {
    setQuiz((q) => { q.questions[qIdx].options?.push(''); });
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuiz((q) => { (q.questions[qIdx].options ?? [])[oIdx] = value; });
  };

  const deleteOption = (qIdx: number, oIdx: number) => {
    setQuiz((q) => { q.questions[qIdx].options?.splice(oIdx, 1); });
  };

  const totalLessons = course.modules.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Mensajes */}
      {message ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            errors.length > 0
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
              : saved
                ? 'border-leaf-200 bg-leaf-50 text-leaf-700 dark:border-leaf-800 dark:bg-leaf-950 dark:text-leaf-300'
                : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          {message}
        </div>
      ) : null}

      {errors.length > 0 ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <p className="flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-300">
            <TriangleAlert className="h-4 w-4" aria-hidden="true" /> Errores de validación
          </p>
          <ul className="mt-2 space-y-1">
            {errors.map((e, i) => (
              <li key={i} className="text-xs text-red-600 dark:text-red-400">{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
        {([
          { key: 'metadata' as Tab, label: 'Metadatos' },
          { key: 'modules' as Tab, label: `Módulos (${course.modules.length})` },
          { key: 'quiz' as Tab, label: `Quiz (${quiz.questions.length})` },
          { key: 'resources' as Tab, label: `Recursos (${course.resources.length})` },
        ]).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              tab === t.key
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Metadatos */}
      {tab === 'metadata' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Metadatos del curso</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Título" required span="full">
              <input className={INPUT} value={course.title} onChange={(e) => update((c) => { c.title = e.target.value; })} />
            </Field>
            <Field label="Subtítulo" span="full">
              <input className={INPUT} value={course.subtitle} onChange={(e) => update((c) => { c.subtitle = e.target.value; })} />
            </Field>
            <Field label="Descripción" span="full">
              <textarea rows={3} className={INPUT} value={course.description} onChange={(e) => update((c) => { c.description = e.target.value; })} />
            </Field>
            <Field label="Categoría">
              <input className={INPUT} value={course.category} onChange={(e) => update((c) => { c.category = e.target.value; })} />
            </Field>
            <Field label="Autor">
              <input className={INPUT} value={course.author ?? ''} onChange={(e) => update((c) => { c.author = e.target.value || undefined; })} />
            </Field>
            <Field label="Tags (separados por coma)">
              <input className={INPUT} value={(course.tags ?? []).join(', ')} onChange={(e) => update((c) => { c.tags = e.target.value.split(',').map((s) => s.trim()).filter(Boolean); })} />
            </Field>
            <Field label="Tipo">
              <select className={INPUT} value={course.type} onChange={(e) => update((c) => { c.type = e.target.value as CourseType; })}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Estado">
              <select className={INPUT} value={course.status} onChange={(e) => update((c) => { c.status = e.target.value as CourseStatus; })}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Visibilidad">
              <select className={INPUT} value={course.visibility} onChange={(e) => update((c) => { c.visibility = e.target.value as CourseVisibility; })}>
                {VISIBILITIES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </Field>
            <Field label="CTA">
              <select className={INPUT} value={course.cta} onChange={(e) => update((c) => { c.cta = e.target.value as CourseCTA; })}>
                {CTAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="URL externa">
              <input className={INPUT} value={course.externalUrl ?? ''} onChange={(e) => update((c) => { c.externalUrl = e.target.value || undefined; })} />
            </Field>
            <Field label="Duración">
              <input className={INPUT} value={course.duration ?? ''} onChange={(e) => update((c) => { c.duration = e.target.value || undefined; })} />
            </Field>
            <Field label="Nivel">
              <input className={INPUT} value={course.level ?? ''} onChange={(e) => update((c) => { c.level = e.target.value || undefined; })} />
            </Field>
            <Field label="Dificultad">
              <input className={INPUT} value={course.difficulty ?? ''} onChange={(e) => update((c) => { c.difficulty = e.target.value || undefined; })} />
            </Field>
            <Field label="Precio (USD)">
              <input type="number" className={INPUT} value={course.price ?? ''} onChange={(e) => update((c) => { c.price = e.target.value ? Number(e.target.value) : undefined; })} />
            </Field>
            <Field label="Moneda">
              <input className={INPUT} value={course.currency} onChange={(e) => update((c) => { c.currency = e.target.value; })} />
            </Field>
            <div className="flex items-center gap-6 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={course.featured} onChange={(e) => update((c) => { c.featured = e.target.checked; })} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
                Destacado
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={course.hasQuiz} onChange={(e) => update((c) => { c.hasQuiz = e.target.checked; })} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
                Con quiz
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={course.hasCertificate} onChange={(e) => update((c) => { c.hasCertificate = e.target.checked; })} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
                Con certificado
              </label>
            </div>
          </div>
          {/* Objetivos / Learning */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Objetivos (uno por línea)" span="full">
              <textarea rows={4} className={TEXTAREA} value={(course.objectives ?? []).join('\n')} onChange={(e) => update((c) => { c.objectives = e.target.value.split('\n').filter(Boolean); })} />
            </Field>
            <Field label="Qué aprenderás (uno por línea)" span="full">
              <textarea rows={4} className={TEXTAREA} value={(course.learning ?? []).join('\n')} onChange={(e) => update((c) => { c.learning = e.target.value.split('\n').filter(Boolean); })} />
            </Field>
          </div>
        </div>
      )}

      {/* TAB: Módulos */}
      {tab === 'modules' && (
        <div className="space-y-4">
          {course.modules.map((mod, mi) => (
            <div key={mi} className="rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
              {/* Header del módulo */}
              <div
                className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-5 py-3 dark:border-slate-800"
                onClick={() => setExpandedModule(expandedModule === mi ? null : mi)}
              >
                <GripVertical className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <span className="flex-1">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Módulo {mi + 1}: {mod.title || '(sin título)'}
                  </span>
                  <span className="ml-2 text-xs text-slate-400">
                    {(mod.lessons ?? []).length} lecciones
                  </span>
                </span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={(e) => { e.stopPropagation(); moveModule(mi, -1); }} disabled={mi === 0} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); moveModule(mi, 1); }} disabled={mi === course.modules.length - 1} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); deleteModule(mi); }} className="rounded p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-950">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Contenido expandido */}
              {expandedModule === mi && (
                <div className="p-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Título del módulo">
                      <input className={INPUT} value={mod.title} onChange={(e) => updateModule(mi, { title: e.target.value })} />
                    </Field>
                    <Field label="Descripción">
                      <input className={INPUT} value={mod.description ?? ''} onChange={(e) => updateModule(mi, { description: e.target.value || undefined })} />
                    </Field>
                  </div>

                  {/* Lecciones */}
                  <div className="mt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Lecciones</h4>
                    <div className="mt-2 space-y-2">
                      {(mod.lessons ?? []).map((lesson, li) => (
                        <LessonRow
                          key={lesson.id}
                          lesson={lesson}
                          index={li}
                          moduleIndex={mi}
                          totalInModule={(mod.lessons ?? []).length}
                          onUpdate={(patch) => updateLesson(mi, li, patch)}
                          onDelete={() => deleteLesson(mi, li)}
                          onMove={(dir) => moveLesson(mi, li, dir)}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => addLesson(mi)}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400"
                    >
                      <Plus className="h-3.5 w-3.5" /> Agregar lección
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addModule}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400"
          >
            <Plus className="h-4 w-4" /> Agregar módulo
          </button>
        </div>
      )}

      {/* TAB: Quiz */}
      {tab === 'quiz' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Cuestionario</h3>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                Umbral de aprobación:
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={`${INPUT} w-20`}
                  value={quiz.passThreshold ?? ''}
                  onChange={(e) => setQuiz((q) => { q.passThreshold = e.target.value ? Number(e.target.value) : undefined; })}
                />
                <span className="text-xs text-slate-400">%</span>
              </label>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {quiz.questions.map((q, qi) => (
              <div key={qi} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px]">
                      <input
                        className={INPUT}
                        placeholder="Enunciado de la pregunta…"
                        value={q.label}
                        onChange={(e) => updateQuestion(qi, { label: e.target.value })}
                      />
                      <select
                        className={INPUT}
                        value={q.type}
                        onChange={(e) => updateQuestion(qi, { type: e.target.value as QuizQuestion['type'] })}
                      >
                        {LESSON_TYPES.map((lt) => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
                      </select>
                    </div>

                    {/* Opciones (para radio/checkbox/select) */}
                    {(q.type === 'radio' || q.type === 'checkbox' || q.type === 'select') && (
                      <div className="space-y-2">
                        {(q.options ?? []).map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input
                              type={q.type === 'checkbox' ? 'checkbox' : 'radio'}
                              name={`correct-${qi}`}
                              checked={
                                q.type === 'checkbox'
                                  ? Array.isArray(q.correct) && q.correct.includes(opt)
                                  : q.correct === opt
                              }
                              onChange={() => {
                                if (q.type === 'checkbox') {
                                  const current = Array.isArray(q.correct) ? [...q.correct] : [];
                                  const idx = current.indexOf(opt);
                                  if (idx >= 0) current.splice(idx, 1);
                                  else current.push(opt);
                                  updateQuestion(qi, { correct: current.length ? current : undefined });
                                } else {
                                  updateQuestion(qi, { correct: opt });
                                }
                              }}
                              className="h-4 w-4 text-brand-600"
                              title="Marcar como respuesta correcta"
                            />
                            <input
                              className={`${INPUT} flex-1`}
                              value={opt}
                              onChange={(e) => updateOption(qi, oi, e.target.value)}
                              placeholder={`Opción ${oi + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => deleteOption(qi, oi)}
                              className="rounded p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addOption(qi)}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                        >
                          + Agregar opción
                        </button>
                      </div>
                    )}

                    {/* Escala */}
                    {q.type === 'escala' && (
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-slate-500">Min:</label>
                        <input type="number" className={`${INPUT} w-16`} value={q.scale?.min ?? 1} onChange={(e) => updateQuestion(qi, { scale: { min: Number(e.target.value), max: q.scale?.max ?? 5 } })} />
                        <label className="text-xs text-slate-500">Max:</label>
                        <input type="number" className={`${INPUT} w-16`} value={q.scale?.max ?? 5} onChange={(e) => updateQuestion(qi, { scale: { min: q.scale?.min ?? 1, max: Number(e.target.value) } })} />
                        <label className="text-xs text-slate-500">Correcto (número):</label>
                        <input type="number" className={`${INPUT} w-16`} value={typeof q.correct === 'number' ? q.correct : ''} onChange={(e) => updateQuestion(qi, { correct: e.target.value ? Number(e.target.value) : undefined })} />
                      </div>
                    )}

                    {/* Textarea / texto */}
                    {(q.type === 'textarea' || q.type === 'texto') && (
                      <input
                        className={INPUT}
                        placeholder="Respuesta correcta (opcional)…"
                        value={typeof q.correct === 'string' ? q.correct : ''}
                        onChange={(e) => updateQuestion(qi, { correct: e.target.value || undefined })}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteQuestion(qi)}
                    className="rounded p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400"
          >
            <Plus className="h-4 w-4" /> Agregar pregunta
          </button>
        </div>
      )}

      {/* TAB: Recursos */}
      {tab === 'resources' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recursos del curso</h3>
          <div className="mt-4 space-y-3">
            {course.resources.map((r, ri) => (
              <div key={ri} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex-1 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_100px_1fr]">
                  <input className={INPUT} placeholder="Título" value={r.title} onChange={(e) => update((c) => { c.resources[ri].title = e.target.value; })} />
                  <select className={INPUT} value={r.type} onChange={(e) => update((c) => { c.resources[ri].type = e.target.value as CourseResource['type']; })}>
                    {['pdf', 'ebook', 'audio', 'meditacion', 'checklist', 'plantilla', 'archivo', 'link', 'video'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <input className={INPUT} placeholder="URL" value={r.url} onChange={(e) => update((c) => { c.resources[ri].url = e.target.value; })} />
                </div>
                <button type="button" onClick={() => update((c) => { c.resources.splice(ri, 1); })} className="rounded p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-950">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => update((c) => { c.resources.push({ title: '', type: 'link', url: '' }); })}
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400"
            >
              <Plus className="h-4 w-4" /> Agregar recurso
            </button>
          </div>
        </div>
      )}

      {/* Barra de acciones */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <span className="text-xs text-slate-400">
          {course.modules.length} módulos · {totalLessons} lecciones · {quiz.questions.length} preguntas
        </span>
        <div className="flex-1" />
        <button
          type="button"
          disabled={isPending}
          onClick={() => submit(false)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-400"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar borrador
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => submit(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-leaf-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-leaf-700 disabled:opacity-50 dark:bg-leaf-500 dark:hover:bg-leaf-400"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Guardar y publicar
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-componentes                                                              */
/* -------------------------------------------------------------------------- */

function Field({
  label,
  required,
  span,
  children,
}: {
  label: string;
  required?: boolean;
  span?: 'full';
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${span === 'full' ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1.5 flex items-baseline gap-1 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function LessonRow({
  lesson,
  index,
  moduleIndex,
  totalInModule,
  onUpdate,
  onDelete,
  onMove,
}: {
  lesson: CourseLesson;
  index: number;
  moduleIndex: number;
  totalInModule: number;
  onUpdate: (patch: Partial<CourseLesson>) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/60">
      <GripVertical className="mt-2 h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
      <div className="flex-1 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_90px_80px]">
        <input
          className={INPUT}
          value={lesson.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Título de la lección"
        />
        <select
          className={INPUT}
          value={lesson.type}
          onChange={(e) => {
            const type = e.target.value as LessonType;
            const patch: Partial<CourseLesson> = { type };
            // Limpiar URLs que no corresponden al tipo
            if (type !== 'video') patch.videoUrl = undefined;
            if (type !== 'pdf' && type !== 'link') patch.resourceUrl = undefined;
            onUpdate(patch);
          }}
        >
          {LESSON_TYPES.map((lt) => (
            <option key={lt.value} value={lt.value}>{lt.label}</option>
          ))}
        </select>
        <input
          className={INPUT}
          value={lesson.duration ?? ''}
          onChange={(e) => onUpdate({ duration: e.target.value || undefined })}
          placeholder="MM:SS"
        />
      </div>
      {lesson.type === 'video' && (
        <input
          className={`${INPUT} mt-0 w-full sm:w-auto sm:flex-1`}
          value={lesson.videoUrl ?? ''}
          onChange={(e) => onUpdate({ videoUrl: e.target.value || undefined })}
          placeholder="URL del video"
        />
      )}
      {(lesson.type === 'pdf' || lesson.type === 'link') && (
        <input
          className={`${INPUT} mt-0 w-full sm:w-auto sm:flex-1`}
          value={lesson.resourceUrl ?? ''}
          onChange={(e) => onUpdate({ resourceUrl: e.target.value || undefined })}
          placeholder="URL del recurso"
        />
      )}
      <div className="flex items-center gap-0.5">
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="rounded p-1 text-slate-400 hover:bg-slate-200 disabled:opacity-30 dark:hover:bg-slate-700">
          <ArrowUp className="h-3 w-3" />
        </button>
        <button type="button" onClick={() => onMove(1)} disabled={index === totalInModule - 1} className="rounded p-1 text-slate-400 hover:bg-slate-200 disabled:opacity-30 dark:hover:bg-slate-700">
          <ArrowDown className="h-3 w-3" />
        </button>
        <button type="button" onClick={onDelete} className="rounded p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-950">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <code className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">{lesson.id}</code>
    </div>
  );
}
