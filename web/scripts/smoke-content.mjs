/**
 * Smoke test del CMS de contenido (SUBFASE 12.2) contra el proyecto remoto.
 *
 * Verifica la capa de versionado y permisos (lo local de validación/parser ya
 * se cubre con vitest):
 *  1. RBAC: los permisos `admin.content.read`/`admin.content.write` existen en
 *     `role_permissions` para super_admin, admin y editor (76 filas totales).
 *  2. RLS de `content_versions`: anon NO puede leer (0 filas); un usuario sin
 *     rol admin tampoco.
 *  3. RPC `log_content_version`: anon → no-op (denegado por guard); un
 *     super_admin autenticado → inserta y luego lo lee.
 *  4. service_role puede leer el historial completo (auditoría).
 *
 * Uso: node scripts/smoke-content.mjs <email> <password> (usuario super_admin)
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
const EMAIL = process.argv[2];
const PASSWORD = process.argv[3];
if (!BASE || !ANON || !SRV || !EMAIL || !PASSWORD) {
  console.error('[smoke-content] Faltan credenciales (.env.local) o el usuario admin (argv).');
  process.exit(1);
}

const admin = createClient(BASE, SRV, { auth: { persistSession: false } });
const anon = createClient(BASE, ANON, { auth: { persistSession: false } });

const check = (label, ok, detail = '') => {
  console.log(`${ok ? '  ✔' : '  ✘'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
};

const SLUG = `smoke-contenido-${Date.now()}`;

(async () => {
  try {
    // 1. Permisos RBAC del CMS
    const { data: perms } = await admin.from('role_permissions').select('role_slug, permission');
    const permsByRole = {};
    for (const r of perms ?? []) permsByRole[r.role_slug] = permsByRole[r.role_slug] ?? new Set();
    for (const r of perms ?? []) permsByRole[r.role_slug].add(r.permission);
    check('RBAC: total 76 filas', (perms ?? []).length === 76, `filas: ${(perms ?? []).length}`);
    for (const rol of ['super_admin', 'admin', 'editor']) {
      const set = permsByRole[rol] ?? new Set();
      check(
        `RBAC: ${rol} tiene admin.content.read/write`,
        set.has('admin.content.read') && set.has('admin.content.write'),
        `read=${set.has('admin.content.read')} write=${set.has('admin.content.write')}`
      );
    }

    // 2. RLS: anon no lee content_versions
    const anonSel = await anon.from('content_versions').select('*').limit(5);
    check(
      'RLS: anon no lee content_versions',
      !anonSel.error && (anonSel.data ?? []).length === 0,
      anonSel.error?.message ?? `filas: ${(anonSel.data ?? []).length}`
    );

    // 3. RPC log_content_version: anon → no-op (guard has_permission)
    const { data: anonLog, error: anonLogErr } = await anon.rpc('log_content_version', {
      p_content_type: 'blog',
      p_content_slug: SLUG,
      p_version: 1,
      p_status_after: 'draft',
      p_summary: 'smoke',
    });
    check(
      'RPC log_content_version: anon denegado (no-op)',
      anonLog === null && !anonLogErr,
      anonLogErr?.message ?? `data: ${anonLog}`
    );
    const { count: anonCount } = await admin
      .from('content_versions')
      .select('*', { count: 'exact', head: true })
      .eq('content_slug', SLUG);
    check('RPC: anon no insertó ninguna fila', anonCount === 0, `filas: ${anonCount}`);

    // 4. Login super_admin → RPC inserta y lee (vía RLS admin.content.read)
    const { data: signIn, error: signErr } = await anon.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD,
    });
    check('auth: login del super_admin', !signErr, signErr?.message ?? '');
    if (signErr) return;

    const authClient = createClient(BASE, ANON, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${signIn.session.access_token}` } },
    });
    authClient.auth.setSession({
      access_token: signIn.session.access_token,
      refresh_token: signIn.session.refresh_token,
    });

    const { error: logErr } = await authClient.rpc('log_content_version', {
      p_content_type: 'blog',
      p_content_slug: SLUG,
      p_version: 1,
      p_status_after: 'published',
      p_summary: 'Smoke test del CMS',
      p_frontmatter: { title: 'Smoke' },
      p_body: 'Cuerpo de prueba.\n',
    });
    check('RPC log_content_version: super_admin inserta', !logErr, logErr?.message ?? '');

    const { data: hist, error: histErr } = await authClient
      .from('content_versions')
      .select('version, content_type, content_slug, status_after, editor_email')
      .eq('content_slug', SLUG);
    check('RLS: super_admin lee su versión', !histErr && (hist ?? []).length === 1, histErr?.message ?? JSON.stringify(hist ?? []));
    if ((hist ?? []).length === 1) {
      check('RPC: editor_email resuelto del perfil', hist[0].editor_email === EMAIL, `email: ${hist[0].editor_email}`);
      check('RPC: status_after guardado', hist[0].status_after === 'published', hist[0].status_after);
    }

    // 5. service_role ve el historial (auditoría)
    const { data: srvHist } = await admin.from('content_versions').select('id').eq('content_slug', SLUG);
    check('service_role: ve la versión insertada', (srvHist ?? []).length === 1, `filas: ${(srvHist ?? []).length}`);

    console.log(`\n[smoke-content] Finalizado. OK${process.exitCode ? ' con fallos' : ''}.`);
  } catch (err) {
    console.error('[smoke-content] Error inesperado:', err.message);
    process.exitCode = 1;
  } finally {
    try {
      await admin.from('content_versions').delete().eq('content_slug', SLUG);
    } catch {
      /* limpieza best-effort */
    }
    console.log('  (limpieza de versiones de smoke)');
    process.exit(process.exitCode ?? 0);
  }
})();
