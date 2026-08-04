/**
 * Smoke test de licencias y biblioteca (SUBFASE 12.5) contra el proyecto remoto.
 *
 * Verifica:
 *  1. service_role lee licenses / asset_downloads.
 *  2. RLS: anon no lee licenses; el usuario A lee solo las suyas y B no ve las de A.
 *  3. Unique (order_id, product_slug) y (access_token) impiden duplicados.
 *  4. asset_downloads se registra y queda ligado a la licencia.
 *  5. Limpieza: elimina órdenes (cascada), downloads y usuarios de prueba.
 *
 * Uso: node scripts/smoke-licenses.mjs
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
  console.error('[smoke-licenses] Faltan credenciales en .env.local');
  process.exit(1);
}

const admin = createClient(BASE, SRV, { auth: { persistSession: false } });
const anon = createClient(BASE, ANON, { auth: { persistSession: false } });

const api = async (p, { method = 'GET', key, token, body } = {}) => {
  const r = await fetch(BASE + p, {
    method,
    headers: {
      apikey: key ?? ANON,
      Authorization: `Bearer ${token ?? key}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* no json */ }
  return { status: r.status, json, text };
};

const check = (label, ok, detail = '') => {
  console.log(`${ok ? '  ✔' : '  ✘'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function createUser(prefix) {
  const email = `${prefix}-${Date.now()}@evolucionsalud.com`;
  const created = await api('/auth/v1/admin/users', {
    method: 'POST',
    key: SRV,
    body: { email, password: 'Passw0rd!Lic', email_confirm: true, user_metadata: { nombre: prefix } },
  });
  const id = created.json?.id;
  if (!id) throw new Error(`No se pudo crear ${prefix}: ${created.text.slice(0, 120)}`);
  await sleep(1500);
  const signin = await api('/auth/v1/token?grant_type=password', {
    method: 'POST',
    key: ANON,
    body: { email, password: 'Passw0rd!Lic' },
  });
  const token = signin.json?.access_token;
  if (!token) throw new Error(`No se pudo loguear ${prefix}`);
  return { id, token, email, refreshToken: signin.json?.refresh_token ?? '' };
}

const seededOrders = [];
const seededUsers = [];

try {
  // 1. Tablas accesibles con service_role
  const { data: licRows, error: licErr } = await admin.from('licenses').select('id').limit(1);
  check('service_role lee licenses', !licErr, licErr?.message ?? '');
  const { data: dlRows, error: dlErr } = await admin.from('asset_downloads').select('id').limit(1);
  check('service_role lee asset_downloads', !dlErr, dlErr?.message ?? '');

  // 2. RLS: anon no lee licenses
  const { data: anonRows, error: anonErr } = await anon.from('licenses').select('id').limit(1);
  check('anon no lee licenses (RLS)', anonErr || (anonRows ?? []).length === 0, anonErr?.message ?? `filas: ${(anonRows ?? []).length}`);

  // 3. Orden de prueba pagada + licencias
  const userA = await createUser('licA');
  const userB = await createUser('licB');
  seededUsers.push(userA.id, userB.id);

  const { data: order } = await admin
    .from('orders')
    .insert({
      email: userA.email,
      customer_name: 'Cliente A',
      items: [
        { slug: 'guia-basica', qty: 1, price: 19 },
        { slug: 'guia-premium', qty: 1, price: 49 },
      ],
      subtotal: 68,
      payment_method: 'mercadopago',
      currency: 'ARS',
      status: 'paid',
    })
    .select('id')
    .single();
  if (!order?.id) throw new Error('No se pudo crear la orden de prueba');
  seededOrders.push(order.id);

  const tokenA = 'a'.repeat(32);
  const tokenB = 'b'.repeat(32);
  const { data: inserted } = await admin
    .from('licenses')
    .insert([
      { email: userA.email, user_id: userA.id, order_id: order.id, product_slug: 'guia-basica', product_title: 'Guía Básica', access_token: tokenA },
      { email: userA.email, user_id: userA.id, order_id: order.id, product_slug: 'guia-premium', product_title: 'Guía Premium', access_token: tokenB },
    ])
    .select('id, product_slug, access_token');
  check('se insertan las licencias de la orden', !inserted || inserted.length === 2, JSON.stringify(inserted ?? null));

  // 4. Unique (order_id, product_slug)
  const dup = await admin
    .from('licenses')
    .insert({ email: userA.email, order_id: order.id, product_slug: 'guia-basica', product_title: 'Guía Básica', access_token: 'c'.repeat(32) });
  check('unique (order_id, product_slug) impide duplicar', Boolean(dup.error), dup.error?.code ?? 'debería fallar');

  // 5. Unique (access_token)
  const dupToken = await admin
    .from('licenses')
    .insert({ email: userA.email, order_id: order.id, product_slug: 'otro', product_title: 'Otro', access_token: tokenA });
  check('unique (access_token) impide duplicar', Boolean(dupToken.error), dupToken.error?.code ?? 'debería fallar');

  // 6. RLS: A lee sus licencias, B no
  const clientA = createClient(BASE, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  await clientA.auth.setSession({ access_token: userA.token, refresh_token: userA.refreshToken });
  await clientA.auth.getUser();
  const { data: ownA } = await clientA.from('licenses').select('id').eq('status', 'active');
  check('A ve sus licencias (RLS own)', (ownA ?? []).length === 2, `filas: ${(ownA ?? []).length}`);

  const clientB = createClient(BASE, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  await clientB.auth.setSession({ access_token: userB.token, refresh_token: userB.refreshToken });
  await clientB.auth.getUser();
  const { data: ownB } = await clientB.from('licenses').select('id');
  check('B no ve las licencias de A (RLS)', (ownB ?? []).length === 0, `filas: ${(ownB ?? []).length}`);

  // 7. Buscar por token (flujo de /acceso/[token])
  const { data: byToken } = await admin
    .from('licenses')
    .select('id, product_slug, status')
    .eq('access_token', tokenA)
    .eq('status', 'active')
    .maybeSingle();
  check('licencia recuperable por token', byToken?.product_slug === 'guia-basica', JSON.stringify(byToken ?? null));

  // 8. asset_downloads ligado a la licencia
  const licA = inserted?.[0];
  const { error: dlIns } = await admin.from('asset_downloads').insert({
    license_id: licA?.id,
    product_slug: 'guia-basica',
    asset_slug: 'archivo',
    file_name: 'guia-basica.pdf',
  });
  check('se registra una descarga', !dlIns, dlIns?.message ?? '');
  const { data: dlRead } = await admin
    .from('asset_downloads')
    .select('id, license_id')
    .eq('license_id', licA?.id);
  check('descarga ligada a la licencia', (dlRead ?? []).length === 1, `filas: ${(dlRead ?? []).length}`);

  // 9. La descarga queda ligada al usuario vía licencia (JOIN RLS por email)
  const { data: dlJoin } = await clientA
    .from('licenses')
    .select('id, asset_downloads(file_name)')
    .eq('id', licA?.id);
  check('RLS permite leer descargas de la licencia propia', Boolean(dlJoin?.[0]?.asset_downloads?.length), JSON.stringify(dlJoin ?? null));
} catch (err) {
  check('ejecución del smoke', false, err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
} finally {
  // 10. Limpieza
  for (const id of seededOrders) {
    await admin.from('orders').delete().eq('id', id);
  }
  for (const id of seededUsers) {
    await api(`/auth/v1/admin/users/${id}`, { method: 'DELETE', key: SRV });
  }
  const { data: left } = await admin.from('licenses').select('id').in('order_id', seededOrders);
  check('limpieza: no quedan licencias huérfanas', (left ?? []).length === 0, `filas: ${(left ?? []).length}`);
  console.log('\n[smoke-licenses] Fin\n');
}
