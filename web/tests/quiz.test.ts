import { describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseCourseFile } from '../lib/courses/parser';
import { isScoredQuiz, isScoredQuestion } from '../lib/courses/types';
import {
  isAnswerCorrect,
  quizScorePct,
  scoreQuiz,
  type QuizAnswer,
} from '../lib/lms/quiz';
import type { Quiz, QuizQuestion } from '../lib/courses/types';

function parse(md: string) {
  const file = path.join(os.tmpdir(), `quiz-test-${Date.now()}-${Math.random().toString(36).slice(2)}.md`);
  fs.writeFileSync(file, md, 'utf8');
  try {
    return parseCourseFile(file);
  } finally {
    fs.rmSync(file, { force: true });
  }
}

const COURSE_WITH_SCORED_QUIZ = `---
id: quiz-test
title: Curso con cuestionario
description: Descripción
type: free
status: published
hasQuiz: true
---

## Acerca de este curso

Texto.

## Cuestionario

\`\`\`yaml
title: Comprobación
passThreshold: 70
questions:
  - type: radio
    label: ¿Qué estudia la PINE?
    options:
      - Los sistemas nervioso, inmunitario y endocrino
      - Solo el corazón
    correct: Los sistemas nervioso, inmunitario y endocrino
  - type: checkbox
    label: ¿Qué hormonas participan del estrés?
    options:
      - Cortisol
      - Melatonina
      - Serotonina
    correct:
      - Cortisol
      - Serotonina
  - type: escala
    label: ¿Cuántas horas duerme habitualmente?
    scale:
      min: 1
      max: 10
    correct: 8
  - type: textarea
    label: ¿Algo más para comentar?
\`\`\`
`;

describe('parser FASE 6 (correct + passThreshold)', () => {
  it('parsea `correct` (string, lista y número) y `passThreshold`', () => {
    const course = parse(COURSE_WITH_SCORED_QUIZ);
    expect(course.quiz).toBeDefined();
    const quiz = course.quiz as Quiz;
    expect(quiz.passThreshold).toBe(70);
    expect(quiz.questions[0].correct).toBe('Los sistemas nervioso, inmunitario y endocrino');
    expect(quiz.questions[1].correct).toEqual(['Cortisol', 'Serotonina']);
    expect(quiz.questions[2].correct).toBe(8);
    expect(quiz.questions[3].correct).toBeUndefined();
  });

  it('marca el cuestionario como puntuado cuando hay `correct`', () => {
    const course = parse(COURSE_WITH_SCORED_QUIZ);
    expect(isScoredQuiz(course.quiz)).toBe(true);
    expect(isScoredQuestion(course.quiz?.questions[0] as QuizQuestion)).toBe(true);
    expect(isScoredQuestion(course.quiz?.questions[3] as QuizQuestion)).toBe(false);
  });

  it('un cuestionario solo de retroalimentación no es puntuado', () => {
    const md = COURSE_WITH_SCORED_QUIZ.replace('passThreshold: 70\n', '').replace(/    correct: .*\n/g, '').replace(/    correct:\n      - Cortisol\n      - Serotonina\n/g, '');
    const course = parse(md);
    expect(isScoredQuiz(course.quiz)).toBe(false);
  });
});

describe('scoring FASE 6 (scoreQuiz)', () => {
  const quiz: Quiz = {
    passThreshold: 70,
    questions: [
      {
        type: 'radio',
        label: 'q1',
        options: ['A', 'B'],
        correct: 'A',
      },
      {
        type: 'checkbox',
        label: 'q2',
        options: ['X', 'Y', 'Z'],
        correct: ['X', 'Z'],
      },
      {
        type: 'escala',
        label: 'q3',
        scale: { min: 1, max: 5 },
        correct: 4,
      },
      { type: 'textarea', label: 'q4' },
    ],
  };

  it('otorga 1 punto por respuesta correcta (solo preguntas puntuables)', () => {
    const answers: Record<string, QuizAnswer> = {
      q1: 'A',
      q2: ['Z', 'X'],
      q3: 4,
      q4: 'comentario libre',
    };
    const result = scoreQuiz(quiz, answers);
    expect(result.score).toBe(3);
    expect(result.maxScore).toBe(3);
    expect(result.passed).toBe(true);
    expect(result.details.every((d) => d.correct)).toBe(true);
  });

  it('comparación sin importar mayúsculas ni tildes', () => {
    const answers: Record<string, QuizAnswer> = { q1: 'a ', q2: ['x', 'z'], q3: 4 };
    const result = scoreQuiz(quiz, answers);
    expect(result.score).toBe(3);
  });

  it('checkbox: el conjunto debe coincidir exactamente (ni más ni menos)', () => {
    const partial: Record<string, QuizAnswer> = { q1: 'A', q2: ['X'], q3: 4 };
    expect(scoreQuiz(quiz, partial).score).toBe(2);

    const extra: Record<string, QuizAnswer> = { q1: 'A', q2: ['X', 'Y', 'Z'], q3: 4 };
    expect(scoreQuiz(quiz, extra).score).toBe(2);
  });

  it('no aprueba por debajo del umbral (2/3 con 70%)', () => {
    const answers: Record<string, QuizAnswer> = { q1: 'B', q2: ['X', 'Z'], q3: 4 };
    const result = scoreQuiz(quiz, answers);
    expect(result.score).toBe(2);
    expect(result.maxScore).toBe(3);
    expect(result.passed).toBe(false);
    expect(quizScorePct(result)).toBe(67);
  });

  it('aprueba en el límite del umbral (2/3 con 60%)', () => {
    const lowThreshold: Quiz = { ...quiz, passThreshold: 60 };
    const answers: Record<string, QuizAnswer> = { q1: 'B', q2: ['X', 'Z'], q3: 4 };
    expect(scoreQuiz(lowThreshold, answers).passed).toBe(true);
  });

  it('respuestas faltantes cuentan como incorrectas', () => {
    const result = scoreQuiz(quiz, {});
    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
  });
});

describe('isAnswerCorrect', () => {
  it('compara texto exacto', () => {
    const q: QuizQuestion = { type: 'texto', label: 'x', correct: 'cortisol' };
    expect(isAnswerCorrect(q, 'Cortisol')).toBe(true);
    expect(isAnswerCorrect(q, 'melatonina')).toBe(false);
  });

  it('checkbox con orden distinto es correcto', () => {
    const q: QuizQuestion = { type: 'checkbox', label: 'x', options: ['A', 'B', 'C'], correct: ['A', 'C'] };
    expect(isAnswerCorrect(q, ['C', 'A'])).toBe(true);
    expect(isAnswerCorrect(q, ['A'])).toBe(false);
  });
});
