/**
 * Lógica pura de cuestionarios con nota (FASE 6).
 *
 * No toca la base de datos: computa la nota y la condición de aprobación
 * para poder probarla con Vitest sin Supabase. La puntuación se calcula
 * también en el servidor (server action) para que la nota sea confiable.
 */
import {
  isScoredQuiz,
  scoredQuestions,
  type Quiz,
  type QuizQuestion,
} from '@/lib/courses/types';

export type QuizAnswer = string | string[] | number | null;

export type QuizAttemptResult = {
  score: number;
  maxScore: number;
  passed: boolean;
  passThreshold: number;
  /** Resultado por pregunta puntuable (para la retroalimentación). */
  details: { label: string; correct: boolean }[];
};

/** Normaliza para comparar sin importar mayúsculas, tildes ni espacios. */
const norm = (v: unknown): string =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

/** Compara dos conjuntos de opciones sin importar el orden. */
const sameSet = (a: string[], b: string[]): boolean => {
  const serialize = (list: string[]) => [...list].map(norm).sort().join('|');
  return serialize(a) === serialize(b);
};

export { isScoredQuiz, scoredQuestions };

/** Devuelve true si la respuesta coincide con la correcta de la pregunta. */
export function isAnswerCorrect(
  question: QuizQuestion,
  answer: QuizAnswer
): boolean {
  const correct = question.correct;
  if (correct === undefined || correct === null) return true;

  if (question.type === 'checkbox') {
    const answerList = Array.isArray(answer)
      ? answer.map(String)
      : answer !== null && answer !== undefined
        ? [String(answer)]
        : [];
    const correctList = Array.isArray(correct) ? correct.map(String) : [String(correct)];
    return sameSet(answerList, correctList);
  }

  const answerNormalized = Array.isArray(answer)
    ? answer.map(norm).sort().join('|')
    : norm(answer);
  const correctNormalized = Array.isArray(correct)
    ? correct.map(norm).sort().join('|')
    : norm(correct);
  return answerNormalized === correctNormalized;
}

/**
 * Calcula la nota de un cuestionario.
 * - 1 punto por cada pregunta puntuable respondida correctamente.
 * - Se aprueba cuando `score * 100 >= passThreshold * maxScore`
 *   (aritmética entera para evitar errores de coma flotante).
 */
export function scoreQuiz(
  quiz: Quiz,
  answers: Record<string, QuizAnswer>
): QuizAttemptResult {
  const scored = scoredQuestions(quiz);
  const maxScore = scored.length;
  let score = 0;
  const details = scored.map((q) => {
    const correct = isAnswerCorrect(q, answers[q.label] ?? null);
    if (correct) score += 1;
    return { label: q.label, correct };
  });
  const passThreshold = quiz.passThreshold ?? 60;
  const passed = maxScore === 0 ? true : score * 100 >= passThreshold * maxScore;
  return { score, maxScore, passed, passThreshold, details };
}

/** Devuelve la nota como porcentaje redondeado (0-100). */
export function quizScorePct(result: Pick<QuizAttemptResult, 'score' | 'maxScore'>): number {
  if (result.maxScore <= 0) return 0;
  return Math.min(100, Math.round((result.score / result.maxScore) * 100));
}
