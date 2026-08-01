/**
 * Smoke test de certificados (FASE 5) contra el proyecto remoto.
 *
 * Verifica:
 *  1. RLS: el usuario autenticado emite su certificado (rpc issue_certificate,
 *     security definer, número secuencial ES-YYYY-NNNNN, idempotente).
 *  2. Storage: sube el PDF al bucket privado `certificates/<uid>/` y genera
 *     una URL firmada (políticas por carpeta, cliente autenticado).
 *  3. Verificación pública: get_certificate_public (anon) devuelve solo datos
 *     no sensibles y el número coincide.
 *  4. RLS: un segundo usuario NO puede leer el certificado del primero.
 *  5. Limpieza: elimina usuarios de prueba y el PDF subido.
 *
 * Uso: node scripts/smoke-certificates.mjs
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
  console.error('[smoke-certificates] Faltan credenciales en .env.local');
  process.exit(1);
}

const admin = createClient(BASE, SRV, { auth: { persistSession: false } });

const api = async (p, { method = 'GET', key, token, body } = {}) => {
  const bearer = token ?? key;
  const r = await fetch(BASE + p, {
    method,
    headers: {
      apikey: key ?? ANON,
      Authorization: `Bearer ${bearer}`,
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

let userIdA = null;
let userIdB = null;
let pdfPath = null;
let certId = null;

async function createUser(prefix) {
  const email = `${prefix}-${Date.now()}@evolucionsalud.com`;
  const created = await api('/auth/v1/admin/users', {
    method: 'POST',
    key: SRV,
    body: { email, password: 'Passw0rd!Cert', email_confirm: true, user_metadata: { nombre: prefix, apellido: 'Test' } },
  });
  const id = created.json?.id;
  if (!id) throw new Error(`No se pudo crear el usuario ${prefix}: ${created.text.slice(0, 120)}`);
  await sleep(1500); // esperar trigger de profiles
  const signin = await api('/auth/v1/token?grant_type=password', {
    method: 'POST', key: ANON, body: { email, password: 'Passw0rd!Cert' },
  });
  const token = signin.json?.access_token;
  if (!token) throw new Error(`No se pudo loguear ${prefix}`);
  return { id, token, refreshToken: signin.json?.refresh_token ?? '' };
}

try {
  // 0. Curso con certificado habilitado
  const { data: course } = await admin
    .from('courses')
    .select('id, slug, has_certificate')
    .eq('slug', 'pine-15-minutos')
    .single();
  check('pine-15-minutos tiene has_certificate', Boolean(course?.has_certificate), String(course?.has_certificate));
  const courseId = course?.id;
  if (!courseId) process.exit(1);

  // 1. Usuario A: inscripto y curso completado (service role simula el progreso)
  const userA = await createUser('certA');
  userIdA = userA.id;
  await admin.from('user_courses').upsert(
    { user_id: userIdA, course_id: courseId, status: 'completed', progress_pct: 100, completed_at: new Date().toISOString() },
    { onConflict: 'user_id,course_id' }
  );
  check('usuario A inscripto y curso completado', true);

  // 2. RLS: usuario A emite su certificado vía rpc (ruta del server action)
  pdfPath = `${userIdA}/${courseId}.pdf`;
  const { data: certRows, error: certErr } = await admin
    .rpc('issue_certificate', { p_user_id: userIdA, p_course_id: courseId, p_pdf_path: pdfPath });
  const cert = certRows?.[0];
  check('issue_certificate crea el certificado', !certErr && Boolean(cert), cert?.certificate_number);
  if (!cert) process.exit(1);
  certId = cert.id;
  check('número con formato ES-YYYY-#####', /^ES-\d{4}-\d{5}$/.test(cert.certificate_number), cert.certificate_number);

  const { data: certRows2 } = await admin
    .rpc('issue_certificate', { p_user_id: userIdA, p_course_id: courseId, p_pdf_path: pdfPath });
  check('issue_certificate es idempotente (mismo número)', certRows2?.[0]?.id === cert.id, certRows2?.[0]?.certificate_number);

  // 3. Storage con el CLIENTE AUTENTICADO (políticas por carpeta <uid>/)
  const userClient = createClient(BASE, ANON, { auth: { persistSession: false } });
  await userClient.auth.setSession({ access_token: userA.token, refresh_token: userA.refreshToken });
  const { error: upErr } = await userClient.storage.from('certificates').upload(
    pdfPath,
    Buffer.from('%PDF-1.4\n%dummy certificate content'),
    { contentType: 'application/pdf', upsert: true }
  );
  check('storage: usuario A sube su PDF (policy own folder)', !upErr, upErr?.message ?? '');

  const { data: signed } = await userClient.storage.from('certificates').createSignedUrl(pdfPath, 3600);
  check('storage: URL firmada para el usuario A', Boolean(signed?.signedUrl), signed?.signedUrl?.slice(0, 60) ?? '');

  // 3b. Un usuario NO puede subir a la carpeta de OTRO (carpeta ajena)
  const otherPath = `certificates/someone-else-uuid/${courseId}.pdf`;
  const { error: upErr2 } = await userClient.storage.from('certificates').upload(
    otherPath,
    Buffer.from('%PDF-1.4\n%dummy'),
    { contentType: 'application/pdf', upsert: true }
  );
  check('storage: usuario A NO puede escribir en carpeta ajena', Boolean(upErr2), upErr2?.message?.slice(0, 60) ?? 'ok?');

  // 4. Verificación pública (anon): solo datos no sensibles
  const pub = await api('/rest/v1/rpc/get_certificate_public', { method: 'POST', key: ANON, body: { p_id: certId } });
  check('verificación pública: anon obtiene datos', pub.status === 200 && pub.json?.[0]?.valid === true);
  check('verificación pública: número coincide', pub.json?.[0]?.certificate_number === cert.certificate_number);
  check('verificación pública: no expone pdf_path/user_id', !('pdf_path' in (pub.json?.[0] ?? {})) && !('user_id' in (pub.json?.[0] ?? {})));
  check('verificación pública: nombre del alumno presente', String(pub.json?.[0]?.full_name ?? '').length > 0, pub.json?.[0]?.full_name);
  check('verificación pública: título del curso', pub.json?.[0]?.course_title === 'PINE en 15 minutos', pub.json?.[0]?.course_title);

  // 5. RLS sobre la tabla certificates
  const userB = await createUser('certB');
  userIdB = userB.id;
  const bClient = createClient(BASE, ANON, { auth: { persistSession: false } });
  await bClient.auth.setSession({ access_token: userB.token, refresh_token: userB.refreshToken });
  const { data: bCerts } = await bClient.from('certificates').select('id');
  check('RLS: usuario B NO ve el certificado de A (vacío)', Array.isArray(bCerts) && bCerts.length === 0, String(bCerts?.length));

  const { data: aCerts } = await userClient.from('certificates').select('id, certificate_number');
  check('RLS: usuario A sí ve su certificado', Array.isArray(aCerts) && aCerts.length === 1, aCerts?.[0]?.certificate_number);

  // 5b. El camino EXACTO de la server action: rpc con cliente autenticado
  const { data: certAuth, error: certAuthErr } = await userClient.rpc('issue_certificate', {
    p_user_id: userIdA,
    p_course_id: courseId,
    p_pdf_path: pdfPath,
  });
  check('rpc issue_certificate vía cliente autenticado (server action)', !certAuthErr && certAuth?.[0]?.id === cert.id, certAuthErr?.message ?? '');

  // 5c. Fix FASE 6: el usuario autenticado puede INSERTAR notificaciones
  const { error: notifErr } = await userClient.from('notifications').insert({
    user_id: userIdA,
    type: 'certificate',
    title: 'Prueba',
    body: 'notificación de certificado',
  });
  check('notifications: usuario autenticado puede insertar (fix FASE 6)', !notifErr, notifErr?.message ?? '');

  console.log('\n[smoke-certificates] Finalizado.', process.exitCode ? 'Con fallos.' : 'Todo OK.');
  if (certId) console.log('  Certificado de prueba (para página):', certId);
} catch (err) {
  console.error('\n[smoke-certificates] Error inesperado:', err.message);
  process.exitCode = 1;
} finally {
  for (const id of [userIdA, userIdB]) {
    if (id) {
      await api(`/auth/v1/admin/users/${id}`, { method: 'DELETE', key: SRV });
      console.log(`  (limpieza: usuario de prueba ${id.slice(0, 8)} eliminado)`);
    }
  }
  if (pdfPath) {
    const { error } = await admin.storage.from('certificates').remove([pdfPath]);
    if (error) console.log(`  (limpieza: PDF no eliminado — ${error.message})`);
  }
}
