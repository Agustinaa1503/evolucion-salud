/**
 * Sincroniza la taxonomía unificada (FASE 10) hacia Supabase.
 *
 * La fuente de verdad es el contenido: `Cursos/*.md` y `web/lib/data/*`.
 * Este script deriva las categorías (catálogo fijo), los tags libres y las
 * relaciones contenido ↔ categoría/tag desde `getAllItems()`, y las upserta
 * en las tablas `categories`, `tags`, `content_categories` y `content_tags`
 * para que consultas, filtros y analytics tengan FKs reales.
 *
 * Uso:  npm run db:sync-taxonomy
 *       (necesita NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY)
 *
 * Garantías:
 *  - Idempotente: se puede correr las veces que sea necesario.
 *  - Reemplazo total de las uniones: las relaciones se recalculan desde el
 *    contenido, así no quedan vínculos huérfanos al reclasificar.
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { getAllItems, getPublicItems, getAllTags } from '../lib/taxonomy/content';
import { getAllCategories } from '../lib/taxonomy/categories';

/* -------------------------------------------------------------------------- */
/* Carga de variables de entorno (process.env tiene prioridad)                */
/* -------------------------------------------------------------------------- */
function loadEnvFile(file: string): void {
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, key, value] = m;
    if (process.env[key] !== undefined) continue;
    process.env[key] = value.replace(/^["']|["']$/g, '').trim();
  }
}
loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    '[sync-taxonomy] Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY. ' +
      'Completá web/.env.local y volvé a intentar.'
  );
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main(): Promise<void> {
  const categories = getAllCategories();
  const tags = getAllTags();
  const items = getAllItems();
  const publicItems = getPublicItems();

  console.log(
    `[sync-taxonomy] ${categories.length} categorías, ${tags.length} tags, ` +
      `${items.length} ítems (${publicItems.length} públicos)`
  );

  // 1) Categorías (catálogo fijo).
  const catRows = categories.map((c, i) => ({
    slug: c.slug,
    name: c.name,
    group: c.group,
    description: c.description ?? null,
    sort_order: i,
  }));
  const { error: catErr } = await sb.from('categories').upsert(catRows, { onConflict: 'slug' });
  if (catErr) {
    console.error('[sync-taxonomy] error al sincronizar categorías:', catErr.message);
    process.exit(1);
  }

  // 2) Tags (libres, derivados del contenido).
  const tagRows = tags.map((t) => ({ slug: t.slug, name: t.name }));
  const { error: tagErr } = await sb.from('tags').upsert(tagRows, { onConflict: 'slug' });
  if (tagErr) {
    console.error('[sync-taxonomy] error al sincronizar tags:', tagErr.message);
    process.exit(1);
  }

  // 3) Relaciones contenido ↔ categoría / tag (reemplazo total).
  const catLinks = items.flatMap((i) =>
    i.categories.map((slug) => ({
      content_type: i.contentType,
      content_id: i.slug,
      category_slug: slug,
    }))
  );
  const tagLinks = items.flatMap((i) =>
    i.tags.map((slug) => ({
      content_type: i.contentType,
      content_id: i.slug,
      tag_slug: slug,
    }))
  );

  const { error: clearCat } = await sb.from('content_categories').delete().neq('content_type', '');
  if (clearCat) {
    console.error('[sync-taxonomy] error al limpiar content_categories:', clearCat.message);
    process.exit(1);
  }
  const { error: clearTag } = await sb.from('content_tags').delete().neq('content_type', '');
  if (clearTag) {
    console.error('[sync-taxonomy] error al limpiar content_tags:', clearTag.message);
    process.exit(1);
  }

  if (catLinks.length) {
    const { error: catLinkErr } = await sb.from('content_categories').insert(catLinks);
    if (catLinkErr) {
      console.error('[sync-taxonomy] error al insertar content_categories:', catLinkErr.message);
      process.exit(1);
    }
  }
  if (tagLinks.length) {
    const { error: tagLinkErr } = await sb.from('content_tags').insert(tagLinks);
    if (tagLinkErr) {
      console.error('[sync-taxonomy] error al insertar content_tags:', tagLinkErr.message);
      process.exit(1);
    }
  }

  console.log(
    `[sync-taxonomy] OK: ${catRows.length} categorías, ${tagRows.length} tags, ` +
      `${catLinks.length} vínculos de categoría, ${tagLinks.length} vínculos de tag.`
  );
}

main().catch((err) => {
  console.error('[sync-taxonomy] error inesperado:', err);
  process.exit(1);
});
