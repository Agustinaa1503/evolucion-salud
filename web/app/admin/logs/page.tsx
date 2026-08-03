import type { Metadata } from 'next';
import { ScrollText } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { adminDb } from '@/lib/admin/data';
import { formatDateTime, timeAgo, paginate, parsePage, clampPage } from '@/lib/admin/format';
import { PageHeader, Card, Badge, Th, Td, EmptyState, ButtonLink } from '@/components/admin/ui';
import AdminUrlFilters from '@/components/admin/AdminUrlFilters';
import AdminPagination from '@/components/admin/AdminPagination';
import ExportCsvButton from '@/components/admin/ExportCsvButton';

export const metadata: Metadata = { title: 'Logs | BackOffice' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

const categories = ['auth', 'users', 'courses', 'blog', 'podcast', 'resources', 'taxonomy', 'newsletter', 'waitlist', 'quizzes', 'certificates', 'settings', 'system'];
const actions = ['login', 'admin_change', 'publish', 'settings', 'export', 'error'];

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; action?: string; page?: string }>;
}) {
  await requireAdminRole('admin.logs.read');
  const params = await searchParams;
  const q = params.q?.trim();
  const category = params.category;
  const action = params.action;

  const sb = adminDb();
  const [{ data: activity }] = sb
    ? [
        await sb
          .from('activity_logs')
          .select('event, payload, created_at, profiles(email, nombre, apellido)')
          .order('created_at', { ascending: false })
          .limit(10),
      ]
    : [{ data: [] }];

  let query = sb
    ? sb.from('admin_audit_logs').select('id, action, category, target_type, target_id, detail, created_at, profiles(email, nombre, apellido)', { count: 'exact' })
    : null;
  if (query) {
    if (category) query = query.eq('category', category);
    if (action) query = query.eq('action', action);
    if (q) query = query.ilike('profiles.email', `%${q}%`);
    query = query.order('created_at', { ascending: false });
  }
  const { data, count } = (await query) ?? { data: [], count: 0 };

  const page = parsePage(params.page);
  const totalPages = clampPage(page, Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)));
  const paged = paginate(data ?? [], page, PAGE_SIZE);

  const exportRows = (data ?? []).map((l) => [
    formatDateTime(l.created_at),
    l.action,
    l.category,
    l.target_type ?? '',
    l.target_id ?? '',
    l.profiles?.email ?? '',
  ]);

  const who = (l: { profiles?: { email: string | null; nombre: string | null; apellido: string | null } | null }) =>
    l.profiles
      ? [l.profiles.nombre, l.profiles.apellido].filter(Boolean).join(' ') || l.profiles.email || 'Sistema'
      : 'Sistema';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logs"
        description="Auditoría administrativa y actividad de aprendizaje. Los inicios de sesión de administradores se registran automáticamente."
        badge={<Badge tone="brand">{count ?? 0} eventos de auditoría</Badge>}
        actions={
          sb && (data ?? []).length > 0 ? (
            <ExportCsvButton filename="logs" headers={['Fecha', 'Acción', 'Categoría', 'Tipo', 'ID', 'Usuario']} rows={exportRows} />
          ) : undefined
        }
      />

      <Card title="Auditoría administrativa" subtitle="admin_audit_logs: cambios, publicaciones y errores" padded={false}>
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <AdminUrlFilters
            searchPlaceholder="Buscar por email del operador…"
            selects={[
              { name: 'category', label: 'Categoría', options: categories.map((c) => ({ value: c, label: c })) },
              { name: 'action', label: 'Acción', options: actions.map((a) => ({ value: a, label: a })) },
            ]}
          />
        </div>

        {!sb || paged.items.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={ScrollText} title="Sin eventos de auditoría" description="Los eventos de administración aparecerán aquí." actionHref="/admin/logs" actionLabel="Ver todos" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60">
                <tr>
                  <Th>Fecha</Th>
                  <Th>Acción</Th>
                  <Th>Categoría</Th>
                  <Th>Objeto</Th>
                  <Th>Operador</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.items.map((l) => (
                  <tr key={l.id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                    <Td>
                      <span className="text-xs text-slate-500 dark:text-slate-400" title={l.created_at}>
                        {timeAgo(l.created_at)}
                        <span className="block">{formatDateTime(l.created_at)}</span>
                      </span>
                    </Td>
                    <Td>
                      <Badge tone={l.action === 'error' ? 'red' : l.action === 'login' ? 'brand' : 'slate'}>{l.action}</Badge>
                    </Td>
                    <Td>
                      <Badge tone="slate">{l.category}</Badge>
                    </Td>
                    <Td>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {l.target_type ?? '—'}
                        {l.target_id ? <span className="block text-xs text-slate-400">{l.target_id}</span> : null}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{who(l)}</span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPagination page={page} totalPages={totalPages} total={count ?? 0} pageSize={PAGE_SIZE} />
      </Card>

      <Card title="Actividad reciente de aprendizaje" subtitle="Últimos 10 eventos de la plataforma" padded={false}>
        {!activity || activity.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={ScrollText} title="Sin actividad" description="Los eventos de los alumnos aparecerán aquí." />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {(activity ?? []).map((a, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-leaf-500" aria-hidden="true" />
                  {a.event}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ButtonLink href="/admin/dashboard">← Volver al Dashboard</ButtonLink>
    </div>
  );
}
