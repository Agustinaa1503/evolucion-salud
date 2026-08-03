import type { Metadata } from 'next';
import Link from 'next/link';
import { Award } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { adminDb, countWhere } from '@/lib/admin/data';
import { formatDate, formatDateTime, formatCompact, fullName, paginate, parsePage, clampPage } from '@/lib/admin/format';
import { PageHeader, Card, StatCard, Badge, Th, Td, EmptyState, ButtonLink } from '@/components/admin/ui';
import AdminUrlFilters from '@/components/admin/AdminUrlFilters';
import AdminPagination from '@/components/admin/AdminPagination';
import ExportCsvButton from '@/components/admin/ExportCsvButton';
import { getAllCourses } from '@/lib/courses/registry';

export const metadata: Metadata = { title: 'Certificados | BackOffice' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function AdminCertificadosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdminRole('admin.certificates.read');
  const params = await searchParams;
  const q = params.q?.trim();

  const sb = adminDb();
  const [total, recent30] = await Promise.all([
    countWhere(sb, 'certificates'),
    sb
      ? sb.from('certificates').select('*', { count: 'exact', head: true }).gte('issued_at', new Date(Date.now() - 30 * 86400000).toISOString())
      : null,
  ]);

  let query = sb
    ? sb.from('certificates').select('id, certificate_number, user_id, course_id, issued_at, profiles(email, nombre, apellido)', { count: 'exact' })
    : null;
  if (query) {
    if (q) query = query.ilike('certificate_number', `%${q}%`);
    query = query.order('issued_at', { ascending: false });
  }
  const { data, count } = (await query) ?? { data: [], count: 0 };

  const catalog = getAllCourses();
  const courseMap = new Map(catalog.map((c) => [String(c.id), c]));

  const page = parsePage(params.page);
  const totalPages = clampPage(page, Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)));
  const paged = paginate(data ?? [], page, PAGE_SIZE);

  const exportRows = (data ?? []).map((c) => [
    c.certificate_number,
    fullName(c.profiles?.nombre, c.profiles?.apellido) || c.profiles?.email || '',
    courseMap.get(String(c.course_id))?.title ?? String(c.course_id),
    formatDate(c.issued_at),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificados"
        description="Certificados de participación emitidos (PDF + QR) con verificación pública en /verificar/[id]."
        badge={<Badge tone="sun">{formatCompact(count ?? 0)} emitidos</Badge>}
        actions={
          sb && (data ?? []).length > 0 ? (
            <ExportCsvButton filename="certificados" headers={['Número', 'Persona', 'Curso', 'Emisión']} rows={exportRows} />
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total emitidos" value={formatCompact(total)} icon={Award} tone="brand" />
        <StatCard label="Últimos 30 días" value={formatCompact(recent30?.count ?? 0)} icon={Award} tone="sun" />
        <StatCard label="Cursos con certificado" value={formatCompact(catalog.filter((c) => c.hasCertificate).length)} icon={Award} tone="leaf" />
      </div>

      <Card padded={false}>
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <AdminUrlFilters searchPlaceholder="Buscar por número (ES-YYYY-…)" />
        </div>

        {!sb || paged.items.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={Award} title="Sin certificados" description="Los certificados emitidos por los alumnos aparecerán aquí." actionHref="/admin/certificados" actionLabel="Ver todos" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60">
                <tr>
                  <Th>Número</Th>
                  <Th>Persona</Th>
                  <Th>Curso</Th>
                  <Th>Emisión</Th>
                  <Th>Verificación</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.items.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                    <Td>
                      <span className="font-mono text-sm font-semibold text-brand-700 dark:text-brand-300">{c.certificate_number}</span>
                    </Td>
                    <Td>
                      <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {fullName(c.profiles?.nombre, c.profiles?.apellido)}
                      </span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{c.profiles?.email}</span>
                    </Td>
                    <Td>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{courseMap.get(String(c.course_id))?.title ?? String(c.course_id)}</span>
                    </Td>
                    <Td>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(c.issued_at)}</span>
                    </Td>
                    <Td>
                      <Link href={`/verificar/${c.id}`} className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
                        Verificar →
                      </Link>
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
