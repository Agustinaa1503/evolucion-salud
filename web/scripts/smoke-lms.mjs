/**
 * Smoke test del LMS (FASE 3) contra el proyecto remoto.
 *
 * Verifica:
 *  1. Catálogo sincronizado (courses, modules, lessons, quizzes).
 *  2. RLS: anon puede leer el catálogo pero NO las tablas de progreso.
 *  3. RLS: un usuario autenticado puede insertar/leer su propio progreso.
 *  4. Limpieza: elimina el usuario de prueba creado.
 *
 * Uso: node scripts/smoke-lms.mjs   (lee NEXT_PUBLIC_SUPABASE_URL, anon y service_role de .env.local)
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
  console.error('[smoke-lms] Faltan credenciales en .env.local');
  process.exit(1);
}

const email = `lms-test-${Date.now()}@evolucionsalud.com`;
const pass = 'Passw0rd!LMS';

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
  // 1. Catálogo sincronizado
  const courses = await api('/rest/v1/courses?select=id,slug,title,status', { key: SRV });
  check('catálogo: courses leídos con service_role', courses.status === 200 && Array.isArray(courses.json) && courses.json.length >= 3,
    courses.json?.map((c) => c.slug).join(', '));

  const lessons = await api('/rest/v1/course_lessons?select=id&limit=1', { key: SRV });
  check('catálogo: course_lessons accesibles', lessons.status === 200);

  const quizzes = await api('/rest/v1/course_quizzes?select=id&limit=1', { key: SRV });
  check('catálogo: course_quizzes accesibles', quizzes.status === 200);

  // 2. RLS catálogo: anon lee cursos (público)
  const anonCourses = await api('/rest/v1/courses?select=slug&limit=5', { key: ANON });
  check('RLS: anon lee catálogo de cursos', anonCourses.status === 200 && Array.isArray(anonCourses.json));

  // 2b. RLS: anon NO puede leer progreso
  const anonProgress = await api('/rest/v1/user_courses?select=id', { key: ANON });
  check('RLS: anon NO lee user_courses (vacío)', anonProgress.status === 200 && Array.isArray(anonProgress.json) && anonProgress.json.length === 0);

  // 3. Crear usuario de prueba (admin API)
  const created = await api('/auth/v1/admin/users', {
    method: 'POST',
    key: SRV,
    body: { email, password: pass, email_confirm: true, user_metadata: { nombre: 'LMS', apellido: 'Test' } },
  });
  userId = created.json?.id;
  check('usuario de prueba creado', created.status === 201 || created.status === 200, userId ?? created.text.slice(0, 80));
  if (!userId) process.exit(1);

  // Esperar a que el trigger cree profiles
  await new Promise((r) => setTimeout(r, 1500));

  const prof = await api(`/rest/v1/profiles?select=id,rol&id=eq.${userId}`, { key: SRV });
  check('trigger creó profiles para el usuario', prof.status === 200 && prof.json?.length === 1, prof.json?.[0]?.rol);

  // 4. Login del usuario de prueba
  const signin = await api('/auth/v1/token?grant_type=password', { method: 'POST', key: ANON, body: { email, password: pass } });
  const token = signin.json?.access_token;
  check('login del usuario de prueba', Boolean(token));

  // 5. RLS progreso: el usuario inserta y lee su propio user_courses
  const courseId = courses.json[0].id;
  const ins = await api('/rest/v1/user_courses', {
    method: 'POST',
    key: ANON,
    token,
    body: { user_id: userId, course_id: courseId, status: 'in_progress' },
  });
  check('RLS: usuario inserta su propio user_courses', ins.status === 201, String(ins.status));

  const own = await api(`/rest/v1/user_courses?select=id,status&user_id=eq.${userId}`, { key: ANON, token });
  // Nota: la petición usa la sesión del usuario (el user_id del row coincide con auth.uid()).
  const ownJson = own.json;
  check('RLS: usuario lee su propio user_courses', own.status === 200 && Array.isArray(ownJson) && ownJson.length === 1, JSON.stringify(ownJson));

  // 5b. El usuario NO puede leer el progreso de otro usuario (probamos con un id inexistente)
  const other = await api('/rest/v1/user_courses?select=id&user_id=neq.' + userId, { key: ANON, token });
  check('RLS: usuario NO ve progreso ajeno (vacío)', other.status === 200 && other.json?.length === 0);

  console.log('\n[smoke-lms] Finalizado.', process.exitCode ? 'Con fallos.' : 'Todo OK.');
} catch (err) {
  console.error('\n[smoke-lms] Error inesperado:', err.message);
  process.exitCode = 1;
} finally {
  if (userId) {
    const del = await api(`/auth/v1/admin/users/${userId}`, { method: 'DELETE', key: SRV });
    console.log(`\n  (limpieza: usuario de prueba ${del.status === 200 ? 'eliminado' : 'no eliminado'})`);
  }
}
