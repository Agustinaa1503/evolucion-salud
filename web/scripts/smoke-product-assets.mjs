/**
 * Smoke test SUBFASE 12.3.2 — Assets privados de producto contra el proyecto
 * remoto.
 *
 * Verifica:
 *  1. El bucket `product-assets` existe y es privado.
 *  2. RLS `product_assets`: anon no lee ni inserta; un autenticado sin rol
 *     admin no lee; service_role lee/escribe/borra.
 *  3. Storage: anon NO puede listar el bucket; un admin autenticado puede
 *     (policies por is_admin).
 *  4. Los assets declarados en el Markdown quedaron sincronizados
 *     (guia-basica 1 + meditaciones 4), con uploaded_at NULL (pendientes).
 *
 * Uso: node scripts/smoke-product-assets.mjs <email> <password> (super_admin)
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
  console.error('[smoke-product-assets] Faltan credenciales (.env.local) o el usuario admin (argv).');
  process.exit(1);
}

const admin = createClient(BASE, SRV, { auth: { persistSession: false } });
const anon = createClient(BASE, ANON, { auth: { persistSession: false } });

const check = (label, ok, detail = '') => {
  console.log(`${ok ? '  ✔' : '  ✘'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
};

(async () => {
  try {
    // 1. Bucket privado
    const { data: bucket } = await admin.storage.getBucket('product-assets');
    check('bucket product-assets existe', !!bucket?.id, bucket?.id ?? 'no existe');
    check('bucket product-assets privado', bucket ? bucket.public === false : false, `public: ${bucket?.public}`);

    // 2. Assets sincronizados
    const { data: assets, error: assetsErr } = await admin
      .from('product_assets')
      .select('*')
      .order('product_slug');
    check('product_assets: service_role lee', !assetsErr, assetsErr?.message ?? '');
    const declared = (assets ?? []).filter((a) => a.uploaded_at === null);
    const guia = (assets ?? []).filter((a) => a.product_slug === 'guia-basica-dia-despues-del-diagnostico');
    const meditaciones = (assets ?? []).filter((a) => a.product_slug === 'meditaciones-guiadas-pine');
    check(
      'product_assets: assets sincronizados (1 guía + 4 meditaciones)',
      guia.length === 1 && meditaciones.length === 4,
      `guia: ${guia.length}, meditaciones: ${meditaciones.length}`
    );
    check('product_assets: todos pendientes de upload', declared.length === (assets ?? []).length, `pendientes: ${declared.length}`);

    // 3. RLS anon
    const anonRead = await anon.from('product_assets').select('*').limit(1);
    check(
      'RLS: anon no lee product_assets',
      !anonRead.error && (anonRead.data ?? []).length === 0,
      anonRead.error?.message ?? `filas: ${(anonRead.data ?? []).length}`
    );
    const { error: anonIns } = await anon.from('product_assets').insert({
      product_slug: 'x',
      asset_slug: 'y',
      title: 'z',
      file_name: 'z.pdf',
      mime: 'application/pdf',
    });
    check('RLS: anon no inserta product_assets', !!anonIns, anonIns?.message ?? 'no debería poder insertar');

    // 4. Storage RLS: anon no puede listar el bucket privado
    const anonList = await anon.storage.from('product-assets').list('', { limit: 1 });
    check(
      'Storage: anon no lista product-assets',
      !!anonList.error || (anonList.data ?? []).length === 0,
      anonList.error?.message ?? `objetos: ${(anonList.data ?? []).length}`
    );

    // 5. Autenticado sin rol admin no lee product_assets (usuario efímero)
    const email = `smoke-pa-${Date.now()}@evolucion.test`;
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: 'SmokePass123!',
      email_confirm: true,
    });
    check('auth: se crea usuario efímero', !createErr, createErr?.message ?? '');
    if (createErr) return;

    const userClient = createClient(BASE, ANON, { auth: { persistSession: false } });
    const { error: loginErr } = await userClient.auth.signInWithPassword({ email, password: 'SmokePass123!' });
    check('auth: login del usuario efímero', !loginErr, loginErr?.message ?? '');
    const { data: userRead } = await userClient.from('product_assets').select('*').limit(1);
    check(
      'RLS: autenticado sin admin no lee product_assets',
      (userRead ?? []).length === 0,
      `filas: ${(userRead ?? []).length}`
    );
    const { error: userIns } = await userClient.from('product_assets').insert({
      product_slug: 'x',
      asset_slug: 'y',
      title: 'z',
      file_name: 'z.pdf',
      mime: 'application/pdf',
    });
    check('RLS: autenticado sin admin no inserta product_assets', !!userIns, userIns?.message ?? 'no debería poder insertar');
    const userList = await userClient.storage.from('product-assets').list('', { limit: 1 });
    check(
      'Storage: autenticado sin admin no lista product-assets',
      !!userList.error || (userList.data ?? []).length === 0,
      userList.error?.message ?? `objetos: ${(userList.data ?? []).length}`
    );

    // 6. Admin autenticado: RLS permite leer (policy is_admin)
    const { data: signIn, error: signErr } = await anon.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
    check('auth: login del super_admin', !signErr, signErr?.message ?? '');
    if (signErr) return;
    const authAdmin = createClient(BASE, ANON, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${signIn.session.access_token}` } },
    });
    authAdmin.auth.setSession({ access_token: signIn.session.access_token, refresh_token: signIn.session.refresh_token });
    const { data: adminRead } = await authAdmin.from('product_assets').select('*').limit(1);
    check(
      'RLS: super_admin autenticado lee product_assets',
      (adminRead ?? []).length > 0,
      `filas: ${(adminRead ?? []).length}`
    );
    const adminList = await authAdmin.storage.from('product-assets').list('', { limit: 1 });
    check(
      'Storage: super_admin autenticado lista product-assets (vacío)',
      !adminList.error && (adminList.data ?? []).length === 0,
      adminList.error?.message ?? `objetos: ${(adminList.data ?? []).length}`
    );

    // 7. service_role inserta/borra (limpieza de fila temporal)
    const { data: ins, error: srvIns } = await admin
      .from('product_assets')
      .insert({
        product_slug: '__smoke__',
        asset_slug: `tmp-${Date.now()}`,
        title: 'Smoke',
        file_name: 'smoke.pdf',
        mime: 'application/pdf',
      })
      .select('id')
      .single();
    check('product_assets: service_role inserta', !srvIns && !!ins?.id, srvIns?.message ?? '');
    if (ins?.id) {
      const { error: delErr } = await admin.from('product_assets').delete().eq('id', ins.id);
      check('product_assets: service_role borra', !delErr, delErr?.message ?? '');
    }

    console.log(`\n[smoke-product-assets] Finalizado. OK${process.exitCode ? ' con fallos' : ''}.`);
  } catch (err) {
    console.error('[smoke-product-assets] Error inesperado:', err.message);
    process.exitCode = 1;
  } finally {
    try {
      const { data: users } = await admin.auth.admin.listUsers();
      const toDelete = (users?.users ?? []).filter((u) => (u.email ?? '').startsWith('smoke-pa-'));
      for (const u of toDelete) await admin.auth.admin.deleteUser(u.id);
    } catch {
      /* limpieza best-effort */
    }
    console.log('  (limpieza de usuarios de smoke)');
    process.exit(process.exitCode ?? 0);
  }
})();
