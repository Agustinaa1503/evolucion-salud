/**
 * Lógica pura de favoritos (FASE 8), testeable sin base de datos.
 */

export type FavoriteRow = { course_id: string };
export type CatalogRow = { id: string; slug: string };

/**
 * Convierte filas de `user_favorites` en slugs de cursos usando el catálogo
 * sincronizado (courses → id/slug). Descarta cursos que ya no existen.
 */
export function favoriteRowsToSlugs(
  rows: FavoriteRow[],
  catalogRows: CatalogRow[]
): string[] {
  const slugById = new Map(catalogRows.map((r) => [r.id, r.slug]));
  return rows
    .map((r) => slugById.get(r.course_id))
    .filter((s): s is string => Boolean(s));
}
