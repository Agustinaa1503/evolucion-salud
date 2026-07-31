'use client';

import { useState } from 'react';
import { CheckCircle2, ExternalLink, Send } from 'lucide-react';
import { saveCourseQuiz } from '@/lib/supabase/inserts';
import type { Course, QuizQuestion } from '@/lib/courses/types';

type Answer = string | string[] | number | null;

/**
 * Formulario de cuestionario generado 100% desde el Markdown del curso
 * (sección «## Cuestionario» con bloque YAML). No hay HTML manual:
 * los tipos soportados son texto, radio, checkbox, select, textarea, escala y link.
 */
export default function CourseQuiz({ course }: { course: Course }) {
  const quiz = course.quiz;
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  if (!quiz || !quiz.questions.length) return null;

  const setAnswer = (label: string, value: Answer) =>
    setAnswers((prev) => ({ ...prev, [label]: value }));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    await saveCourseQuiz(course.slug, answers as Record<string, string | string[] | number | null>);
    setStatus('done');
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

      <button type="submit" disabled={status === 'loading'} className="btn-primary">
        <Send className="h-4 w-4" aria-hidden="true" />
        {quiz.ctaLabel ?? 'Enviar respuestas'}
      </button>
    </form>
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
  value: Answer;
  onChange: (v: Answer) => void;
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

  return (
    <fieldset className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card">
      <legend className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-leaf-600 text-sm font-bold text-white">
          {index + 1}
        </span>
        <span className="text-base font-extrabold text-slate-900">
          {question.label}
          {question.required ? <span className="text-brand-600"> *</span> : null}
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
