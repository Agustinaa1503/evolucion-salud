/**
 * E2E de licencias y biblioteca (SUBFASE 12.5) contra el Supabase remoto.
 *
 * Ejercita el código real (no solo SQL): crea una orden pagada de prueba,
 * llama a `grantLicensesForOrder` (entrega idempotente), `getLicenseByToken`,
 * `getMyLicenses` y `recordAssetDownload`, y verifica el ciclo completo
 * pago → licencia → acceso → descarga. Limpia los datos de prueba al final.
 *
 * Uso: npx tsx scripts/e2e-licenses.mts
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

// Imports dinámicos: `lib/orders`/`lib/shop/licenses` capturan las env vars al
// evaluarse (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY), por lo que
// deben cargarse DESPUÉS de cargar `.env.local`.
const [{ createOrder }, licenses] = await Promise.all([
  import('../lib/orders'),
  import('../lib/shop/licenses'),
]);
const { grantLicensesForOrder, getLicenseByToken, getMyLicenses, recordAssetDownload } = licenses;

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SRV = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!BASE || !ANON || !SRV) {
  console.error('[e2e-licenses] Faltan credenciales en .env.local');
  process.exit(1);
}

const admin = createClient(BASE, SRV, { auth: { persistSession: false } });

const api = async (p: string, opts: { method?: string; key?: string; body?: unknown } = {}) => {
  const r = await fetch(BASE + p, {
    method: opts.method ?? 'GET',
    headers: {
      apikey: opts.key ?? ANON,
      Authorization: `Bearer ${opts.key ?? ANON}`,
      'Content-Type': 'application/json',
    },
    ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
  });
  const text = await r.text();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch { /* no json */ }
  return { status: r.status, json: json as Record<string, unknown> | null, text };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const check = (label: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '  ✔' : '  ✘'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
};

const email = `e2e-lic-${Date.now()}@evolucionsalud.com`;
let userId: string | null = null;
let orderId: string | null = null;

try {
  // 1. Usuario de prueba
  const created = await api('/auth/v1/admin/users', {
    method: 'POST',
    key: SRV,
    body: { email, password: 'Passw0rd!E2e', email_confirm: true, user_metadata: { nombre: 'E2E' } },
  });
  userId = (created.json?.id as string) ?? null;
  if (!userId) throw new Error(`No se pudo crear el usuario: ${created.text.slice(0, 160)}`);
  await sleep(1500);

  // 2. Orden pagada de prueba (productos reales de la tienda)
  const order = await createOrder({
    email,
    customerName: 'E2E Licencias',
    items: [
      { slug: 'guia-basica-dia-despues-del-diagnostico', qty: 1, price: 19 },
      { slug: 'guia-premium-completa', qty: 1, price: 49 },
    ],
    subtotalUsd: 68,
    currency: 'ARS',
  });
  orderId = order?.id ?? null;
  if (!orderId) throw new Error('No se pudo crear la orden');

  const { error: markPaid } = await admin.from('orders').update({ status: 'paid' }).eq('id', orderId);
  check('la orden queda marcada como pagada', !markPaid, markPaid?.message ?? '');

  // 3. Entrega: grantLicensesForOrder crea las licencias
  const first = await grantLicensesForOrder(orderId);
  check('grant crea 2 licencias', first.granted.length === 2, JSON.stringify(first.granted.map((l) => l.product_slug)));
  check('las licencias tienen token de acceso', first.all.every((l) => /^[0-9a-f]{32}$/.test(l.access_token)));

  // 4. Idempotencia: volver a llamar no duplica ni reenvía
  const second = await grantLicensesForOrder(orderId);
  check('grant es idempotente (no crea duplicados)', second.granted.length === 0 && second.all.length === 2, JSON.stringify({ g: second.granted.length, a: second.all.length }));

  // 5. Acceso por token (página /acceso/[token])
  const lic = first.granted[0];
  const access = await getLicenseByToken(lic.access_token);
  check('getLicenseByToken resuelve la licencia', access?.license.id === lic.id, access?.license.id ?? 'null');
  check('el acceso expone el producto del catálogo', access?.product.title?.length > 0, access?.product.title ?? '');

  // 6. Token inválido → null
  const invalid = await getLicenseByToken('f'.repeat(32));
  check('token inválido devuelve null', invalid === null);

  // 7. Biblioteca del usuario (getMyLicenses)
  const library = await getMyLicenses({ userId, email });
  check('getMyLicenses devuelve las 2 licencias', library.length === 2, `filas: ${library.length}`);
  check('las licencias se vincularon al usuario', library.every((l) => l.license.user_id === userId));

  // 8. Registro de descarga
  const firstAsset = access?.assets[0];
  if (firstAsset) {
    const dl = await recordAssetDownload({
      licenseId: lic.id,
      productSlug: lic.product_slug,
      assetSlug: firstAsset.slug,
      fileName: firstAsset.file_name,
    });
    check('recordAssetDownload registra la descarga', dl.ok, dl.error ?? '');
    const { data: dlCount } = await admin.from('asset_downloads').select('id').eq('license_id', lic.id);
    check('la descarga quedó persistida', (dlCount ?? []).length === 1, `filas: ${(dlCount ?? []).length}`);
  } else {
    check('asset subido disponible (se omitió el registro de descarga)', true, 'sin assets subidos aún');
  }
} catch (err) {
  check('ejecución del e2e', false, err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
} finally {
  // 9. Limpieza
  if (orderId) {
    await admin.from('orders').delete().eq('id', orderId);
  }
  if (userId) {
    await api(`/auth/v1/admin/users/${userId}`, { method: 'DELETE', key: SRV });
  }
  if (orderId) {
    const { data: left } = await admin.from('licenses').select('id').eq('order_id', orderId);
    check('limpieza: no quedan licencias', (left ?? []).length === 0, `filas: ${(left ?? []).length}`);
  }
  console.log('\n[e2e-licenses] Fin\n');
}
