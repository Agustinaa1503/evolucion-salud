import { describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseCourseFile } from '../lib/courses/parser';
import { countLessons } from '../lib/courses/types';

function parse(md: string) {
  const file = path.join(os.tmpdir(), `course-test-${Date.now()}-${Math.random().toString(36).slice(2)}.md`);
  fs.writeFileSync(file, md, 'utf8');
  try {
    return parseCourseFile(file);
  } finally {
    fs.rmSync(file, { force: true });
  }
}

const MINIMAL = `---
id: test
title: Curso de prueba
description: Descripción
type: free
status: published
modules:
  - id: mod-uno
    title: Módulo 1
    lessons:
      - id: l1
        title: "Video: una clase"
        type: video
        videoUrl: https://youtu.be/abc
        duration: "10:00"
      - id: l2
        title: Material de lectura
        type: texto
  - title: Módulo 2 (legado)
    lessons:
      - Lección vieja en formato string
bibliography:
  - authors: McEwen, B. S.
    year: "1998"
    title: "Protective and damaging effects of stress mediators"
    source: New England Journal of Medicine
    url: https://pubmed.ncbi.nlm.nih.gov/9570336/
---

## Acerca de este curso

Texto introductorio.

## Bibliografía

- Referencia heredada plana
`;

describe('parser FASE 2', () => {
  it('convierte lecciones de módulos en objetos estructurados', () => {
    const c = parse(MINIMAL);
    const mod1 = c.modules[0];
    expect(mod1.id).toBe('mod-uno');
    expect(mod1.lessons).toHaveLength(2);
    expect(mod1.lessons?.[0]).toMatchObject({
      id: 'l1',
      title: 'Video: una clase',
      type: 'video',
      videoUrl: 'https://youtu.be/abc',
      platform: 'youtube',
      duration: '10:00',
    });
    expect(mod1.lessons?.[1].type).toBe('texto');
    expect(mod1.lessons?.[1].videoUrl).toBeUndefined();
  });

  it('mantiene compatibilidad con lecciones en formato string (genera id)', () => {
    const c = parse(MINIMAL);
    const legacy = c.modules[1];
    expect(legacy.title).toBe('Módulo 2 (legado)');
    expect(legacy.lessons?.[0]).toMatchObject({ title: 'Lección vieja en formato string', type: 'texto' });
    expect(legacy.lessons?.[0].id).toBe('m2-l1');
  });

  it('deriva videos desde las lecciones de tipo video (fuente única)', () => {
    const c = parse(MINIMAL);
    expect(c.videos).toHaveLength(1);
    expect(c.videos[0]).toMatchObject({
      title: 'Video: una clase',
      url: 'https://youtu.be/abc',
      duration: '10:00',
    });
  });

  it('no deriva videos duplicados si están repetidos en dos lecciones', () => {
    const md = MINIMAL.replace(
      '      - id: l2\n        title: Material de lectura\n        type: texto',
      '      - id: l2\n        title: Video repetido\n        type: video\n        videoUrl: https://youtu.be/abc'
    );
    const c = parse(md);
    expect(c.videos.filter((v) => v.url === 'https://youtu.be/abc')).toHaveLength(1);
  });

  it('parsea bibliografía estructurada con prioridad sobre la lista plana', () => {
    const c = parse(MINIMAL);
    expect(c.bibliography).toHaveLength(1);
    expect(c.bibliography[0]).toMatchObject({
      authors: 'McEwen, B. S.',
      year: '1998',
      title: 'Protective and damaging effects of stress mediators',
      source: 'New England Journal of Medicine',
      url: 'https://pubmed.ncbi.nlm.nih.gov/9570336/',
    });
  });

  it('usa la lista plana de la sección Bibliografía como fallback', () => {
    const md = MINIMAL.replace(
      'bibliography:\n  - authors: McEwen, B. S.\n    year: "1998"\n    title: "Protective and damaging effects of stress mediators"\n    source: New England Journal of Medicine\n    url: https://pubmed.ncbi.nlm.nih.gov/9570336/\n',
      ''
    );
    const c = parse(md);
    expect(c.bibliography).toHaveLength(1);
    expect(c.bibliography[0].title).toBe('Referencia heredada plana');
  });

  it('countLessons suma las lecciones de todos los módulos', () => {
    const c = parse(MINIMAL);
    expect(countLessons(c)).toBe(3);
  });

  it('detecta la plataforma de video por URL si no se indica', () => {
    const md = MINIMAL.replace('platform: youtube\n', '').replace('https://youtu.be/abc', 'https://vimeo.com/123');
    const c = parse(md);
    expect(c.modules[0].lessons?.[0].platform).toBe('vimeo');
  });
});
