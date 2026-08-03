import type { Metadata } from 'next';
import { UserRound } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { adminDb, countWhere } from '@/lib/admin/data';
import { formatDate, timeAgo, formatCompact, paginate, parsePage, clampPage } from '@/lib/admin/format';
import { PageHeader, Card, StatCard, Badge, StatusBadge, Th, Td, EmptyState, ButtonLink } from '@/components/admin/ui';
import AdminUrlFilters from '@/components/admin/AdminUrlFilters';
import AdminPagination from '@/components/admin/AdminPagination';
import ExportCsvButton from '@/components/admin/ExportCsvButton';
import { getAllCourses } from '@/lib/courses/registry';

export const metadata: Metadata = { title: 'Lista de espera | BackOffice' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function AdminWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; course?: string; page?: string }>;
}) {
  await requireAdminRole('admin.waitlist.read');
  const params = await searchParams;
  const q = params.q?.trim();
  const course = params.course;

  const sb = adminDb();
  const [total, waiting] = await Promise.all([
    countWhere(sb, 'course_waitlist'),
    countWhere(sb, 'course_waitlist', 'status', 'waiting'),
  ]);

  const upcoming = getAllCourses().filter((c) => c.type === 'upcoming' || c.status === 'in-development');

  let query = sb
    ? sb.from('course_waitlist').select('id, email, name, course_slug, source, status, created_at, email_sent_at', { count: 'exact' })
    : null;
  if (query) {
    if (course) query = query.eq('course_slug', course);
    if (q) query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%`);
    query = query.order('created_at', { ascending: false });
  }
  const { data, count } = (await query) ?? { data: [], count: 0 };

  const page = parsePage(params.page);
  const totalPages = clampPage(page, Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)));
  const paged = paginate(data ?? [], page, PAGE_SIZE);

  const courseTitle = (slug: string) => {
    const c = getAllCourses().find((x) => x.slug === slug);
    return c ? c.title : slug;
  };

  const exportRows = (data ?? []).map((w) => [
    w.name ?? '',
    w.email,
    courseTitle(w.course_slug),
    w.source,
    w.status,
    formatDate(w.created_at),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lista de espera"
        description="Personas anotadas en cursos próximos (embudo de captación). Cada alta también suma a la newsletter."
        badge={<Badge tone="brand">{formatCompact(count ?? 0)} anotados</Badge>}
        actions={
          sb && (data ?? []).length > 0 ? (
            <ExportCsvButton filename="lista-de-espera" headers={['Nombre', 'Email', 'Curso', 'Fuente', 'Estado', 'Fecha']} rows={exportRows} />
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total anotados" value={formatCompact(total)} icon={UserRound} tone="brand" />
        <StatCard label="En espera" value={formatCompact(waiting)} icon={UserRound} tone="clay" />
        <StatCard label="Cursos próximos" value={formatCompact(upcoming.length)} icon={UserRound} tone="leaf" />
      </div>

      <Card padded={false}>
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <AdminUrlFilters
            searchPlaceholder="Buscar por email o nombre…"
            selects={[
              {
                name: 'course',
                label: 'Curso',
                options: upcoming.map((c) => ({ value: c.slug, label: c.title })),
              },
            ]}
          />
        </div>

        {!sb ? (
          <div className="p-5">
            <EmptyState icon={UserRound} title="Supabase no está configurado" description="Configure las credenciales en web/.env.local para ver la lista." />
          </div>
        ) : paged.items.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={UserRound} title="No hay anotados" description="Cuando alguien se anote a un curso próximo aparecerá aquí." actionHref="/admin/lista-de-espera" actionLabel="Ver todos" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60">
                <tr>
                  <Th>Contacto</Th>
                  <Th>Curso</Th>
                  <Th>Fuente</Th>
                  <Th>Estado</Th>
                  <Th>Fecha</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.items.map((w) => (
                  <tr key={w.id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                    <Td>
                      <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{w.name || '—'}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{w.email}</span>
                    </Td>
                    <Td>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{courseTitle(w.course_slug)}</span>
                    </Td>
                    <Td>
                      <Badge tone="slate">{w.source}</Badge>
                    </Td>
                    <Td>
                      <StatusBadge estado={w.status} />
                    </Td>
                    <Td>
                      <span className="text-sm text-slate-600 dark:text-slate-300" title={w.created_at}>
                        {timeAgo(w.created_at)}
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

      <ButtonLink href="/admin/dashboard">← Volver al Dashboard</ButtonLink>
    </div>
  );
}
