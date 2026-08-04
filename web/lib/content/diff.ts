/**
 * Diferencias entre versiones de contenido (Subfase 12.2 — CMS).
 *
 * Compara el contenido de dos versiones (front matter + cuerpo) y devuelve
 * líneas etiquetadas para renderizar un diff legible. Lógica pura, testeable.
 */
import { diffLines } from 'diff';
import type { ContentVersionRow } from './versioning';

export type DiffLine = {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
};

/** Serializa una versión a texto plano (front matter YAML + cuerpo). */
export function versionToText(row: ContentVersionRow): string {
  const frontmatter = JSON.stringify(row.frontmatter ?? {}, null, 2);
  return `---\n${frontmatter.replace(/^\{|\}$/gu, '').trim()}\n---\n\n${row.body ?? ''}`;
}

/**
 * Compara dos versiones por líneas. Devuelve el diff etiquetado; `prev` puede
 * ser `null` (versión inicial → todo es "added").
 */
export function diffVersions(
  prev: ContentVersionRow | null,
  next: ContentVersionRow
): DiffLine[] {
  const before = prev ? versionToText(prev) : '';
  const after = versionToText(next);
  if (!before) {
    return [
      { type: 'added', value: after },
    ];
  }
  return diffLines(before, after).map((part) => ({
    type: part.added
      ? 'added'
      : part.removed
        ? 'removed'
        : 'unchanged',
    value: part.value,
  }));
}
