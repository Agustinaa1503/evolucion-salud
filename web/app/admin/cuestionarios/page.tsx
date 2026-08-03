import type { Metadata } from 'next';
import { ClipboardCheck } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { adminDb, countWhere } from '@/lib/admin/data';
import { formatDateTime, formatCompact, fullName, paginate, parsePage, clampPage } from '@/lib/admin/format';
import { PageHeader, Card, StatCard, Badge, StatusBadge, Th, Td, EmptyState, ButtonLink } from '@/components/admin/ui';
import AdminUrlFilters from '@/components/admin/AdminUrlFilters';
import AdminPagination from '@/components/admin/AdminPagination';
import ExportCsvButton from '@/components/admin/ExportCsvButton';
import { getAllCourses } from '@/lib/courses/registry';

export const metadata: Metadata = { title: 'Cuestionarios | BackOffice' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function AdminCuestionariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; course?: string; passed?: string; page?: string }>;
}) {
  await requireAdminRole('admin.quizzes.read');
  const params = await searchParams;
  const q = params.q?.trim();
  const course = params.course;
  const passed = params.passed;

  const sb = adminDb();
  const [{ data: all }, { count: total }] = sb
    ? await Promise.all([
        sb.from('user_quiz_attempts').select('user_id, course_id, quiz_id, score, max_score, passed, submitted_at, profiles(email, nombre, apellido)'),
        sb.from('user_quiz_attempts').select('*', { count: 'exact', head: true }),
      ])
    : [{ data: [] }, { count: 0 }];

  const catalog = getAllCourses();
  const courseMap = new Map(catalog.map((c) => [String(c.id), c]));

  let rows = all ?? [];
  if (course) rows = rows.filter((a) => String(a.course_id) === course);
  if (passed) rows = rows.filter((a) => a.passed === (passed === 'aprobado'));
  if (q) {
    const ql = q.toLowerCase();
    rows = rows.filter((a) => (a.profiles?.email ?? '').toLowerCase().includes(ql));
  }

  const passedCount = rows.filter((a) => a.passed).length;
  const passRate = rows.length > 0 ? Math.round((passedCount / rows.length) * 100) : 0;
  const sumScore = rows.reduce((acc, a) => acc + (a.score ?? 0), 0);
  const sumMax = rows.reduce((acc, a) => acc + (a.max_score ?? 0), 0);
  const avgPct = sumMax > 0 ? Math.round((sumScore / sumMax) * 100) : 0;

  const page = parsePage(params.page);
  const totalPages = clampPage(page, Math.max(1, Math.ceil(rows.length / PAGE_SIZE)));
  const paged = paginate(rows, page, PAGE_SIZE);

  const exportRows = paged.items.map((a) => [
    fullName(a.profiles?.nombre, a.profiles?.apellido) || a.profiles?.email || '',
    courseMap.get(String(a.course_id))?.title ?? String(a.course_id),
    `${a.score}/${a.max_score}`,
    a.passed ? 'aprobado' : 'no aprobado',
    formatDateTime(a.submitted_at),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuestionarios"
        description="Intentos con nota de los alumnos (FASE 6). La nota se calcula en el servidor contra el Markdown del curso."
        badge={<Badge tone="brand">{formatCompact(total ?? 0)} intentos</Badge>}
        actions={
          paged.items.length > 0 ? (
            <ExportCsvButton filename="cuestionarios" headers={['Alumno', 'Curso', 'Nota', 'Resultado', 'Fecha']} rows={exportRows} />
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Intentos (filtrados)" value={formatCompact(rows.length)} icon={ClipboardCheck} tone="brand" />
        <StatCard label="Tasa de aprobación" value={`${passRate}%`} hint={`${passedCount} aprobados`} icon={ClipboardCheck} tone="leaf" />
        <StatCard label="Nota promedio" value={`${avgPct}%`} icon={ClipboardCheck} tone="clay" />
      </div>

      <Card padded={false}>
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <AdminUrlFilters
            searchPlaceholder="Buscar por email del alumno…"
            selects={[
              {
                name: 'course',
                label: 'Curso',
                options: catalog.map((c) => ({ value: String(c.id), label: c.title })),
              },
              {
                name: 'passed',
                label: 'Resultado',
                options: [
                  { value: 'aprobado', label: 'Aprobado' },
                  { value: 'no-aprobado', label: 'No aprobado' },
                ],
              },
            ]}
          />
        </div>

        {!sb || rows.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={ClipboardCheck} title="Sin intentos" description="Los cuestionarios con nota de los alumnos aparecerán aquí." actionHref="/admin/cuestionarios" actionLabel="Ver todos" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60">
                <tr>
                  <Th>Alumno</Th>
                  <Th>Curso</Th>
                  <Th>Nota</Th>
                  <Th>Resultado</Th>
                  <Th>Fecha</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.items.map((a, i) => (
                  <tr key={i} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                    <Td>
                      <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {fullName(a.profiles?.nombre, a.profiles?.apellido)}
                      </span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{a.profiles?.email}</span>
                    </Td>
                    <Td>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{courseMap.get(String(a.course_id))?.title ?? String(a.course_id)}</span>
                    </Td>
                    <Td>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{a.score}/{a.max_score}</span>
                    </Td>
                    <Td>
                      <StatusBadge estado={a.passed ? 'aprobado' : 'no-aprobado'} />
                    </Td>
                    <Td>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(a.submitted_at)}</span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPagination page={page} totalPages={totalPages} total={rows.length} pageSize={PAGE_SIZE} />
      </Card>

      <ButtonLink href="/admin/dashboard">← Volver al Dashboard</ButtonLink>
    </div>
  );
}
