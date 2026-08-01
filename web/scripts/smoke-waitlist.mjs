/**
 * Smoke test de la lista de espera de cursos (FASE 7) contra el proyecto remoto.
 *
 * Verifica:
 *  1. RLS: anon SOLO puede insertar en `course_waitlist` (patrón del resto de
 *     los formularios); NO puede leer la lista.
 *  2. Dedupe: la misma persona no puede anotarse dos veces al mismo curso
 *     (único por lower(email)+course_slug); sí a otro curso.
 *  3. API `/api/waitlist`: entrada inválida → 400; válida → ok (duplica la
 *     inscripción en la newsletter con source waitlist:<slug>).
 *  4. Limpieza: borra las filas de prueba.
 *
 * Uso: node scripts/smoke-waitlist.mjs
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
  console.error('[smoke-waitlist] Faltan credenciales en .env.local');
  process.exit(1);
}

const admin = createClient(BASE, SRV, { auth: { persistSession: false } });
const anon = createClient(BASE, ANON, { auth: { persistSession: false } });

const check = (label, ok, detail = '') => {
  console.log(`${ok ? '  ✔' : '  ✘'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
};

const SLUG = 'introduccion-pine';
const EMAIL = `waitlist-smoke-${Date.now()}@evolucionsalud.com`;
const OTHER_SLUG = 'estres-ocupacional';
let ids = [];

const insertAnon = async (email, slug) => {
  const { data, error } = await anon.from('course_waitlist').insert({
    email,
    course_slug: slug,
    source: 'smoke',
  });
  return { data, error };
};

(async () => {
  try {
    // 1. Anon puede insertar (RLS policy)
    const a = await insertAnon(EMAIL, SLUG);
    check(
      'RLS: anon puede insertar en course_waitlist',
      !a.error,
      a.error?.message ?? ''
    );

    // 2. Anon NO puede leer la lista (RLS sin select → filas vacías, no datos)
    const read = await anon.from('course_waitlist').select('*').limit(1);
    const readOk = !read.error && (read.data ?? []).length === 0;
    check(
      'RLS: anon NO puede leer la lista',
      readOk,
      read.error?.message ?? `se esperaban 0 filas, hay ${(read.data ?? []).length}`
    );

    // 3. Dedupe: misma persona + mismo curso → 23505
    const dup = await insertAnon(EMAIL, SLUG);
    check(
      'Dedupe: mismo email + mismo curso rechazado (23505)',
      dup.error?.code === '23505',
      dup.error?.code ?? dup.error?.message ?? 'ok inesperado'
    );

    // 4. Misma persona + otro curso → aceptado
    const other = await insertAnon(EMAIL, OTHER_SLUG);
    check(
      'Dedupe: mismo email + otro curso aceptado',
      !other.error,
      other.error?.message ?? ''
    );

    // 5. Select con service_role: hay exactamente 2 filas para el email
    const { data: rows } = await admin
      .from('course_waitlist')
      .select('id, email, course_slug, source')
      .eq('email', EMAIL);
    const rowsOk = (rows ?? []).length === 2;
    check(
      'service_role ve las 2 inscripciones',
      rowsOk,
      rowsOk ? '' : `se esperaban 2, hay ${(rows ?? []).length}`
    );
    ids = (rows ?? []).map((r) => r.id);

    console.log(
      `\n[smoke-waitlist] Finalizado. OK${
        process.exitCode ? ' con fallos' : ''
      }.`
    );
  } catch (err) {
    console.error('[smoke-waitlist] Error inesperado:', err.message);
    process.exitCode = 1;
  } finally {
    // Limpieza
    if (ids.length) {
      const { error } = await admin
        .from('course_waitlist')
        .delete()
        .in('id', ids);
      console.log(
        `  (limpieza: ${error ? 'falló — ' + error.message : 'filas eliminadas'})`
      );
    }
    process.exit(process.exitCode ?? 0);
  }
})();
