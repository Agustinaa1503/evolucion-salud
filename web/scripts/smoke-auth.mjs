/**
 * Smoke test de autenticación (FASE 1) contra el proyecto remoto.
 *
 * Verifica:
 *  1. El trigger de alta crea `profiles` y `user_settings` para un usuario nuevo.
 *  2. RLS: un usuario autenticado lee y actualiza su propio profile.
 *  3. RLS: el usuario NO puede escalar a admin (rol fijo).
 *  4. anon no puede leer la lista de profiles.
 *  5. Limpieza: elimina el usuario de prueba creado.
 *
 * Uso: node scripts/smoke-auth.mjs
 *   (lee NEXT_PUBLIC_SUPABASE_URL, anon y service_role de .env.local)
 */
import fs from 'fs';
import path from 'path';

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
  console.error('[smoke-auth] Faltan credenciales en .env.local');
  process.exit(1);
}

const email = `auth-test-${Date.now()}@evolucionsalud.com`;
const pass = 'Passw0rd!Auth';

const api = async (p, { method = 'GET', key, token, body } = {}) => {
  const bearer = token ?? key;
  const r = await fetch(BASE + p, {
    method,
    headers: {
      apikey: key ?? ANON,
      Authorization: `Bearer ${bearer}`,
      'Content-Type': 'application/json',
      ...(method === 'PATCH' ? { Prefer: 'return=representation' } : {}),
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

let userId;

try {
  // 1. Crear usuario de prueba (admin API, confirmado)
  const created = await api('/auth/v1/admin/users', {
    method: 'POST',
    key: SRV,
    body: { email, password: pass, email_confirm: true, user_metadata: { nombre: 'Ana', apellido: 'Prueba' } },
  });
  userId = created.json?.id;
  check('usuario de prueba creado', created.status === 201 || created.status === 200, userId ?? created.text.slice(0, 80));
  if (!userId) process.exit(1);

  // Esperar a que el trigger cree profiles
  await new Promise((r) => setTimeout(r, 1500));

  // 2. Profile creado por trigger
  const prof = await api(`/rest/v1/profiles?select=id,nombre,apellido,email,rol,estado&id=eq.${userId}`, { key: SRV });
  check('trigger creó profiles para el usuario', prof.status === 200 && prof.json?.length === 1, prof.json?.[0]?.rol);

  // 3. Sign in (obtener sesión)
  const signin = await api('/auth/v1/token?grant_type=password', { method: 'POST', key: ANON, body: { email, password: pass } });
  const token = signin.json?.access_token;
  check('login del usuario de prueba', Boolean(token));
  if (!token) process.exit(1);

  // 4. RLS: leer su propio profile con token de usuario
  const own = await api(`/rest/v1/profiles?select=id,nombre,rol,estado&id=eq.${userId}`, { key: ANON, token });
  check('RLS: usuario lee su propio profile', own.status === 200 && Array.isArray(own.json) && own.json.length === 1);

  // 5. RLS: intentar escalar a admin (debe FALLAR / 0 filas)
  const up = await api(`/rest/v1/profiles?id=eq.${userId}`, { method: 'PATCH', key: ANON, token, body: { rol: 'admin' } });
  check('RLS: update rol=admin (esperado 403 o 0)', up.status === 403 || up.status === 200 && up.json?.length === 0, up.text.slice(0, 120));

  // 6. RLS: actualizar nombre (debe FUNCIONAR)
  const upn = await api(`/rest/v1/profiles?id=eq.${userId}`, { method: 'PATCH', key: ANON, token, body: { nombre: 'Ana María' } });
  check('RLS: usuario actualiza su nombre', upn.status === 200, upn.text.slice(0, 120));

  // 7. anon intenta leer todos los profiles (debe devolver vacío)
  const anonAll = await api('/rest/v1/profiles?select=id', { key: ANON });
  check('anon NO lee la lista de profiles (vacío)', anonAll.status === 200 && Array.isArray(anonAll.json) && anonAll.json.length === 0);

  // 8. user_settings creado por trigger
  const s = await api(`/rest/v1/user_settings?select=user_id,receive_newsletter&user_id=eq.${userId}`, { key: SRV });
  check('trigger creó user_settings', s.status === 200 && s.json?.length === 1, s.text.slice(0, 120));

  console.log('\n[smoke-auth] Finalizado.', process.exitCode ? 'Con fallos.' : 'Todo OK.');
} catch (err) {
  console.error('\n[smoke-auth] Error inesperado:', err.message);
  process.exitCode = 1;
} finally {
  if (userId) {
    const del = await api(`/auth/v1/admin/users/${userId}`, { method: 'DELETE', key: SRV });
    console.log(`\n  (limpieza: usuario de prueba ${del.status === 200 ? 'eliminado' : 'no eliminado'})`);
  }
}
