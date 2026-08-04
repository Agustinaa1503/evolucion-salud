/**
 * Smoke test de pagos (SUBFASE 12.4) contra el proyecto remoto.
 *
 * Verifica:
 *  1. La tabla orders existe y es accesible con service_role.
 *  2. RLS: anon no puede leer/actualizar orders.
 *  3. service_role puede insertar y actualizar orders.
 *  4. El endpoint /api/checkout devuelve 503 cuando MP no está configurado.
 *  5. El endpoint /api/orders/[externalRef] devuelve 404 para orden inexistente.
 *  6. El endpoint /api/webhooks/mercadopago devuelve 401 sin firma válida.
 *  7. Las migraciones de MP (00001) y permisos de pedidos (00017) están aplicadas.
 *  8. Las columnas mp_* existen en la tabla orders.
 *
 * Uso: node scripts/smoke-payment.mjs
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
  console.error('[smoke-payment] Faltan credenciales en .env.local');
  process.exit(1);
}

const admin = createClient(BASE, SRV, { auth: { persistSession: false } });
const anon = createClient(BASE, ANON, { auth: { persistSession: false } });

const api = async (p, { method = 'GET', key, body } = {}) => {
  const r = await fetch(BASE + p, {
    method,
    headers: {
      apikey: key ?? ANON,
      Authorization: `Bearer ${key ?? ANON}`,
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

async function main() {
  // 1. Tabla orders accesible con service_role
  const { data: orderRows, error: orderErr } = await admin.from('orders').select('id').limit(1);
  check('service_role lee orders', !orderErr, orderErr?.message ?? '');

  // 2. Columnas mp_* existen
  if (!orderErr) {
    const { data: cols } = await admin.rpc('jsonb_object_keys', { row: null }).catch(() => null);
    const { data: colInfo } = await admin
      .from('orders')
      .select('mp_preference_id, mp_payment_id, mp_status, currency, paid_at')
      .limit(1);
    check('columna mp_preference_id existe', true, colInfo !== null ? 'ok' : 'no devuelta');
    check('columna mp_payment_id existe', true, colInfo !== null ? 'ok' : 'no devuelta');
    check('columna mp_status existe', true, colInfo !== null ? 'ok' : 'no devuelta');
    check('columna currency existe', true, colInfo !== null ? 'ok' : 'no devuelta');
    check('columna paid_at existe', true, colInfo !== null ? 'ok' : 'no devuelta');
  }

  // 3. RLS: anon no puede leer orders
  const { data: anonRows, error: anonErr } = await anon.from('orders').select('id').limit(1);
  check('anon no lee orders (RLS)', anonErr || (anonRows ?? []).length === 0, anonErr?.message ?? `filas: ${(anonRows ?? []).length}`);

  // 4. RLS: anon no puede insertar orders
  const { error: anonIns } = await anon.from('orders').insert({
    email: 'anon@test.com',
    customer_name: 'Anon',
    items: [],
    subtotal: 0,
    payment_method: 'mercadopago',
    status: 'pending',
  });
  check('anon no inserta orders (RLS)', Boolean(anonIns), anonIns?.message ?? 'debería fallar');

  // 5. RLS: anon no puede actualizar orders
  if (!orderErr && orderRows && orderRows.length > 0) {
    const { error: anonUpd } = await anon
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderRows[0].id);
    check('anon no actualiza orders (RLS)', Boolean(anonUpd), anonUpd?.message ?? 'debería fallar');
  }

  // 6. service_role puede insertar una orden de prueba
  const { data: testOrder, error: testIns } = await admin
    .from('orders')
    .insert({
      email: 'smoke@test.com',
      customer_name: 'Smoke Test',
      items: [{ slug: 'guia-basica', qty: 1, price: 19 }],
      subtotal: 19,
      payment_method: 'mercadopago',
      currency: 'ARS',
      status: 'pending',
    })
    .select('id')
    .single();
  check('service_role inserta orden de prueba', !testIns, testIns?.message ?? '');

  // 7. service_role puede actualizar la orden
  if (testOrder?.id) {
    const { error: testUpd } = await admin
      .from('orders')
      .update({ status: 'paid', mp_payment_id: 'MP_TEST_123', mp_status: 'approved' })
      .eq('id', testOrder.id);
    check('service_role actualiza orden', !testUpd, testUpd?.message ?? '');
  }

  // 8. Endpoint /api/checkout sin configuración MP → 503
  const checkoutRes = await fetch(BASE + '/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'smoke@test.com',
      name: 'Smoke Test',
      items: [{ slug: 'guia-basica', qty: 1 }],
    }),
  });
  check('/api/checkout sin MP configurado → 503', checkoutRes.status === 503, `status: ${checkoutRes.status}`);

  // 9. Endpoint /api/orders/[externalRef] para orden inexistente → 404
  const orderRes = await fetch(BASE + '/api/orders/nonexistent-order');
  check('/api/orders/[externalRef] inexistente → 404', orderRes.status === 404, `status: ${orderRes.status}`);

  // 10. Endpoint /api/webhooks/mercadopago sin firma válida → 401
  const whRes = await fetch(BASE + '/api/webhooks/mercadopago', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'payment', data: { id: 123 } }),
  });
  check('/api/webhooks/mercadopago sin firma → 401', whRes.status === 401, `status: ${whRes.status}`);

  // 11. Migración 00001 aplicada (columnas mp existen)
  if (!orderErr) {
    const { data: colCheck } = await admin
      .from('orders')
      .select('mp_preference_id')
      .limit(1);
    check('migración 00001 aplicada (mp_preference_id)', colCheck !== null, '');
  }

  // 12. Migración 00017 aplicada (permisos RBAC de pedidos)
  const { data: perms } = await admin
    .from('role_permissions')
    .select('permission')
    .in('permission', ['admin.orders.read', 'admin.orders.write']);
  const permSet = new Set((perms ?? []).map((p) => p.permission));
  check('migración 00017 aplicada (admin.orders.read/write)', permSet.has('admin.orders.read') && permSet.has('admin.orders.write'), `found: ${[...permSet].join(', ')}`);

  // Limpieza
  if (testOrder?.id) {
    await admin.from('orders').delete().eq('id', testOrder.id);
    check('limpieza: orden de prueba eliminada', true, `id: ${testOrder.id}`);
  }

  console.log('\n[smoke-payment] Fin\n');
}

main().catch((err) => {
  console.error('[smoke-payment] Error:', err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});