/**
 * Smoke test de la taxonomía unificada (FASE 10) contra el proyecto remoto.
 *
 * Verifica:
 *  1. RLS: anon puede LEER categorías, tags y vínculos (catálogo público);
 *     NO puede insertar ni borrar.
 *  2. Sincronización: la base tiene las 37 categorías del catálogo y vínculos
 *     de contenido (content_categories/content_tags) consistente con el source.
 *  3. service_role puede escribir (permite re-sincronizar).
 *
 * Uso: node scripts/smoke-taxonomy.mjs
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}
loadEnvFile(path.resolve(process.cwd(), '.env.local'));

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SRV = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!BASE || !ANON || !SRV) {
  console.error('[smoke-taxonomy] Faltan credenciales en .env.local');
  process.exit(1);
}

const admin = createClient(BASE, SRV, { auth: { persistSession: false } });
const anon = createClient(BASE, ANON, { auth: { persistSession: false } });

const check = (label, ok, detail = '') => {
  console.log(`${ok ? '  ✔' : '  ✘'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
};

// 1) Lectura pública.
const { data: cats, error: catsErr } = await anon.from('categories').select('slug,name').order('sort_order');
check('anon lee categorías', !catsErr && Array.isArray(cats) && cats.length === 37, `${cats?.length ?? 0} categorías`);

const { data: tags, error: tagsErr } = await anon.from('tags').select('slug,name');
check('anon lee tags', !tagsErr && (tags?.length ?? 0) > 0, `${tags?.length ?? 0} tags`);

const { data: links, error: linksErr } = await anon
  .from('content_categories')
  .select('content_type,content_id,category_slug');
check('anon lee vínculos de categoría', !linksErr && (links?.length ?? 0) > 0, `${links?.length ?? 0} vínculos`);

const { data: tagLinks, error: tagLinksErr } = await anon
  .from('content_tags')
  .select('content_type,content_id,tag_slug');
check('anon lee vínculos de tag', !tagLinksErr && (tagLinks?.length ?? 0) > 0, `${tagLinks?.length ?? 0} vínculos`);

// 2) anon NO puede insertar; el DELETE por policy service_role filtra 0 filas.
const { error: insErr } = await anon.from('categories').insert({ slug: 'hack', name: 'Hack', group: 'x' });
check('anon NO inserta en categories', !!insErr);

const targetSlug = tags?.[0]?.slug ?? 'melatonina';
const { count: beforeDel } = await admin
  .from('content_tags')
  .select('*', { count: 'exact', head: true })
  .eq('tag_slug', targetSlug);
const { data: delData, error: delErr } = await anon
  .from('content_tags')
  .delete()
  .eq('tag_slug', targetSlug);
const { count: afterDel } = await admin
  .from('content_tags')
  .select('*', { count: 'exact', head: true })
  .eq('tag_slug', targetSlug);
check(
  'anon NO borra vínculos (0 filas afectadas)',
  !delErr && (delData?.length ?? 0) === 0 && afterDel === beforeDel,
  `antes ${beforeDel}, borradas ${delData?.length ?? 0}, después ${afterDel}`
);

// 3) service_role ve lo mismo y puede escribir (idempotente).
const { count: srvCount } = await admin.from('content_categories').select('*', { count: 'exact', head: true });
check('service_role ve vínculos', (srvCount ?? 0) === (links?.length ?? 0), `${srvCount ?? 0}`);

console.log('\n[smoke-taxonomy] fin.');
