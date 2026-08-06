import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { serializeCourse, serializeCourseToData, orderCourseFrontmatter, courseChanged } from '../lib/courses/serializer';
import { parseCourseFile } from '../lib/courses/parser';
import { validateCourse, createEmptyCourse, nextLessonId, saveCourse } from '../lib/courses/cms';
import type { Course, CourseModule, CourseLesson, Quiz } from '../lib/courses/types';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const TMP_DIR = path.join(os.tmpdir(), `courses-cms-test-${Date.now()}`);

function writeTmpCourse(slug: string, md: string): string {
  const filePath = path.join(TMP_DIR, `${slug}.md`);
  fs.mkdirSync(TMP_DIR, { recursive: true });
  fs.writeFileSync(filePath, md, 'utf8');
  return filePath;
}

function readTmpCourse(slug: string): string {
  return fs.readFileSync(path.join(TMP_DIR, `${slug}.md`), 'utf8');
}

beforeEach(() => {
  fs.mkdirSync(TMP_DIR, { recursive: true });
});

afterEach(() => {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
});

/* -------------------------------------------------------------------------- */
/* Test data                                                                   */
/* -------------------------------------------------------------------------- */

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 'test-course',
    slug: 'test-course',
    title: 'Curso de prueba',
    subtitle: 'Subtítulo del curso',
    description: 'Descripción del curso de prueba.',
    category: 'PINE',
    author: 'Equipo Evolución Salud',
    teachers: [{ name: 'Lic. Test', role: 'Docente' }],
    tags: ['pine', 'test'],
    type: 'free',
    status: 'published',
    visibility: 'public',
    cta: 'ver-curso',
    currency: 'ARS',
    seo: { title: 'SEO Title', description: 'SEO Desc', keywords: ['test'] },
    featured: false,
    hasQuiz: true,
    hasCertificate: false,
    videos: [],
    resources: [],
    modules: [
      {
        id: 'mod-uno',
        title: 'Módulo 1',
        description: 'Descripción del módulo',
        lessons: [
          { id: 'm1-l1', title: 'Lección 1', type: 'video', videoUrl: 'https://youtu.be/abc', platform: 'youtube', duration: '10:00' },
          { id: 'm1-l2', title: 'Lección 2', type: 'texto' },
        ],
      },
    ],
    objectives: ['Aprender PINE'],
    learning: ['Entender el estrés'],
    audience: ['Público general'],
    requirements: [],
    faq: [],
    bibliography: [],
    sections: [],
    icon: 'book',
    gradient: 'from-brand-500 to-leaf-600',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-15',
    ...overrides,
  };
}

/* -------------------------------------------------------------------------- */
/* Tests: serializer                                                           */
/* -------------------------------------------------------------------------- */

