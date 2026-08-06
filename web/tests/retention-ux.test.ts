import { describe, expect, it } from 'vitest';
import {
  detectMilestoneCrossings,
  isModuleUnlocked,
} from '../lib/lms/progress';

/* ---------- Gating secuencial de módulos ---------- */

const makeModules = (
  titles: string[],
  lessonCounts: number[],
  quizOnModules: number[] = []
) =>
  titles.map((title, i) => ({
    id: `mod-${i + 1}`,
    title,
    lessons: Array.from({ length: lessonCounts[i] }, (_, j) => ({
      id: `m${i + 1}-l${j + 1}`,
      type: quizOnModules.includes(i) && j === lessonCounts[i] - 1 ? 'quiz' : 'texto',
    })),
  }));

describe('isModuleUnlocked', () => {
  it('siempre desbloquea el primer módulo', () => {
    const modules = makeModules(['Intro', 'Avanzado'], [3, 3]);
    const result = isModuleUnlocked(0, modules, true, new Set(), new Set());
    expect(result.unlocked).toBe(true);
  });

  it('sequential=false desbloquea todo', () => {
    const modules = makeModules(['Intro', 'Intermedio', 'Avanzado'], [3, 3, 3]);
    const result = isModuleUnlocked(2, modules, false, new Set(), new Set());
    expect(result.unlocked).toBe(true);
  });

  it('sequential=true bloquea módulo 2 si el módulo 1 no está completo', () => {
    const modules = makeModules(['Intro', 'Avanzado'], [3, 3]);
    const completed = new Set(['m1-l1', 'm1-l2']); // Falta m1-l3
    const result = isModuleUnlocked(1, modules, true, completed, new Set());
    expect(result.unlocked).toBe(false);
    expect(result.reason).toContain('Completa las lecciones');
  });

  it('sequential=true desbloquea módulo 2 cuando el módulo 1 está completo (sin quiz)', () => {
    const modules = makeModules(['Intro', 'Avanzado'], [3, 3]);
    const completed = new Set(['m1-l1', 'm1-l2', 'm1-l3']);
    const result = isModuleUnlocked(1, modules, true, completed, new Set());
    expect(result.unlocked).toBe(true);
  });

  it('sequential=true bloquea módulo 2 si módulo 1 tiene quiz no aprobado', () => {
    const modules = makeModules(['Intro', 'Avanzado'], [2, 2], [0]);
    const completed = new Set(['m1-l1', 'm1-l2']);
    // Quiz de módulo 1 (m1-l2) no aprobado
    const result = isModuleUnlocked(1, modules, true, completed, new Set());
    expect(result.unlocked).toBe(false);
    expect(result.reason).toContain('Aprueba la evaluación');
  });

  it('sequential=true desbloquea módulo 2 si módulo 1 tiene quiz aprobado', () => {
    const modules = makeModules(['Intro', 'Avanzado'], [2, 2], [0]);
    const completed = new Set(['m1-l1', 'm1-l2']);
    const passed = new Set(['m1-l2']); // Quiz aprobado
    const result = isModuleUnlocked(1, modules, true, completed, passed);
    expect(result.unlocked).toBe(true);
  });

  it('sequential=true bloquea módulo 3 si módulo 2 no está completo', () => {
    const modules = makeModules(['Intro', 'Intermedio', 'Avanzado'], [2, 2, 2]);
    const completed = new Set(['m1-l1', 'm1-l2']); // Solo módulo 1 completo
    const result = isModuleUnlocked(2, modules, true, completed, new Set());
    expect(result.unlocked).toBe(false);
    expect(result.reason).toContain('módulo «Intermedio»');
  });

  it('sequential=true desbloquea módulo 3 cuando módulos 1 y 2 están completos', () => {
    const modules = makeModules(['Intro', 'Intermedio', 'Avanzado'], [2, 2, 2]);
    const completed = new Set(['m1-l1', 'm1-l2', 'm2-l1', 'm2-l2']);
    const result = isModuleUnlocked(2, modules, true, completed, new Set());
    expect(result.unlocked).toBe(true);
  });

  it('maneja módulos sin id correctamente', () => {
    const modules = [
      { title: 'Sin ID', lessons: [{ id: 'l1', type: 'texto' }, { id: 'l2', type: 'texto' }] },
      { title: 'Siguiente', lessons: [{ id: 'l3', type: 'texto' }] },
    ];
    const completed = new Set(['l1', 'l2']);
    const result = isModuleUnlocked(1, modules, true, completed, new Set());
    expect(result.unlocked).toBe(true);
  });

  it('maneja módulos sin lecciones', () => {
    const modules = [
      { id: 'a', title: 'Vacío', lessons: [] },
      { id: 'b', title: 'Siguiente', lessons: [{ id: 'l1', type: 'texto' }] },
    ];
    const result = isModuleUnlocked(1, modules, true, new Set(), new Set());
    expect(result.unlocked).toBe(false);
  });
});

/* ---------- Milestones de progreso ---------- */

describe('detectMilestoneCrossings', () => {
  it('detecta cruce de 25%', () => {
    expect(detectMilestoneCrossings(20, 30)).toEqual([25]);
  });

  it('detecta cruce de 50%', () => {
    expect(detectMilestoneCrossings(40, 60)).toEqual([50]);
  });

  it('detecta cruce de 75%', () => {
    expect(detectMilestoneCrossings(70, 80)).toEqual([75]);
  });

  it('detecta cruce de 100%', () => {
    expect(detectMilestoneCrossings(95, 100)).toEqual([100]);
  });

  it('detecta múltiples hitos en un solo salto', () => {
    expect(detectMilestoneCrossings(20, 80)).toEqual([25, 50, 75]);
  });

  it('no detecta hitos si no hay cruce', () => {
    expect(detectMilestoneCrossings(30, 40)).toEqual([]);
  });

  it('no detecta hitos ya alcanzados', () => {
    expect(detectMilestoneCrossings(30, 30)).toEqual([]);
  });

  it('detecta todos los hitos de 0 a 100', () => {
    expect(detectMilestoneCrossings(0, 100)).toEqual([25, 50, 75, 100]);
  });

  it('maneja saltos pequeños', () => {
    expect(detectMilestoneCrossings(24, 26)).toEqual([25]);
    expect(detectMilestoneCrossings(49, 51)).toEqual([50]);
    expect(detectMilestoneCrossings(74, 76)).toEqual([75]);
    expect(detectMilestoneCrossings(99, 100)).toEqual([100]);
  });

  it('no detecta hito si el salto no lo alcanza', () => {
    expect(detectMilestoneCrossings(20, 24)).toEqual([]);
    expect(detectMilestoneCrossings(95, 99)).toEqual([]);
  });
});
