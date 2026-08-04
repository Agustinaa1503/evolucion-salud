/**
 * Sincroniza los assets declarados de productos (`Contenido/product/*.md`) hacia
 * Supabase.
 *
 * La fuente de verdad es el front matter `assets:` de cada producto. Este
 * script upserta los metadatos en `product_assets` (PK product_slug +
 * asset_slug) sin tocar el estado de subida:
 *
 *  - `uploaded_at` / `storage_path` / `version` se PRESERVAN (el re-upload los
 *    cambia; el sync de metadatos no debe "des-subir" un archivo).
 *  - `title` / `file_name` / `mime` / `size_bytes` / `type` / `sort_order` se
 *    actualizan desde el Markdown.
 *  - Assets que ya no están en el Markdown y NUNCA fueron subidos se eliminan
 *    (huérfanos sin archivo). Los subidos se conservan como fila para no perder
 *    el objeto en Storage.
 *
 * Uso:  npm run db:sync-products
 *       (necesita NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY)
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { getAllContent } from '../lib/content/registry';
import { docToProduct } from '../lib/content/adapters';
import type { ProductAsset } from '../lib/content/types';

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
    '[sync-products] Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY. ' +
      'Completá web/.env.local y volvé a intentar.'
  );
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const now = new Date().toISOString();

async function syncProductAssets(productSlug: string, assets: ProductAsset[]): Promise<number> {
  // Estado actual en la BD (para preservar uploads).
  const { data: existing, error: listErr } = await sb
    .from('product_assets')
    .select('*')
    .eq('product_slug', productSlug);
  if (listErr) throw new Error(`list product_assets "${productSlug}": ${listErr.message}`);

  const byAssetSlug = new Map((existing ?? []).map((a) => [a.asset_slug, a]));
  const seen = new Set<string>();

  for (const [index, asset] of assets.entries()) {
    seen.add(asset.slug);
    const row = {
      product_slug: productSlug,
      asset_slug: asset.slug,
      title: asset.title,
      file_name: asset.fileName,
      mime: asset.mime,
      size_bytes: asset.sizeBytes,
      type: asset.type,
      sort_order: asset.sortOrder ?? index,
      version: 1,
      storage_path: null,
      uploaded_at: null,
      updated_at: now,
    };
    const prev = byAssetSlug.get(asset.slug);
    if (prev) {
      // Preservar el estado de subida y la versión.
      row.version = prev.version ?? 1;
      row.storage_path = prev.storage_path ?? null;
      row.uploaded_at = prev.uploaded_at ?? null;
      await sb.from('product_assets').update(row).eq('id', prev.id);
    } else {
      await sb.from('product_assets').insert(row);
    }
  }

  // Huérfanos: no declarados en el MD. Se borran solo si nunca fueron subidos
  // (si hay objeto en Storage, se conserva la fila para no perder la entrega).
  let cleaned = 0;
  for (const [slug, prev] of byAssetSlug) {
    if (!seen.has(slug)) {
      if (!prev.uploaded_at) {
        const { error: delErr } = await sb.from('product_assets').delete().eq('id', prev.id);
        if (!delErr) cleaned++;
      }
    }
  }
  return assets.length - cleaned;
}

async function main() {
  const docs = getAllContent('product');
  if (!docs.length) {
    console.error('[sync-products] No se encontraron productos en Contenido/product/');
    process.exit(1);
  }

  let totalAssets = 0;
  let totalCleaned = 0;
  let productsWithAssets = 0;

  for (const doc of docs) {
    const product = docToProduct(doc);
    const assets = product.assets ?? [];
    const processed = await syncProductAssets(product.slug, assets);
    if (assets.length > 0) {
      productsWithAssets++;
      console.log(`  ✔ ${product.slug} (${processed} assets)`);
    }
    totalAssets += processed;
    totalCleaned += assets.length - processed;
  }

  console.log(
    `[sync-products] OK: ${productsWithAssets} productos con assets, ` +
      `${totalAssets} assets sincronizados, ${totalCleaned} huérfanos sin upload limpiados.`
  );
}

main().catch((err) => {
  console.error('[sync-products] Error:', err?.message ?? err);
  process.exit(1);
});
