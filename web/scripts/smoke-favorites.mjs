/**
 * Smoke test de favoritos (FASE 8) contra el proyecto remoto.
 *
 * Verifica:
 *  1. El usuario A puede marcar un curso como favorito (insert own).
 *  2. RLS: el usuario B NO ve ni borra los favoritos de A.
 *  3. La PK (user_id, course_id) evita duplicar el mismo favorito.
 *  4. Limpieza: elimina favoritos y usuarios de prueba.
 *
 * Uso: node scripts/smoke-favorites.mjs
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
  console.error('[smoke-favorites] Faltan credenciales en .env.local');
  process.exit(1);
}

const admin = createClient(BASE, SRV, { auth: { persistSession: false } });

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

let userA = null;
let userB = null;

async function createUser(prefix) {
  const email = `${prefix}-${Date.now()}@evolucionsalud.com`;
  const created = await api('/auth/v1/admin/users', {
    method: 'POST',
    key: SRV,
    body: { email, password: 'Passw0rd!Fav', email_confirm: true, user_metadata: { nombre: prefix } },
  });
  const id = created.json?.id;
  if (!id) throw new Error(`No se pudo crear ${prefix}: ${created.text.slice(0, 120)}`);
  await sleep(1500);
  const signin = await api('/auth/v1/token?grant_type=password', {
    method: 'POST',
    key: ANON,
    body: { email, password: 'Passw0rd!Fav' },
  });
  const token = signin.json?.access_token;
  if (!token) throw new Error(`No se pudo loguear ${prefix}`);
  return { id, token, email, refreshToken: signin.json?.refresh_token ?? '' };
}

try {
  userA = await createUser('favA');
  userB = await createUser('favB');

  const { data: courses } = await admin.from('courses').select('id, slug').limit(2);
  const courseA = courses?.[0];
  if (!courseA) throw new Error('No hay cursos en el catálogo');

  const clientA = createClient(BASE, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  await clientA.auth.setSession({
    access_token: userA.token,
    refresh_token: userA.refreshToken,
  });
  await clientA.auth.getUser();
  const clientB = createClient(BASE, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  await clientB.auth.setSession({
    access_token: userB.token,
    refresh_token: userB.refreshToken,
  });
  await clientB.auth.getUser();

  // 1. A marca el curso como favorito
  const ins = await clientA.from('user_favorites').insert({ user_id: userA.id, course_id: courseA.id });
  check('A puede marcar su favorito', !ins.error, ins.error?.message ?? '');

  // 2. Duplicar el mismo favorito falla por PK
  const dup = await clientA.from('user_favorites').insert({ user_id: userA.id, course_id: courseA.id });
  check('PK impide duplicar el favorito', Boolean(dup.error), dup.error?.code ?? 'debería fallar');

  // 3. B no ve los favoritos de A
  const bRead = await clientB
    .from('user_favorites')
    .select('course_id')
    .eq('user_id', userA.id);
  const bReadOk = !bRead.error && (bRead.data ?? []).length === 0;
  check('B NO ve los favoritos de A', bReadOk, `se esperaban 0 filas, hay ${(bRead.data ?? []).length}`);

  // 4. B no puede borrar los favoritos de A (su delete no afecta filas de A)
  const bDel = await clientB.from('user_favorites').delete().eq('user_id', userA.id);
  const aAfter = await clientA.from('user_favorites').select('course_id').eq('user_id', userA.id);
  const stillThere = !bDel.error && !aAfter.error && (aAfter.data ?? []).length === 1;
  check('B NO puede borrar los favoritos de A', stillThere, '');

  // 5. A sí los ve
  const aRead = await clientA.from('user_favorites').select('course_id').eq('user_id', userA.id);
  check(
    'A sí ve su favorito',
    !aRead.error && (aRead.data ?? []).length === 1,
    `hay ${(aRead.data ?? []).length}`
  );

  // 6. A borra su favorito
  const aDel = await clientA.from('user_favorites').delete().eq('user_id', userA.id);
  const aEmpty = await clientA.from('user_favorites').select('course_id').eq('user_id', userA.id);
  check('A puede quitar su favorito', !aDel.error && (aEmpty.data ?? []).length === 0, '');

  console.log(
    `\n[smoke-favorites] Finalizado. OK${process.exitCode ? ' con fallos' : ''}.`
  );
} catch (err) {
  console.error('[smoke-favorites] Error inesperado:', err.message);
  process.exitCode = 1;
} finally {
  for (const u of [userA, userB]) {
    if (u?.id) {
      await api(`/auth/v1/admin/users/${u.id}`, { method: 'DELETE', key: SRV });
    }
  }
  console.log('  (limpieza: usuarios de prueba eliminados)');
  process.exit(process.exitCode ?? 0);
}
