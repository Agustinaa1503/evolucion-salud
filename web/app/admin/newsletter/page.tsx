import type { Metadata } from 'next';
import { Mail, Users } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { adminDb, countWhere } from '@/lib/admin/data';
import { formatDate, timeAgo, formatCompact, paginate, parsePage, clampPage } from '@/lib/admin/format';
import { PageHeader, Card, StatCard, Badge, StatusBadge, Th, Td, EmptyState, ButtonLink } from '@/components/admin/ui';
import AdminUrlFilters from '@/components/admin/AdminUrlFilters';
import AdminPagination from '@/components/admin/AdminPagination';
import ExportCsvButton from '@/components/admin/ExportCsvButton';

export const metadata: Metadata = { title: 'Newsletter | BackOffice' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireAdminRole('admin.newsletter.read');
  const params = await searchParams;
  const q = params.q?.trim();
  const status = params.status;

  const sb = adminDb();
  const [total, active] = await Promise.all([
    countWhere(sb, 'newsletter_subscribers'),
    countWhere(sb, 'newsletter_subscribers', 'status', 'activo'),
  ]);

  const [{ data: segments }, { data: recent }] = sb
    ? await Promise.all([
        sb.from('newsletter_segments').select('id, name, description, created_at').order('created_at', { ascending: true }),
        sb.from('newsletter_subscribers').select('email, name, source, status, created_at').order('created_at', { ascending: false }).limit(6),
      ])
    : [{ data: [] }, { data: [] }];

  let query = sb
    ? sb.from('newsletter_subscribers').select('email, name, source, status, created_at', { count: 'exact' })
    : null;
  if (query) {
    if (status) query = query.eq('status', status);
    if (q) query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%`);
    query = query.order('created_at', { ascending: false });
  }
  const { data: subs, count } = (await query) ?? { data: [], count: 0 };

  const page = parsePage(params.page);
  const totalPages = clampPage(page, Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)));
  const paged = paginate(subs ?? [], page, PAGE_SIZE);

  const exportRows = (subs ?? []).map((s) => [s.name ?? '', s.email, s.source ?? '', s.status, formatDate(s.created_at)]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Newsletter"
        description="Suscriptores del canal de email (activo propio más valioso de la plataforma)."
        badge={<Badge tone="leaf">{formatCompact(count ?? 0)} suscriptores</Badge>}
        actions={
          sb && (subs ?? []).length > 0 ? (
            <ExportCsvButton filename="newsletter" headers={['Nombre', 'Email', 'Fuente', 'Estado', 'Fecha']} rows={exportRows} />
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total suscriptores" value={formatCompact(total)} icon={Mail} tone="brand" />
        <StatCard label="Activos" value={formatCompact(active)} icon={Users} tone="leaf" />
        <StatCard label="Últimos 6" value={formatCompact((recent ?? []).length)} hint="alta reciente más nueva abajo" icon={Users} tone="clay" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Segmentos" subtitle="Grupos de la newsletter para envíos segmentados" padded={false} className="lg:col-span-1">
          {!segments || segments.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Users} title="Sin segmentos" description="Los segmentos se crean en la base de datos." />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {(segments ?? []).map((s) => (
                <li key={s.id} className="px-5 py-3">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{s.description}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Suscriptores" subtitle="Base de contactos con filtros" padded={false} className="lg:col-span-2">
          <div className="border-b border-slate-100 p-4 dark:border-slate-800">
            <AdminUrlFilters
              searchPlaceholder="Buscar por email o nombre…"
              selects={[
                {
                  name: 'status',
                  label: 'Estado',
                  options: [
                    { value: 'activo', label: 'Activo' },
                    { value: 'inactivo', label: 'Inactivo' },
                  ],
                },
              ]}
            />
          </div>

          {!sb ? (
            <div className="p-5">
              <EmptyState icon={Mail} title="Supabase no está configurado" description="Configure las credenciales en web/.env.local para ver suscriptores." />
            </div>
          ) : paged.items.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Mail} title="No se encontraron suscriptores" description="Pruebe a quitar los filtros." actionHref="/admin/newsletter" actionLabel="Ver todos" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60">
                  <tr>
                    <Th>Suscriptor</Th>
                    <Th>Fuente</Th>
                    <Th>Estado</Th>
                    <Th>Fecha</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paged.items.map((s) => (
                    <tr key={s.email} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                      <Td>
                        <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{s.name || '—'}</span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{s.email}</span>
                      </Td>
                      <Td>
                        <Badge tone="slate">{s.source || 'web'}</Badge>
                      </Td>
                      <Td>
                        <StatusBadge estado={s.status} />
                      </Td>
                      <Td>
                        <span className="text-sm text-slate-600 dark:text-slate-300" title={s.created_at}>
                          {timeAgo(s.created_at)}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <AdminPagination page={page} totalPages={totalPages} total={count ?? 0} pageSize={PAGE_SIZE} />
        </Card>
      </div>

      <ButtonLink href="/admin/dashboard">← Volver al Dashboard</ButtonLink>
    </div>
  );
}
