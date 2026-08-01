import { describe, expect, it } from 'vitest';
import { favoriteRowsToSlugs } from '../lib/lms/favorites';

const CATALOG = [
  { id: 'c1', slug: 'pine-15-minutos' },
  { id: 'c2', slug: 'estres-ocupacional' },
  { id: 'c3', slug: 'introduccion-pine' },
];

describe('favoriteRowsToSlugs (FASE 8)', () => {
  it('mapea filas de favoritos a slugs en el orden dado', () => {
    const slugs = favoriteRowsToSlugs(
      [{ course_id: 'c3' }, { course_id: 'c1' }],
      CATALOG
    );
    expect(slugs).toEqual(['introduccion-pine', 'pine-15-minutos']);
  });

  it('descarta cursos que ya no existen en el catálogo', () => {
    const slugs = favoriteRowsToSlugs(
      [{ course_id: 'c2' }, { course_id: 'fantasma' }],
      CATALOG
    );
    expect(slugs).toEqual(['estres-ocupacional']);
  });

  it('devuelve vacío sin favoritos', () => {
    expect(favoriteRowsToSlugs([], CATALOG)).toEqual([]);
  });

  it('devuelve vacío con catálogo vacío', () => {
    expect(favoriteRowsToSlugs([{ course_id: 'c1' }], [])).toEqual([]);
  });
});
