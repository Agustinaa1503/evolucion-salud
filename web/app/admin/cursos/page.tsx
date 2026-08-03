import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, FileText } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { adminDb } from '@/lib/admin/data';
import { formatCompact } from '@/lib/admin/format';
import { PageHeader, Card, Badge, StatusBadge, Th, Td, EmptyState } from '@/components/admin/ui';
import AdminUrlFilters from '@/components/admin/AdminUrlFilters';
import AdminPagination from '@/components/admin/AdminPagination';
import { getAllCourses } from '@/lib/courses/registry';

export const metadata: Metadata = { title: 'Cursos | BackOffice' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

const courseTypes: Record<string, string> = {
  free: 'Gratuito',
  paid: 'De pago',
  upcoming: 'Próximamente',
};

export default async function AdminCursosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string; page?: string }>;
}) {
  await requireAdminRole('admin.courses.read');
  const params = await searchParams;
  const q = params.q?.trim().toLowerCase();
  const status = params.status;
  const type = params.type;

  const sb = adminDb();
  const [{ data: enrollments }, { data: dbCourses }] = sb
    ? await Promise.all([
        sb.from('user_courses').select('course_id'),
        sb.from('courses').select('id, slug, status, updated_at'),
      ])
    : [{ data: [] }, { data: [] }];

  const enrollmentCount = new Map<string, number>();
  for (const e of enrollments ?? []) {
    enrollmentCount.set(String(e.course_id), (enrollmentCount.get(String(e.course_id)) ?? 0) + 1);
  }
  const dbBySlug = new Map((dbCourses ?? []).map((c) => [c.slug, c]));

  let courses = getAllCourses().filter((c) => c.status !== 'archived');
  if (q) {
    courses = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.tags ?? []).some((t) => t.toLowerCase().includes(q))
    );
  }
  if (status) courses = courses.filter((c) => c.status === status);
  if (type) courses = courses.filter((c) => c.type === type);

  const page = Math.max(1, Number(params.page) || 1);
  const totalPages = Math.max(1, Math.ceil(courses.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = courses.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cursos"
        description="Catálogo completo desde Cursos/*.md (fuente de verdad). La web compila cada curso; el catálogo en Supabase se sincroniza con npm run db:sync-catalog."
        badge={<Badge tone="leaf">{formatCompact(courses.length)} en catálogo</Badge>}
      />

      <Card padded={false}>
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <AdminUrlFilters
            searchPlaceholder="Buscar curso por título, categoría o tag…"
            selects={[
              {
                name: 'status',
                label: 'Estado',
                options: [
                  { value: 'published', label: 'Publicado' },
                  { value: 'in-development', label: 'En desarrollo' },
                  { value: 'draft', label: 'Borrador' },
                ],
              },
              {
                name: 'type',
                label: 'Tipo',
                options: Object.entries(courseTypes).map(([value, label]) => ({ value, label })),
              },
            ]}
          />
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={BookOpen}
              title="No se encontraron cursos"
              description="Pruebe a quitar los filtros."
              actionHref="/admin/cursos"
              actionLabel="Ver todos"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60">
                <tr>
                  <Th>Curso</Th>
                  <Th>Tipo</Th>
                  <Th>Estado</Th>
                  <Th>Nivel</Th>
                  <Th>Inscriptos</Th>
                  <Th>Quiz</Th>
                  <Th>Certificado</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((c) => {
                  const db = dbBySlug.get(c.slug);
                  return (
                    <tr key={c.slug} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                      <Td>
                        <Link href={`/admin/cursos/${c.slug}`} className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                            <BookOpen className="h-4.5 w-4.5" aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {c.title}
                            </span>
                            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{c.slug}</span>
                          </span>
                        </Link>
                      </Td>
                      <Td>
                        <Badge tone={c.type === 'free' ? 'leaf' : c.type === 'paid' ? 'brand' : 'clay'}>
                          {courseTypes[c.type] ?? c.type}
                        </Badge>
                      </Td>
                      <Td>
                        <div className="flex flex-col gap-1">
                          <StatusBadge estado={c.status} />
                          {db && db.status !== c.status ? (
                            <span className="text-[10px] text-clay-600 dark:text-clay-400">
                              BD: {db.status} (sincronizar)
                            </span>
                          ) : null}
                        </div>
                      </Td>
                      <Td>
                        <span className="text-sm capitalize text-slate-600 dark:text-slate-300">{c.difficulty ?? c.level}</span>
                      </Td>
                      <Td>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {formatCompact(enrollmentCount.get(String(c.id)) ?? 0)}
                        </span>
                      </Td>
                      <Td>
                        <Badge tone={c.hasQuiz ? 'brand' : 'slate'}>{c.hasQuiz ? 'Con nota' : '—'}</Badge>
                      </Td>
                      <Td>
                        <Badge tone={c.hasCertificate ? 'sun' : 'slate'}>{c.hasCertificate ? 'Sí' : 'No'}</Badge>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <AdminPagination page={safePage} totalPages={totalPages} total={courses.length} pageSize={PAGE_SIZE} />
      </Card>

      <p className="flex items-center gap-2 text-xs text-slate-400">
        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
        Los cursos se editan en Cursos/*.md; este módulo es de lectura y monitoreo.
      </p>
    </div>
  );
}
