import { describe, expect, it } from 'vitest';
import { formatStudyTime, summarizeStats } from '../lib/lms/progress';

describe('formatStudyTime (FASE 4)', () => {
  it('devuelve 0 min para valores no positivos', () => {
    expect(formatStudyTime(0)).toBe('0 min');
    expect(formatStudyTime(-30)).toBe('0 min');
  });

  it('formatea solo minutos', () => {
    expect(formatStudyTime(120)).toBe('2 min');
    expect(formatStudyTime(59)).toBe('0 min');
    expect(formatStudyTime(60)).toBe('1 min');
  });

  it('formatea horas con minutos y horas solas', () => {
    expect(formatStudyTime(8100)).toBe('2 h 15 min');
    expect(formatStudyTime(7200)).toBe('2 h');
    expect(formatStudyTime(7260)).toBe('2 h 1 min');
  });
});

describe('summarizeStats (FASE 4)', () => {
  it('agrupa en curso / completados y acumula tiempo de estudio', () => {
    const stats = summarizeStats([
      { status: 'completed', totalStudySeconds: 3600 },
      { status: 'in_progress', totalStudySeconds: 1800 },
      { status: 'in_progress', totalStudySeconds: 0 },
    ]);
    expect(stats).toEqual({ inProgress: 2, completed: 1, totalStudySeconds: 5400 });
  });

  it('devuelve ceros sin cursos', () => {
    expect(summarizeStats([])).toEqual({ inProgress: 0, completed: 0, totalStudySeconds: 0 });
  });
});
