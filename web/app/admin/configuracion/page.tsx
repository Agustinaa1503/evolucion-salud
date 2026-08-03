import type { Metadata } from 'next';
import { Fragment } from 'react';
import { Settings as SettingsIcon, ShieldCheck } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { adminDb } from '@/lib/admin/data';
import { mergeGroup, SETTINGS_GROUPS, DEFAULT_SETTINGS_BY_GROUP } from '@/lib/admin/settings';
import { PERMISSION_GROUPS, ROLE_LABELS, ROLE_PERMISSIONS, hasPermission, type Role } from '@/lib/admin/rbac';
import { PageHeader, Card, Badge, ButtonLink } from '@/components/admin/ui';
import AdminSettingsForm from '@/components/admin/AdminSettingsForm';
import { isServerSupabaseConfigured } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Configuración | BackOffice' };
export const dynamic = 'force-dynamic';

const adminRoles: Role[] = ['super_admin', 'admin', 'editor', 'teacher', 'student', 'guest'];

export default async function AdminConfiguracionPage() {
  const session = await requireAdminRole('admin.settings.read');
  const canEdit = hasPermission(session.profile?.rol, 'admin.settings.write');
  const sb = adminDb();

  const { data: stored } = sb ? await sb.from('backoffice_settings').select('key, value') : { data: [] };
  const storedMap = new Map<string, Record<string, unknown>>(
    (stored ?? []).map((s) => [s.key, (s.value ?? {}) as Record<string, unknown>])
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Ajustes del BackOffice y matriz de permisos por rol."
        badge={
          isServerSupabaseConfigured ? (
            <Badge tone="leaf">Supabase conectado</Badge>
          ) : (
            <Badge tone="clay">Modo demo</Badge>
          )
        }
      />

      {!canEdit ? (
        <p className="rounded-xl border border-clay-200 bg-clay-50 px-4 py-3 text-sm text-clay-800 dark:border-clay-800 dark:bg-clay-950 dark:text-clay-300">
          Su rol le permite ver la configuración pero no guardar cambios (se requiere admin.settings.write).
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {SETTINGS_GROUPS.map((g) => (
          <AdminSettingsForm
            key={g.key}
            group={g.key}
            label={g.label}
            initial={mergeGroup(g.key, storedMap.get(g.key) ?? DEFAULT_SETTINGS_BY_GROUP[g.key])}
          />
        ))}
      </div>

      <Card
        title="Permisos por rol (RBAC)"
        subtitle="Matriz definida en lib/admin/rbac.ts y reflejada en la tabla role_permissions de Supabase."
        padded={false}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Permiso
                </th>
                {adminRoles.map((r) => (
                  <th key={r} className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {ROLE_LABELS[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {PERMISSION_GROUPS.map((group) => (
                <Fragment key={group.key}>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/50">
                    <td colSpan={adminRoles.length + 1} className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                      {group.label}
                    </td>
                  </tr>
                  {group.permissions.map((p) => (
                    <tr key={p.permission}>
                      <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300">
                        {p.label}
                        <span className="block text-[10px] text-slate-400">{p.description}</span>
                      </td>
                      {adminRoles.map((r) => {
                        const grant = (ROLE_PERMISSIONS[r] ?? []).includes(p.permission);
                        return (
                          <td key={r} className="px-3 py-2.5 text-center">
                            {grant ? (
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-leaf-50 text-leaf-600 dark:bg-leaf-950 dark:text-leaf-400">
                                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Diagnóstico" subtitle="Estado de la infraestructura del BackOffice">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">Service role (datos admin)</dt>
            <dd className="mt-1 font-bold text-slate-800 dark:text-slate-100">
              {isServerSupabaseConfigured ? 'Configurado' : 'Falta SUPABASE_SERVICE_ROLE_KEY'}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">RLS / auditoría</dt>
            <dd className="mt-1 font-bold text-slate-800 dark:text-slate-100">admin_audit_logs + role_permissions activos</dd>
          </div>
        </dl>
      </Card>

      <ButtonLink href="/admin/dashboard">← Volver al Dashboard</ButtonLink>
    </div>
  );
}
