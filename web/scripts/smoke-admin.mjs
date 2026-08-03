/**
 * Smoke test del BackOffice (FASE 11) contra el proyecto remoto.
 *
 * Verifica:
 *  1. RBAC: la tabla `role_permissions` tiene la matriz esperada por rol
 *     (24 super_admin / 23 admin / 16 editor / 7 teacher; student y guest sin
 *     permisos de BackOffice). Total 70.
 *  2. RPC `has_permission`: anon → false (sin perfil); super_admin → true.
 *     RPC `current_role`: anon → null; super_admin → 'super_admin'.
 *  3. RLS: anon NO ve `admin_audit_logs`, `backoffice_settings` ni
 *     `newsletter_segments` (0 filas).
 *  4. RPC `log_admin_event`: anon denegado (sin grant); super_admin inserta.
 *  5. `backoffice_settings`: service_role escribe/lee; anon no.
 *  6. `newsletter_segments`: service_role ve los 5 segmentos precargados.
 *  7. Trigger `on_admin_sign_in`: al iniciar sesión un admin se registra
 *     un evento `login` en `admin_audit_logs`.
 *
 * Uso: node scripts/smoke-admin.mjs <email> <password> (usuario super_admin)
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
  console.error('[smoke-admin] Faltan credenciales (.env.local) o el usuario admin (argv).');
  process.exit(1);
}

const admin = createClient(BASE, SRV, { auth: { persistSession: false } });
const anon = createClient(BASE, ANON, { auth: { persistSession: false } });

const check = (label, ok, detail = '') => {
  console.log(`${ok ? '  ✔' : '  ✘'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
};

const EXPECTED_COUNTS = { super_admin: 24, admin: 23, editor: 16, teacher: 7 };

(async () => {
  let adminUid = null;
  try {
    // 1. Matriz RBAC en la BD
    const { data: perms, error: permsErr } = await admin
      .from('role_permissions')
      .select('role_slug, permission');
    check('RBAC: se leen role_permissions', !permsErr, permsErr?.message ?? '');
    const byRole = {};
    for (const r of perms ?? []) byRole[r.role_slug] = (byRole[r.role_slug] ?? 0) + 1;
    let matrixOk = (perms ?? []).length === 70;
    for (const [rol, n] of Object.entries(EXPECTED_COUNTS)) {
      if (byRole[rol] !== n) matrixOk = false;
    }
    check('RBAC: matriz de permisos (70 filas)', matrixOk, JSON.stringify(byRole));
    check(
      'RBAC: student/guest sin permisos',
      (byRole['student'] ?? 0) === 0 && (byRole['guest'] ?? 0) === 0
    );

    // 2. RPCs con anon (debe negar)
    const { data: anonRole } = await anon.rpc('current_role');
    check('RPC current_role: anon → null', anonRole === null, `recibido: ${anonRole}`);
    const { data: anonPerm } = await anon.rpc('has_permission', { p_permission: 'admin.access' });
    check('RPC has_permission: anon → false', anonPerm === false, `recibido: ${anonPerm}`);

    // 3. RLS lectura con anon → 0 filas
    const logsAnon = await anon.from('admin_audit_logs').select('*').limit(1);
    check(
      'RLS: anon no ve admin_audit_logs',
      !logsAnon.error && (logsAnon.data ?? []).length === 0,
      logsAnon.error?.message ?? `filas: ${(logsAnon.data ?? []).length}`
    );
    const settAnon = await anon.from('backoffice_settings').select('*').limit(1);
    check(
      'RLS: anon no ve backoffice_settings',
      !settAnon.error && (settAnon.data ?? []).length === 0,
      settAnon.error?.message ?? `filas: ${(settAnon.data ?? []).length}`
    );
    const segAnon = await anon.from('newsletter_segments').select('*').limit(1);
    check(
      'RLS: anon no ve newsletter_segments',
      !segAnon.error && (segAnon.data ?? []).length === 0,
      segAnon.error?.message ?? `filas: ${(segAnon.data ?? []).length}`
    );

    // 4. RPC log_admin_event con anon → denegado (sin grant)
    const { error: anonLog } = await anon.rpc('log_admin_event', {
      p_action: 'error',
      p_category: 'system',
    });
    check(
      'RPC log_admin_event: anon denegado',
      !!anonLog,
      anonLog?.message ?? 'no debería poder insertar'
    );

    // 5. service_role escribe y lee backoffice_settings
    const KEY = `smoke-${Date.now()}`;
    const { error: upsErr } = await admin.from('backoffice_settings').upsert(
      { key: KEY, value: { prueba: true } },
      { onConflict: 'key' }
    );
    check('backoffice_settings: service_role upsert', !upsErr, upsErr?.message ?? '');
    const { data: settRead } = await admin
      .from('backoffice_settings')
      .select('key, value')
      .eq('key', KEY);
    check(
      'backoffice_settings: service_role lee lo escrito',
      (settRead ?? []).length === 1,
      JSON.stringify(settRead ?? [])
    );

    // 6. newsletter_segments precargados (5)
    const { data: segs, error: segErr } = await admin.from('newsletter_segments').select('id');
    check('newsletter_segments: 5 segmentos', !segErr && (segs ?? []).length === 5, `filas: ${(segs ?? []).length}`);

    // 7. Login del super_admin: RPCs con rol + trigger de auditoría
    const { data: signIn, error: signErr } = await anon.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD,
    });
    check('auth: login del super_admin', !signErr, signErr?.message ?? '');
    if (signErr) return;

    adminUid = signIn.user.id;
    const authClient = createClient(BASE, ANON, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${signIn.session.access_token}` } },
    });
    authClient.auth.setSession({ access_token: signIn.session.access_token, refresh_token: signIn.session.refresh_token });

    const { data: role } = await authClient.rpc('current_role');
    check('RPC current_role: super_admin autenticado', role === 'super_admin', `recibido: ${role}`);
    const { data: canAccess } = await authClient.rpc('has_permission', { p_permission: 'admin.access' });
    const { data: canDelete } = await authClient.rpc('has_permission', { p_permission: 'admin.users.delete' });
    check('RPC has_permission: admin.access → true', canAccess === true, `recibido: ${canAccess}`);
    check('RPC has_permission: admin.users.delete → true', canDelete === true, `recibido: ${canDelete}`);

    // 8. Autenticado con permiso puede insertar en auditoría vía RPC
    const { error: authLogErr } = await authClient.rpc('log_admin_event', {
      p_action: 'admin_change',
      p_category: 'system',
      p_target_type: 'user',
      p_target_id: adminUid,
      p_detail: { smoke: true },
    });
    check('RPC log_admin_event: super_admin inserta', !authLogErr, authLogErr?.message ?? '');

    // 9. Trigger on_admin_sign_in registró el login
    await new Promise((r) => setTimeout(r, 800));
    const { data: loginLogs } = await admin
      .from('admin_audit_logs')
      .select('id, action, category')
      .eq('user_id', adminUid)
      .eq('action', 'login');
    check(
      'Trigger: login del admin auditado',
      (loginLogs ?? []).length >= 1,
      `eventos: ${(loginLogs ?? []).length}`
    );

    console.log(`\n[smoke-admin] Finalizado. OK${process.exitCode ? ' con fallos' : ''}.`);
  } catch (err) {
    console.error('[smoke-admin] Error inesperado:', err.message);
    process.exitCode = 1;
  } finally {
    // Limpieza
    try {
      const { data: smokeLogs } = await admin
        .from('admin_audit_logs')
        .select('id')
        .in('user_id', [adminUid ?? '00000000-0000-0000-0000-000000000000'])
        .or('action.eq.admin_change,action.eq.login');
      if ((smokeLogs ?? []).length) {
        await admin.from('admin_audit_logs').delete().in('id', smokeLogs.map((l) => l.id));
      }
    } catch {
      /* limpieza best-effort */
    }
    console.log('  (limpieza de auditoría de smoke)');
    process.exit(process.exitCode ?? 0);
  }
})();
