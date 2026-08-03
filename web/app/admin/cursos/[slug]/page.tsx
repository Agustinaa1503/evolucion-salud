import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BookOpen, ClipboardCheck, Award, FileText, Clock, ListChecks } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { adminDb } from '@/lib/admin/data';
import { formatDate, formatCompact } from '@/lib/admin/format';
import { PageHeader, Card, StatCard, Badge, StatusBadge, Th, Td, EmptyState, ButtonLink } from '@/components/admin/ui';
import { getCourse } from '@/lib/courses/registry';

export const metadata: Metadata = { title: 'Detalle de curso | BackOffice' };
export const dynamic = 'force-dynamic';

const typeLabels: Record<string, string> = { free: 'Gratuito', paid: 'De pago', upcoming: 'Próximamente' };

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminRole('admin.courses.read');
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  const sb = adminDb();
  const [{ data: dbCourse }, { data: enrollments }, { count: certCount }, { count: quizCount }, { data: lessons }] =
    sb
      ? await Promise.all([
          sb.from('courses').select('id, status, updated_at, tags, seo').eq('slug', slug).maybeSingle(),
          sb.from('user_courses').select('status, progress_pct').eq('course_id', course.id),
          sb.from('certificates').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
          sb.from('user_quiz_attempts').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
          sb.from('course_lessons').select('id, lesson_key, title').eq('course_id', course.id),
        ])
      : [{ data: null }, { data: [] }, { count: 0 }, { count: 0 }, { data: [] }];

  const inProgress = (enrollments ?? []).filter((e) => e.status === 'in_progress').length;
  const completed = (enrollments ?? []).filter((e) => e.status === 'completed').length;

  const allLessons = course.modules.flatMap((m) => m.lessons ?? []);
  const videoCount = allLessons.filter((l) => l.type === 'video').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={course.title}
        description={course.subtitle}
        badge={
          <span className="flex gap-2">
            <Badge tone={course.type === 'free' ? 'leaf' : course.type === 'paid' ? 'brand' : 'clay'}>
              {typeLabels[course.type] ?? course.type}
            </Badge>
            <StatusBadge estado={course.status} />
          </span>
        }
        actions={<ButtonLink href="/admin/cursos">← Cursos</ButtonLink>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Inscripciones" value={formatCompact((enrollments ?? []).length)} hint={`${inProgress} en curso · ${completed} completados`} icon={BookOpen} tone="brand" />
        <StatCard label="Lecciones" value={formatCompact(allLessons.length)} hint={`${videoCount} de video · ${course.modules.length} módulos`} icon={ListChecks} tone="leaf" />
        <StatCard label="Certificados" value={formatCompact(certCount ?? 0)} icon={Award} tone="sun" />
        <StatCard label="Intentos de quiz" value={formatCompact(quizCount ?? 0)} icon={ClipboardCheck} tone="clay" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Detalle del Markdown" subtitle="Fuente de verdad: Cursos/*.md">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="text-slate-500 dark:text-slate-400">Slug</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-100">{course.slug}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Categoría</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-100">{course.category}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Nivel / Dificultad</dt>
            <dd className="font-semibold capitalize text-slate-800 dark:text-slate-100">{course.difficulty ?? course.level}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Duración</dt>
            <dd className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-100">
              <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              {course.duration}
            </dd>
            <dt className="text-slate-500 dark:text-slate-400">Actualizado</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-100">{formatDate(course.updatedAt)}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Tags</dt>
            <dd className="flex flex-wrap gap-1">
              {(course.tags ?? []).map((t) => (
                <Badge key={t} tone="slate">{t}</Badge>
              ))}
            </dd>
          </dl>
        </Card>

        <Card title="Estado en Supabase" subtitle="Catálogo sincronizado (npm run db:sync-catalog)">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="text-slate-500 dark:text-slate-400">ID de BD</dt>
            <dd className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">{dbCourse?.id ?? 'No sincronizado'}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Estado en BD</dt>
            <dd>
              {dbCourse ? <StatusBadge estado={dbCourse.status} /> : <Badge tone="clay">Falta sync</Badge>}
            </dd>
            <dt className="text-slate-500 dark:text-slate-400">Actualizado en BD</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-100">{dbCourse ? formatDate(dbCourse.updated_at) : '—'}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Lecciones en BD</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-100">{formatCompact((lessons ?? []).length)}</dd>
          </dl>
        </Card>
      </div>

      <Card title="Módulos y lecciones" subtitle={`${course.modules.length} módulos · ${allLessons.length} lecciones`} padded={false}>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {course.modules.map((m, mi) => (
            <li key={m.id ?? mi}>
              <div className="flex items-center gap-2 px-5 py-3">
                <Badge tone="brand">Módulo {mi + 1}</Badge>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{m.title}</span>
              </div>
              {(m.lessons ?? []).length > 0 ? (
                <table className="w-full">
                  <thead className="bg-slate-50/60 dark:bg-slate-900/60">
                    <tr>
                      <Th className="pl-10">Lección</Th>
                      <Th>Tipo</Th>
                      <Th>ID (clave de progreso)</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(m.lessons ?? []).map((l) => (
                      <tr key={l.id}>
                        <Td className="pl-10">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{l.title}</span>
                        </Td>
                        <Td>
                          <Badge tone="slate">{l.type}</Badge>
                        </Td>
                        <Td>
                          <code className="text-xs text-slate-500 dark:text-slate-400">{l.id}</code>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="px-5 pb-4 pl-10 text-sm text-slate-400">Sin lecciones.</p>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Bibliografía y recursos" subtitle="Referencias citadas en el curso">
        <div className="flex flex-wrap gap-2">
          <Badge tone="leaf">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" /> {course.bibliography?.length ?? 0} referencias
          </Badge>
          <Badge tone="slate">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" /> {course.resources?.length ?? 0} recursos
          </Badge>
        </div>
      </Card>
    </div>
  );
}