describe('course serializer', () => {
  it('serializa un curso a data con orden canónico', () => {
    const course = makeCourse();
    const data = serializeCourseToData(course);
    const keys = Object.keys(data);
    // slug, title, subtitle, description deben estar al inicio
    expect(keys.indexOf('slug')).toBeLessThan(keys.indexOf('title'));
    expect(keys.indexOf('title')).toBeLessThan(keys.indexOf('type'));
    expect(keys.indexOf('type')).toBeLessThan(keys.indexOf('seo'));
  });

  it('orderCourseFrontmatter respeta el orden canónico', () => {
    const data = {
      seo: { title: 'x' },
      slug: 'test',
      title: 'Test',
      type: 'free',
      modules: [],
    };
    const ordered = orderCourseFrontmatter(data);
    const keys = Object.keys(ordered);
    expect(keys[0]).toBe('slug');
    expect(keys[1]).toBe('title');
    expect(keys[2]).toBe('type');
    expect(keys[keys.length - 1]).toBe('seo');
  });

  it('serializa módulos y lecciones correctamente', () => {
    const course = makeCourse();
    const md = serializeCourse(course);
    expect(md).toContain('---');
    expect(md).toContain('id: test-course');
    expect(md).toContain('title: Curso de prueba');
    expect(md).toContain('mod-uno');
    expect(md).toContain('m1-l1');
    expect(md).toContain('m1-l2');
  });

  it('conserva el ID de lecciones existentes al serializar', () => {
    const course = makeCourse({
      modules: [{
        id: 'mod-custom',
        title: 'Módulo Custom',
        lessons: [
          { id: 'lesson-stable-id', title: 'Lección estable', type: 'video', videoUrl: 'https://youtu.be/xyz' },
        ],
      }],
    });
    const md = serializeCourse(course);
    expect(md).toContain('lesson-stable-id');
  });

  it('serializa quiz con passThreshold y correct', () => {
    const course = makeCourse({
      quiz: {
        title: 'Quiz de prueba',
        passThreshold: 70,
        questions: [
          { type: 'radio', label: '¿Qué es PINE?', options: ['Opción A', 'Opción B'], correct: 'Opción A' },
          { type: 'checkbox', label: ' Seleccione todo', options: ['X', 'Y', 'Z'], correct: ['X', 'Z'] },
          { type: 'escala', label: 'Escala', scale: { min: 1, max: 10 }, correct: 8 },
        ],
      },
    });
    const md = serializeCourse(course);
    expect(md).toContain('passThreshold: 70');
    expect(md).toContain('correct: Opción A');
  });

  it('serializa certificateConfig con signers', () => {
    const course = makeCourse({
      hasCertificate: true,
      certificateConfig: {
        enabled: true,
        signers: [{ name: 'Dr. Test', title: 'Director', license: 'MP 123' }],
      },
    });
    const md = serializeCourse(course);
    expect(md).toContain('certificateConfig:');
    expect(md).toContain('Dr. Test');
    expect(md).toContain('MP 123');
  });
});

/* -------------------------------------------------------------------------- */
/* Tests: round-trip (parse → serialize → parse)                               */
/* -------------------------------------------------------------------------- */

describe('round-trip: parse → serialize → parse', () => {
  it('preserva todos los campos después de un round-trip', () => {
    const md = `---
id: roundtrip
slug: roundtrip
title: Curso Roundtrip
subtitle: Sub
description: Desc
category: PINE
author: Autor
tags:
  - tag1
  - tag2
teachers:
  - name: "Lic. Test"
    role: Docente
type: free
status: published
visibility: public
cta: ver-curso
duration: "30:00"
level: Inicial
difficulty: Básico
featured: true
hasQuiz: true
hasCertificate: true
certificateConfig:
  enabled: true
  signers:
    - name: "Dr. Roundtrip"
      title: "Director"
modules:
  - id: mod-rt
    title: Módulo RT
    lessons:
      - id: rt-l1
        title: "Lección RT"
        type: video
        videoUrl: https://youtu.be/abc123
        platform: youtube
        duration: "15:00"
        free: true
      - id: rt-l2
        title: Lección texto
        type: texto
quiz:
  title: Quiz RT
  passThreshold: 70
  questions:
    - type: radio
      label: Pregunta 1
      options:
        - A
        - B
      correct: A
objectives:
  - Objetivo 1
  - Objetivo 2
seo:
  title: SEO RT
  description: Desc SEO
  keywords:
    - kw1
---

## Acerca de este curso

Texto introductorio.

## Qué aprenderás

- Objetivo 1
- Objetivo 2
`;

    const filePath = writeTmpCourse('roundtrip', md);
    const original = parseCourseFile(filePath);
    const serialized = serializeCourse(original);
    const filePath2 = writeTmpCourse('roundtrip2', serialized);
    const roundtripped = parseCourseFile(filePath2);

    // IDs preservados
    expect(roundtripped.slug).toBe('roundtrip');
    expect(roundtripped.modules[0].id).toBe('mod-rt');
    expect(roundtripped.modules[0].lessons![0].id).toBe('rt-l1');
    expect(roundtripped.modules[0].lessons![1].id).toBe('rt-l2');

    // Datos preservados
    expect(roundtripped.title).toBe('Curso Roundtrip');
    expect(roundtripped.type).toBe('free');
    expect(roundtripped.status).toBe('published');
    expect(roundtripped.hasQuiz).toBe(true);
    expect(roundtripped.hasCertificate).toBe(true);
    expect(roundtripped.certificateConfig?.signers).toHaveLength(1);
    expect(roundtripped.quiz?.passThreshold).toBe(70);
    expect(roundtripped.quiz?.questions[0].correct).toBe('A');

    // Lecciones
    expect(roundtripped.modules[0].lessons![0].videoUrl).toBe('https://youtu.be/abc123');
    expect(roundtripped.modules[0].lessons![0].platform).toBe('youtube');
    expect(roundtripped.modules[0].lessons![0].duration).toBe('15:00');
    expect(roundtripped.modules[0].lessons![0].free).toBe(true);
  });

  it('preserva lecciones con IDs estables tras edición', () => {
    const md = `---
id: stable-ids
slug: stable-ids
title: IDs Estables
description: Test
type: free
status: published
modules:
  - id: mod-a
    title: Módulo A
    lessons:
      - id: custom-id-1
        title: Lección 1
        type: texto
      - id: custom-id-2
        title: Lección 2
        type: texto
---

## Acerca de este curso
Contenido.
`;
    const filePath = writeTmpCourse('stable-ids', md);
    const original = parseCourseFile(filePath);

    // Editar el título de la lección sin cambiar el ID
    original.modules[0].lessons![0].title = 'Lección 1 Editada';
    const serialized = serializeCourse(original);
    const filePath2 = writeTmpCourse('stable-ids2', serialized);
    const roundtripped = parseCourseFile(filePath2);

    expect(roundtripped.modules[0].lessons![0].id).toBe('custom-id-1');
    expect(roundtripped.modules[0].lessons![0].title).toBe('Lección 1 Editada');
    expect(roundtripped.modules[0].lessons![1].id).toBe('custom-id-2');
  });
});

