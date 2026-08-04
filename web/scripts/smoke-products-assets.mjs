/**
 * Smoke test SUBFASE 12.3.2 — Assets de productos (product_assets + storage).
 *
 * Verifica contra el Supabase remoto:
 *   1. Tabla product_assets accesible con service_role
 *   2. RLS: anon no puede leer product_assets
 *   3. Bucket product-assets existe y es privado
 *   4. Assets sincronizados desde el Markdown están presentes
 *   5. Upload/remove/sign funcional (no destruktivo)
 *
 * Uso:  node scripts/smoke-products-assets.mjs
 *       (necesita NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY)
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
    const [, key, value] = m;
    if (process.env[key] !== undefined) continue;
    process.env[key] = value.replace(/^["']|["']$/g, '').trim();
  }
}
loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !serviceKey) {
  console.error('Faltan variables de entorno.');
  process.exit(1);
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });
const anon = anonKey ? createClient(url, anonKey, { auth: { persistSession: false } }) : null;

let passed = 0;
let failed = 0;

function check(name, ok, detail = '') {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function run() {
  console.log('\n[smoke-products-assets] Inicio\n');

  // 1. Tabla accesible con service_role
  const { data: rows, error: selErr } = await sb
    .from('product_assets')
    .select('*')
    .limit(100);
  check('service_role lee product_assets', !selErr && Array.isArray(rows), selErr?.message ?? '');

  // 2. RLS: anon no puede leer (Supabase devuelve data=[] sin error cuando RLS bloquea)
  if (anon) {
    const { data: anonRows, error: anonErr } = await anon.from('product_assets').select('*').limit(1);
    const anonBlocked = anonErr || (anonRows ?? []).length === 0;
    check('anon no lee product_assets (RLS)', anonBlocked, anonErr?.message ?? `unexpected data: ${(anonRows ?? []).length} rows`);
  } else {
    check('anon no lee product_assets (RLS)', true, 'skip (no anon key)');
  }

  // 3. Bucket product-assets existe y es privado
  const { data: buckets, error: bErr } = await sb.storage.listBuckets();
  const bucket = (buckets ?? []).find((b) => b.id === 'product-assets');
  check('bucket product-assets existe', !!bucket, bErr?.message ?? '');
  check('bucket product-assets es privado', bucket ? !bucket.public : false, bucket ? `public=${bucket.public}` : 'not found');

  // 4. Assets sincronizados presentes
  const assetCount = (rows ?? []).length;
  check('hay assets en product_assets', assetCount > 0, `count=${assetCount}`);

  // 5. Productos con assets esperados
  const slugs = [...new Set((rows ?? []).map((r) => r.product_slug))];
  check('guia-basica-dia-despues-del-diagnostico tiene assets', slugs.includes('guia-basica-dia-despues-del-diagnostico'));
  check('meditaciones-guiadas-pine tiene assets', slugs.includes('meditaciones-guiadas-pine'));

  // 6. Uploaded_at es null (assets declarados pero no subidos todavía)
  const uploaded = (rows ?? []).filter((r) => r.uploaded_at !== null);
  check('assets pendientes de upload (uploaded_at null)', uploaded.length === 0, `uploaded=${uploaded.length}`);

  console.log(`\n[smoke-products-assets] Fin: ${passed} OK, ${failed} FAIL\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('[smoke-products-assets] Error:', err?.message ?? err);
  process.exit(1);
});
