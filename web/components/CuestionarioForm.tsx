'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  Lock,
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import {
  questionnaire,
  type QuestionBlock,
  type QuestionnaireResult,
} from '@/lib/data/questionnaire';
import { saveQuestionnaire, participantSlug } from '@/lib/supabase/inserts';
import { site } from '@/lib/data/site';

type AnswerValue = number | string;

const scaleNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function blockIsComplete(block: QuestionBlock, answers: Record<string, AnswerValue>) {
  return block.questions.every((q) => answers[q.id] !== undefined);
}

function scaleColor(value: number): string {
  if (value <= 3) return 'bg-leaf-500';
  if (value <= 6) return 'bg-amber-500';
  return 'bg-rose-500';
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-bold text-slate-900">
          {value.toFixed(1)} / {max}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${scaleColor(Math.round(value))} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function CuestionarioForm() {
  const blocks = questionnaire.blocks;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [result, setResult] = useState<QuestionnaireResult | null>(null);

  const isLastStep = step === blocks.length - 1;
  const currentBlock = blocks[step];
  const currentComplete = blockIsComplete(currentBlock, answers);

  const setAnswer = (id: string, value: AnswerValue) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  function next() {
    if (!currentComplete) return;
    if (isLastStep) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  }

  async function finish() {
    const percepcion = blocks
      .find((b) => b.id === 'percepcion')!
      .questions.map((q) => Number(answers[q.id]));
    const corporal = blocks
      .find((b) => b.id === 'corporal')!
      .questions.map((q) => Number(answers[q.id]));
    const ambioma = blocks
      .find((b) => b.id === 'ambioma')!
      .questions.map((q) => String(answers[q.id]));

    const percepcionAvg = percepcion.reduce((a, b) => a + b, 0) / percepcion.length;
    const corporalAvg = corporal.reduce((a, b) => a + b, 0) / corporal.length;
    const ambiomaScore = ambioma.reduce(
      (acc, value) => acc + (value === 'Sí' ? 2 : value === 'Parcialmente' ? 1 : 0),
      0
    );

    const saved = await saveQuestionnaire({
      participantType: participantSlug(String(answers['participante'] ?? '')),
      answers,
      percepcionAvg,
      corporalAvg,
      ambiomaScore,
    });

    setResult({
      percepcionAvg,
      corporalAvg,
      ambiomaScore,
      accessCode: saved.accessCode ?? 'PINE-0000-0000',
    });
  }

  function restart() {
    setAnswers({});
    setStep(0);
    setResult(null);
  }

  const recomendaciones = useMemo(() => {
    if (!result) return [];
    const items: string[] = [];
    if (result.percepcionAvg >= 6) {
      items.push(
        'Tu percepción de novedad, impredecibilidad, descontrol o amenaza está alta: tu sistema de alerta está encendido y es esperable. Antes de planificar, necesitás regular la emoción: la respiración vagal y la Guía Básica son el punto de partida ideal.'
      );
    }
    if (result.corporalAvg >= 6) {
      items.push(
        'Tu cuerpo está acumulando carga alostática: sueño, tensión, digestión o emociones están avisando. Las meditaciones guiadas y la higiene de sueño te van a ayudar a descargar esa activación.'
      );
    }
    if (result.ambiomaScore <= 2) {
      items.push(
        'Tu red de contención necesita refuerzo: organizar el ambioma (quién te acompaña, qué límites pones) es tan importante como tu propia regulación. El Cuaderno de Ruta Quirúrgico te da las plantillas.'
      );
    }
    if (result.ambiomaScore >= 4) {
      items.push(
        'Tu ambioma es un factor protector: aprovechalo. Compartí tu Mapa PINE con tu red de apoyo para que sepan cómo acompañarte mejor.'
      );
    }
    if (items.length === 0) {
      items.push(
        'Tu registro muestra señales moderadas de activación. Sostener hábitos de sueño, respiración y movimiento es la mejor inversión para tu proceso.'
      );
    }
    return items;
  }, [result]);

  if (result) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <ClipboardCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Tu Mapa PINE</h3>
            <p className="text-sm text-slate-500">
              Este registro es personal e intransferible.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <ScoreBar label="Percepción del desafío" value={result.percepcionAvg} max={10} />
          <ScoreBar label="Activación corporal" value={result.corporalAvg} max={10} />
          <ScoreBar label="Ambioma y sostén" value={result.ambiomaScore} max={6} />
        </div>

        <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-5">
          <h4 className="text-sm font-bold uppercase tracking-wide text-brand-800">
            Qué te está diciendo tu cuerpo
          </h4>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700">
            {recomendaciones.map((r) => (
              <li key={r} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                {r}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-600">
            Recuerda: la mente se transforma en materia. Este registro de tu
            estado actual es el primer paso saludable de tu proceso. La
            lectura de tu guía comienza por las áreas que más te movilizan.
          </p>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
          <div>
            <p className="font-semibold text-slate-800">
              Tu código de acceso personal: <span className="font-mono font-bold text-brand-700">{result.accessCode}</span>
            </p>
            <p className="mt-1 text-slate-600">
              Este código se guardó en la plataforma ligado a tus respuestas.
              Si alguien lo reenvía, el sistema detecta que no coincide con su
              propio cuestionario y bloquea el segundo uso: cada persona hace
              su propio proceso.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/tienda/guia-basica-dia-despues-del-diagnostico" className="btn-primary flex-1">
            Conocé la Guía Básica (USD 19)
          </Link>
          <Link href="/tienda/guia-premium-completa" className="btn-secondary flex-1">
            Ver Guía Premium
          </Link>
        </div>
        <button
          type="button"
          onClick={restart}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          Volver a responder (otra persona de la familia)
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      {/* Progreso */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>
            Sección {step + 1} de {blocks.length}
          </span>
          <span>{Math.round(((step + 1) / blocks.length) * 100)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-500"
            style={{ width: `${((step + 1) / blocks.length) * 100}%` }}
          />
        </div>
      </div>

      <div key={currentBlock.id}>
        <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
          {currentBlock.title}
        </h3>
        <p className="mt-1 text-sm text-slate-500">{currentBlock.description}</p>

        <div className="mt-6 space-y-6">
          {currentBlock.questions.map((q) => {
            const selected = answers[q.id];
            return (
              <fieldset key={q.id}>
                <legend className="text-sm font-medium leading-relaxed text-slate-700">
                  <span className="mr-1" aria-hidden="true">{q.emoji}</span>
                  {q.text}
                </legend>

                {currentBlock.kind === 'scale' ? (
                  <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup">
                    {scaleNumbers.map((n) => {
                      const active = selected === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setAnswer(q.id, n)}
                          className={`h-9 w-9 rounded-lg text-sm font-semibold transition sm:h-10 sm:w-10 ${
                            active
                              ? 'bg-brand-600 text-white shadow'
                              : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50'
                          }`}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2" role="radiogroup">
                    {(currentBlock.options ?? []).map((opt) => {
                      const active = selected === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setAnswer(q.id, opt)}
                          className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                            active
                              ? 'border-brand-600 bg-brand-600 text-white shadow'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </fieldset>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="btn-outline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Atrás
        </button>
        <button
          type="button"
          onClick={next}
          disabled={!currentComplete}
          className="btn-primary"
        >
          {isLastStep ? 'Ver mi Mapa PINE' : 'Siguiente'}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {!currentComplete ? (
        <p className="mt-3 text-right text-xs text-slate-500">
          Respondé todas las preguntas de esta sección para continuar.
        </p>
      ) : null}

      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
        {site.disclaimer}
      </p>
    </div>
  );
}