/* -------------------------------------------------------------------------- */
/* Tests: courseChanged                                                         */
/* -------------------------------------------------------------------------- */

describe('courseChanged', () => {
  it('devuelve false si el curso no cambió semánticamente', () => {
    const course = makeCourse();
    const md = serializeCourse(course);
    const filePath = writeTmpCourse('no-change', md);
    expect(courseChanged(filePath, course)).toBe(false);
  });

  it('devuelve true si el título cambió', () => {
    const course = makeCourse();
    const md = serializeCourse(course);
    const filePath = writeTmpCourse('with-change', md);
    const changed = { ...course, title: 'Nuevo título' };
    expect(courseChanged(filePath, changed)).toBe(true);
  });

  it('devuelve true si el archivo no existe', () => {
    const course = makeCourse();
    expect(courseChanged('/nonexistent/path.md', course)).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* Tests: validation                                                           */
/* -------------------------------------------------------------------------- */

describe('validateCourse', () => {
  it('acepta un curso válido', () => {
    const result = validateCourse(makeCourse());
    expect(result.ok).toBe(true);
    expect(result.issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('rechaza slug inválido', () => {
    const result = validateCourse(makeCourse({ slug: 'Slug Con Espacios' }));
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.field === 'slug')).toBe(true);
  });

  it('rechaza título vacío', () => {
    const result = validateCourse(makeCourse({ title: '' }));
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.field === 'title')).toBe(true);
  });

  it('rechaza tipo inválido', () => {
    const result = validateCourse(makeCourse({ type: 'invalido' as Course['type'] }));
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.field === 'type')).toBe(true);
  });

  it('detecta IDs de lección duplicados', () => {
    const result = validateCourse(makeCourse({
      modules: [{
        title: 'Mod',
        lessons: [
          { id: 'dup-id', title: 'L1', type: 'texto' },
          { id: 'dup-id', title: 'L2', type: 'texto' },
        ],
      }],
    }));
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.message.includes('duplicado'))).toBe(true);
  });

  it('detecta lección sin ID', () => {
    const result = validateCourse(makeCourse({
      modules: [{
        title: 'Mod',
        lessons: [
          { id: '', title: 'L1', type: 'texto' },
        ],
      }],
    }));
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.message.includes('ID obligatorio'))).toBe(true);
  });

  it('detecta módulo sin título', () => {
    const result = validateCourse(makeCourse({
      modules: [{ title: '', lessons: [] }],
    }));
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.field.includes('title'))).toBe(true);
  });

  it('valida passThreshold del quiz', () => {
    const result = validateCourse(makeCourse({
      quiz: { passThreshold: 150, questions: [] },
    }));
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.field === 'quiz.passThreshold')).toBe(true);
  });

  it('acepta passThreshold válido', () => {
    const result = validateCourse(makeCourse({
      quiz: { passThreshold: 70, questions: [{ type: 'radio', label: 'P1', options: ['A'] }] },
    }));
    expect(result.ok).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* Tests: helpers                                                              */
/* -------------------------------------------------------------------------- */

describe('nextLessonId', () => {
  it('genera m1-l1 para módulo vacío', () => {
    const modules: CourseModule[] = [{ title: 'Mod', lessons: [] }];
    expect(nextLessonId(modules, 0)).toBe('m1-l1');
  });

  it('genera m2-l1 para segundo módulo', () => {
    const modules: CourseModule[] = [{ title: 'Mod1' }, { title: 'Mod2', lessons: [] }];
    expect(nextLessonId(modules, 1)).toBe('m2-l1');
  });

  it('genera m1-l3 si ya hay 2 lecciones', () => {
    const modules: CourseModule[] = [{
      title: 'Mod',
      lessons: [
        { id: 'm1-l1', title: 'L1', type: 'texto' },
        { id: 'm1-l2', title: 'L2', type: 'texto' },
      ],
    }];
    expect(nextLessonId(modules, 0)).toBe('m1-l3');
  });
});

describe('createEmptyCourse', () => {
  it('crea un curso con valores por defecto', () => {
    const course = createEmptyCourse('nuevo-curso');
    expect(course.slug).toBe('nuevo-curso');
    expect(course.title).toBe('');
    expect(course.status).toBe('draft');
    expect(course.type).toBe('free');
    expect(course.modules).toEqual([]);
    expect(course.createdAt).toBeDefined();
  });
});

/* -------------------------------------------------------------------------- */
/* Tests: saveCourse                                                           */
/* -------------------------------------------------------------------------- */

describe('saveCourse', () => {
  // Necesitamos setear COURSES_DIR para que saveCourse escriba en tmp
  const originalCoursesDir = process.env.COURSES_DIR;

  beforeEach(() => {
    process.env.COURSES_DIR = TMP_DIR;
  });

  afterEach(() => {
    if (originalCoursesDir !== undefined) {
      process.env.COURSES_DIR = originalCoursesDir;
    } else {
      delete process.env.COURSES_DIR;
    }
  });

  it('guarda un curso válido y se puede volver a leer', () => {
    const course = makeCourse({ slug: 'save-test' });
    const result = saveCourse(course);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.saved).toBe(true);
      // Verificar que el archivo existe
      const filePath = path.join(TMP_DIR, 'save-test.md');
      expect(fs.existsSync(filePath)).toBe(true);
      // Verificar que se puede parsear de vuelta
      const reloaded = parseCourseFile(filePath);
      expect(reloaded.slug).toBe('save-test');
      expect(reloaded.title).toBe('Curso de prueba');
      expect(reloaded.modules[0].lessons![0].id).toBe('m1-l1');
    }
  });

  it('rechaza curso con datos inválidos', () => {
    const course = makeCourse({ slug: '', title: '' });
    const result = saveCourse(course);
    expect(result.ok).toBe(false);
  });

  it('es idempotente: el curso se puede guardar dos veces sin error', () => {
    const course = makeCourse({ slug: 'no-rw-test' });
    const r1 = saveCourse(course);
    expect(r1.ok).toBe(true);
    const r2 = saveCourse(course);
    expect(r2.ok).toBe(true);
    // Ambas escrituras son exitosas; updatedAt siempre se actualiza
  });
});
