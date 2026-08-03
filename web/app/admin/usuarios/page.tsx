import type { Metadata } from 'next';
import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { permissionsForRole, ROLE_LABELS, type Role } from '@/lib/admin/rbac';
import { adminDb } from '@/lib/admin/data';
import { formatDate, timeAgo, paginate, parsePage, clampPage, fullName, initials } from '@/lib/admin/format';
import { PageHeader, Card, Badge, RoleBadge, StatusBadge, Th, Td, EmptyState, ButtonLink } from '@/components/admin/ui';
import AdminUrlFilters from '@/components/admin/AdminUrlFilters';
import AdminPagination from '@/components/admin/AdminPagination';
import AdminUserActions from '@/components/admin/AdminUserActions';
import ExportCsvButton from '@/components/admin/ExportCsvButton';

export const metadata: Metadata = { title: 'Usuarios | BackOffice' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; rol?: string; estado?: string; page?: string }>;
}) {
  const session = await requireAdminRole('admin.users.read');
  const perms = permissionsForRole(session.profile?.rol);
  const canWrite = perms.includes('admin.users.write');
  const canDelete = perms.includes('admin.users.delete');

  const params = await searchParams;
  const q = params.q?.trim();
  const rol = params.rol || undefined;
  const estado = params.estado || undefined;
  const page = parsePage(params.page);

  const sb = adminDb();
  let query = sb
    ? sb.from('profiles').select('id, nombre, apellido, email, avatar_url, rol, estado, created_at, last_sign_in_at', { count: 'exact' })
    : null;
  if (query) {
    if (rol) query = query.eq('rol', rol);
    if (estado) query = query.eq('estado', estado);
    if (q) query = query.or(`email.ilike.%${q}%,nombre.ilike.%${q}%,apellido.ilike.%${q}%`);
    query = query.order('created_at', { ascending: false });
  }

  const { data, count } = (await query) ?? { data: [], count: 0 };
  const totalPages = clampPage(page, Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)));
  const pageResult = paginate(data ?? [], page, PAGE_SIZE);
  const rows = pageResult.items;

  const exportRows = (data ?? []).map((u) => [
    fullName(u.nombre, u.apellido),
    u.email ?? '',
    u.rol ?? '',
    u.estado ?? '',
    formatDate(u.created_at),
    formatDate(u.last_sign_in_at),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Cuentas registradas en la plataforma. Cambie el rol para controlar el acceso al BackOffice."
        actions={
          sb && (data ?? []).length > 0 ? (
            <ExportCsvButton
              filename="usuarios"
              headers={['Nombre', 'Email', 'Rol', 'Estado', 'Registro', 'Último acceso']}
              rows={exportRows}
            />
          ) : undefined
        }
      />

      <Card padded={false}>
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <AdminUrlFilters
            searchPlaceholder="Buscar por email o nombre…"
            selects={[
              {
                name: 'rol',
                label: 'Rol',
                options: (Object.keys(ROLE_LABELS) as Role[]).map((r) => ({ value: r, label: ROLE_LABELS[r] })),
              },
              {
                name: 'estado',
                label: 'Estado',
                options: [
                  { value: 'activo', label: 'Activo' },
                  { value: 'suspendido', label: 'Suspendido' },
                  { value: 'bloqueado', label: 'Bloqueado' },
                ],
              },
            ]}
          />
        </div>

        {!sb ? (
          <div className="p-5">
            <EmptyState
              icon={UserRound}
              title="Supabase no está configurado"
              description="Complete NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en web/.env.local para ver los usuarios."
            />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={UserRound}
              title="No se encontraron usuarios"
              description="Pruebe a quitar los filtros o a buscar otro término."
              actionHref="/admin/usuarios"
              actionLabel="Ver todos"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60">
                <tr>
                  <Th>Usuario</Th>
                  <Th>Rol</Th>
                  <Th>Estado</Th>
                  <Th>Registro</Th>
                  <Th>Último acceso</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                    <Td>
                      <Link href={`/admin/usuarios/${u.id}`} className="flex items-center gap-3">
                        {u.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                            {initials(u.nombre, u.apellido)}
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {fullName(u.nombre, u.apellido)}
                          </span>
                          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</span>
                        </span>
                      </Link>
                    </Td>
                    <Td>
                      <RoleBadge rol={u.rol} />
                    </Td>
                    <Td>
                      <StatusBadge estado={u.estado} />
                    </Td>
                    <Td>
                      <span className="text-sm text-slate-600 dark:text-slate-300">{formatDate(u.created_at)}</span>
                    </Td>
                    <Td>
                      <span className="text-sm text-slate-600 dark:text-slate-300" title={u.last_sign_in_at ?? undefined}>
                        {timeAgo(u.last_sign_in_at)}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end">
                        <AdminUserActions
                          userId={u.id}
                          rol={u.rol ?? 'guest'}
                          estado={u.estado ?? 'activo'}
                          canWrite={canWrite}
                          canDelete={canDelete}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPagination page={page} totalPages={totalPages} total={count ?? 0} pageSize={PAGE_SIZE} />
      </Card>

      {!canWrite ? (
        <p className="text-xs text-slate-400">
          <Badge tone="slate">Solo lectura</Badge> Su rol permite ver usuarios pero no editarlos.
        </p>
      ) : null}

      <div className="flex gap-2">
        <ButtonLink href="/admin/dashboard">← Volver al Dashboard</ButtonLink>
      </div>
    </div>
  );
}
