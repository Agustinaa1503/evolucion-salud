'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  CheckCircle2,
  ExternalLink,
  History,
  Lock,
  RotateCcw,
  Send,
  XCircle,
} from 'lucide-react';
import { saveCourseQuiz } from '@/lib/supabase/inserts';
import { getCourseProgress, getQuizAttempts, submitQuizAttempt, type QuizAttemptRow } from '@/lib/lms/actions';
import {
  isScoredQuiz,
  quizScorePct,
  type QuizAnswer,
  type QuizAttemptResult,
} from '@/lib/lms/quiz';
import { isScoredQuestion, scoredQuestions } from '@/lib/courses/types';
import type { Course, Quiz, QuizQuestion } from '@/lib/courses/types';

type Props = {
  course: Course;
};

/**
 * Cuestionario del curso generado 100% desde el Markdown.
 *
 * Dos modos:
 *  - De retroalimentación (sin `correct`): envía las respuestas a
 *    `curso_respuestas` y muestra el agradecimiento (comportamiento legado).
 *  - Con nota (al menos una pregunta con `correct` o `passThreshold`):
 *    la nota se calcula en el servidor, se guarda en `user_quiz_attempts`,
 *    se muestra el resultado con retroalimentación y se permiten reintentos.
 */
export default function CourseQuiz({ course }: Props) {
  const quiz = course.quiz;
  const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [attempts, setAttempts] = useState<QuizAttemptRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    void getCourseProgress(course.slug).then((data) => setAuthed(data.authed)).catch(() => undefined);
  }, [course.slug]);

  const scored = isScoredQuiz(quiz);

  useEffect(() => {
    if (scored && authed) {
      getQuizAttempts(course.slug).then(setAttempts).catch(() => undefined);
    }
  }, [scored, authed, course.slug]);

  if (!quiz || !quiz.questions.length) return null;

  const setAnswer = (label: string, value: QuizAnswer) =>
    setAnswers((prev) => ({ ...prev, [label]: value }));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (scored) {
      const missing = scoredQuestions(quiz as Quiz).filter((q) => {
        const v = answers[q.label];
        if (q.type === 'checkbox') return !Array.isArray(v) || v.length === 0;
        return v === undefined || v === null || v === '';
      });
      if (missing.length) {
        setError('Complete todas las preguntas de conceptos antes de enviar.');
        return;
      }
      setError(null);
      setStatus('loading');
      const res = await submitQuizAttempt(course.slug, answers);
      setStatus('idle');
      if (res.ok && res.result) {
        setResult(res.result);
        getQuizAttempts(course.slug).then(setAttempts).catch(() => undefined);
      } else {
        setError(res.error ?? 'No se pudo guardar la nota.');
      }
      return;
    }

    setStatus('loading');
    await saveCourseQuiz(course.slug, answers as Record<string, string | string[] | number | null>);
    setStatus('done');
  }

  if (scored && result) {
    return (
      <ScoredResult
        quiz={quiz}
        result={result}
        attempts={attempts}
        courseSlug={course.slug}
        onRetry={() => {
          setResult(null);
          setAnswers({});
          setError(null);
        }}
      />
    );
  }

  if (status === 'done') {
    return (
      <div className="rounded-3xl border border-leaf-200 bg-leaf-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-leaf-600" aria-hidden="true" />
        <h3 className="mt-4 text-xl font-extrabold text-leaf-900">¡Gracias por sus respuestas!</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-leaf-800">
          Sus respuestas nos ayudan a mejorar el contenido y a diseñar los próximos
          cursos. Este material es psicoeducativo y no reemplaza la consulta con
          un profesional de la salud.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {quiz.title || quiz.description ? (
        <div className="rounded-3xl border border-brand-200/70 bg-brand-50/60 p-6">
          {quiz.title ? <h3 className="text-lg font-extrabold text-slate-900">{quiz.title}</h3> : null}
          {quiz.description ? (
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{quiz.description}</p>
          ) : null}
          {scored ? (
            <p className="mt-2 text-xs font-semibold text-brand-700">
              Nota mínima para aprobar: {quiz.passThreshold ?? 60}%.
            </p>
          ) : null}
        </div>
      ) : null}

      {quiz.questions.map((question, i) => (
        <QuestionField
          key={`${i}-${question.label}`}
          question={question}
          index={i}
          value={answers[question.label]}
          onChange={(v) => setAnswer(question.label, v)}
        />
      ))}

      {error ? (
        <p className="rounded-xl bg-clay-50 px-4 py-3 text-sm font-semibold text-clay-800">{error}</p>
      ) : null}

      {scored && !authed ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-card">
          <Lock className="mx-auto h-8 w-8 text-brand-600" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            Inicie sesión para enviar el cuestionario y guardar su nota en el perfil.
          </p>
          <Link href={`/login?next=${encodeURIComponent(`/cursos/${course.slug}`)}`} className="btn-primary mt-4">
            Iniciar sesión
          </Link>
        </div>
      ) : (
        <button type="submit" disabled={status === 'loading'} className="btn-primary">
          <Send className="h-4 w-4" aria-hidden="true" />
          {status === 'loading' ? 'Enviando…' : (quiz.ctaLabel ?? 'Enviar respuestas')}
        </button>
      )}
    </form>
  );
}

