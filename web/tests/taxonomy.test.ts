import { describe, expect, it } from 'vitest';
import {
  slugify,
  slugifyTag,
  CONTENT_TYPE_LABELS,
} from '@/lib/taxonomy/types';
import {
  getAllCategories,
  getCategory,
  getCategoryName,
  getCategoryGroups,
} from '@/lib/taxonomy/categories';
import {
  getLevel,
  getLevelName,
  getAudienceName,
  getAllLevels,
  getAllAudiences,
} from '@/lib/taxonomy/levels-audiences';
import {
  getAllItems,
  getPublicItems,
  getItemsByCategory,
  getItemsByTag,
  getCategoryCounts,
  getAllTags,
  getFilterOptions,
  filterItems,
  recommendItems,
  courseItem,
} from '@/lib/taxonomy/content';

describe('taxonomy: slugify', () => {
  it('normaliza tildes, mayúsculas y espacios', () => {
    expect(slugify('Estrés Ocupacional')).toBe('estres-ocupacional');
    expect(slugify('PINE')).toBe('pine');
    expect(slugify('  Ansiedad  prequirúrgica ')).toBe('ansiedad-prequirurgica');
  });

  it('slugifyTag quita signos de puntuación y emojis', () => {
    expect(slugifyTag('estrés, crónico')).toBe('estres-cronico');
    expect(slugifyTag('salud mental & bienestar')).toBe('salud-mental-bienestar');
    expect(slugifyTag('Hábitos 🌿')).toBe('habitos');
  });
});

describe('taxonomy: categorías', () => {
  it('exponen las categorías agrupadas con conteos', () => {
    const groups = getCategoryGroups();
    expect(groups.length).toBeGreaterThan(0);
    const total = groups.reduce((acc, g) => acc + g.items.length, 0);
    expect(total).toBe(getAllCategories().length);
  });

  it('resuelve categorías por slug y devuelve nombre legible', () => {
    expect(getCategory('pine')).toBeDefined();
    expect(getCategoryName('pine')).toBeTruthy();
    expect(getCategory('no-existe')).toBeUndefined();
    expect(getCategoryName('no-existe')).toBe('no-existe');
  });
});

describe('taxonomy: niveles y audiencias', () => {
  it('mapea dificultades a niveles estables', () => {
    expect(getLevel('inicial')?.slug).toBe('inicial');
    expect(getLevel('introductorio')?.slug).toBe('introductorio');
    expect(getLevelName('inicial')).toBeTruthy();
    expect(getAllLevels()).toHaveLength(5);
  });

  it('resuelve audiencias por slug y alias', () => {
    expect(getAudienceName('publico-general')).toBeTruthy();
    expect(getAllAudiences().length).toBeGreaterThanOrEqual(8);
  });
});

describe('taxonomy: agregación de contenido', () => {
  it('agrega todos los tipos de contenido', () => {
    const items = getAllItems();
    for (const type of Object.keys(CONTENT_TYPE_LABELS)) {
      expect(items.some((i) => i.contentType === type)).toBe(true);
    }
    expect(getPublicItems().every((i) => i.status !== 'draft')).toBe(true);
  });

  it('clasifica por categoría', () => {
    const counts = getCategoryCounts();
    expect(counts.size).toBeGreaterThan(0);
    expect(Array.from(counts.values()).reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(
      getAllItems().length
    );
    expect(getItemsByCategory('pine').length).toBeGreaterThan(0);
    expect(getItemsByCategory('zzz').length).toBe(0);
  });

  it('deriva tags con conteos', () => {
    const tags = getAllTags();
    expect(Array.isArray(tags)).toBe(true);
    const estres = tags.find((t) => t.slug === 'estres');
    expect(estres).toBeDefined();
    expect(estres?.count).toBeGreaterThan(0);
    expect(getItemsByTag('estres').length).toBeGreaterThan(0);
  });

  it('filtra por categoría, nivel, audiencia, tipo, estado y query', () => {
    const all = getPublicItems();
    expect(filterItems(all, { category: 'pine' }).length).toBeGreaterThan(0);
    expect(filterItems(all, { type: 'course' }).every((i) => i.contentType === 'course')).toBe(true);
    const q = filterItems(all, { query: 'pine' });
    expect(q.length).toBeGreaterThan(0);
    expect(filterItems(all, { query: 'zzzz-no-existe' }).length).toBe(0);
    expect(filterItems(all, { status: 'draft' }).length).toBe(0);
  });

  it('expone opciones de filtros consistentes con el contenido', () => {
    const options = getFilterOptions();
    expect(options.categories.length).toBeGreaterThan(0);
    expect(options.levels.length).toBe(5);
    expect(options.audiences.length).toBeGreaterThan(0);
    expect(options.types).toContain('course');
    expect(options.statuses).toContain('published');
  });
});

describe('taxonomy: recomendaciones', () => {
  it('recomienda cursos, artículos y recursos por afinidad', () => {
    const courses = getAllItems().filter((i) => i.contentType === 'course');
    expect(courses.length).toBeGreaterThan(0);
    const item = courseItem(courses[0].data as Parameters<typeof courseItem>[0]);
    const recs = recommendItems(item, { limit: 10 });
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.every((r) => r.id !== item.id)).toBe(true);
  });

  it('no recomienda el mismo ítem aunque comparta categorías', () => {
    const items = getPublicItems();
    const recs = recommendItems(items[0], { limit: 100 });
    expect(recs.some((r) => r.id === items[0].id)).toBe(false);
  });
});