function ScoredResult({
  quiz,
  result,
  attempts,
  courseSlug,
  onRetry,
}: {
  quiz: Quiz;
  result: QuizAttemptResult;
  attempts: QuizAttemptRow[];
  courseSlug: string;
  onRetry: () => void;
}) {
  const pct = quizScorePct(result);
  const lastAttempt = attempts[0];

  return (
    <div className="space-y-6">
      <div
        className={`rounded-3xl p-8 text-center ${
          result.passed ? 'border border-leaf-200 bg-leaf-50' : 'border border-clay-200 bg-clay-50'
        }`}
      >
        <Award
          className={`mx-auto h-12 w-12 ${result.passed ? 'text-leaf-600' : 'text-clay-600'}`}
          aria-hidden="true"
        />
        <h3 className="mt-4 text-xl font-extrabold text-slate-900">
          {result.passed ? '¡Cuestionario aprobado!' : 'Cuestionario no aprobado todavía'}
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Su nota: <span className="text-lg font-extrabold text-brand-700">{pct}%</span>{' '}
          ({result.score}/{result.maxScore}) · Mínimo para aprobar: {result.passThreshold}%
        </p>
        {!result.passed ? (
          <p className="mx-auto mt-2 max-w-md text-xs text-slate-500">
            Puede volver a intentarlo las veces que quiera. Revisar las respuestas correctas
            ayuda a fijar los conceptos.
          </p>
        ) : null}
        <div className="mt-4">
          <button type="button" onClick={onRetry} className="btn-outline">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Volver a intentar
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
          Revisión de respuestas
        </h4>
        {result.details.map((d) => (
          <div
            key={d.label}
            className={`flex items-start gap-3 rounded-2xl border p-4 ${
              d.correct ? 'border-leaf-200 bg-leaf-50' : 'border-clay-200 bg-clay-50'
            }`}
          >
            {d.correct ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-leaf-600" aria-hidden="true" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-clay-600" aria-hidden="true" />
            )}
            <p className="text-sm font-semibold text-slate-800">
              {d.label}
              <span className={`block text-xs font-medium ${d.correct ? 'text-leaf-700' : 'text-clay-700'}`}>
                {d.correct ? 'Respuesta correcta' : 'Respuesta incorrecta'}
              </span>
            </p>
          </div>
        ))}
      </div>

      {attempts.length > 1 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h4 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-slate-500">
            <History className="h-4 w-4" aria-hidden="true" /> Historial de intentos
          </h4>
          <ul className="mt-3 space-y-2">
            {attempts.map((a, i) => (
              <li key={a.id} className="flex items-center justify-between text-sm text-slate-600">
                <span>
                  Intento {attempts.length - i} ·{' '}
                  {new Date(a.submitted_at).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span className="font-bold text-slate-800">
                  {a.score}/{a.max_score}{' '}
                  {a.passed ? (
                    <span className="ml-1 rounded-full bg-leaf-100 px-2 py-0.5 text-xs font-bold text-leaf-700">
                      Aprobado
                    </span>
                  ) : (
                    <span className="ml-1 rounded-full bg-clay-100 px-2 py-0.5 text-xs font-bold text-clay-700">
                      No aprobado
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {lastAttempt ? (
            <p className="mt-3 text-xs text-slate-400">
              Último intento: {new Date(lastAttempt.submitted_at).toLocaleString('es-AR')}
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="text-xs text-slate-400">
        Su nota se guarda en su perfil y se registra la actividad del curso.{' '}
        <Link href={`/cursos/${courseSlug}`} className="font-semibold text-brand-600 hover:underline">
          Volver al curso
        </Link>
      </p>
    </div>
  );
}

function QuestionField({
  question,
  index,
  value,
  onChange,
}: {
  question: QuizQuestion;
  index: number;
  value: QuizAnswer;
  onChange: (v: QuizAnswer) => void;
}) {
  if (question.type === 'link') {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
        <a
          href={question.url ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          {question.urlLabel ?? question.label}
        </a>
      </div>
    );
  }

  const inputId = `quiz-q-${index}`;
  const scored = isScoredQuestion(question);

  return (
    <fieldset className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card">
      <legend className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-leaf-600 text-sm font-bold text-white">
          {index + 1}
        </span>
        <span className="text-base font-extrabold text-slate-900">
          {question.label}
          {question.required || scored ? <span className="text-brand-600"> *</span> : null}
        </span>
      </legend>

      <div className="mt-4 space-y-3">
        {question.type === 'texto' ? (
          <input
            type="text"
            id={inputId}
            className="input"
            placeholder={question.placeholder}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            required={question.required}
          />
        ) : null}

        {question.type === 'textarea' ? (
          <textarea
            id={inputId}
            className="input min-h-28"
            placeholder={question.placeholder}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            required={question.required}
          />
        ) : null}

        {question.type === 'radio' || question.type === 'select' ? (
          <>
            {question.type === 'select' ? (
              <select
                id={inputId}
                className="input"
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => onChange(e.target.value)}
                required={question.required}
              >
                <option value="">Seleccione una opción…</option>
                {question.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-2">
                {question.options?.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
                  >
                    <input
                      type="radio"
                      name={inputId}
                      value={option}
                      checked={value === option}
                      onChange={() => onChange(option)}
                      className="accent-brand-600"
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}
          </>
        ) : null}

        {question.type === 'checkbox' ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {question.options?.map((option) => {
              const checked = Array.isArray(value) && value.includes(option);
              return (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
                >
                  <input
                    type="checkbox"
                    value={option}
                    checked={checked}
                    onChange={(e) => {
                      const current = Array.isArray(value) ? (value as string[]) : [];
                      onChange(
                        e.target.checked
                          ? [...current, option]
                          : current.filter((o) => o !== option)
                      );
                    }}
                    className="accent-brand-600"
                  />
                  {option}
                </label>
              );
            })}
          </div>
        ) : null}

        {question.type === 'escala' && question.scale ? (
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>{question.scale.minLabel ?? `${question.scale.min}`}</span>
              <span>{question.scale.maxLabel ?? `${question.scale.max}`}</span>
            </div>
            <input
              id={inputId}
              type="range"
              min={question.scale.min}
              max={question.scale.max}
              value={typeof value === 'number' ? value : question.scale.min}
              onChange={(e) => onChange(Number(e.target.value))}
              className="mt-2 w-full accent-brand-600"
            />
            <p className="mt-1 text-center text-sm font-bold text-brand-700">
              {typeof value === 'number' ? value : question.scale.min}
            </p>
          </div>
        ) : null}
      </div>
    </fieldset>
  );
}
