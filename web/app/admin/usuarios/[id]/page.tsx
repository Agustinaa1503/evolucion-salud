import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Award, BookOpen, ClipboardCheck, Mail, Activity } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { permissionsForRole } from '@/lib/admin/rbac';
import { adminDb } from '@/lib/admin/data';
import { formatDate, formatDateTime, timeAgo, fullName, initials } from '@/lib/admin/format';
import { PageHeader, Card, StatCard, Badge, RoleBadge, StatusBadge, EmptyState, ButtonLink, Td, Th } from '@/components/admin/ui';
import AdminUserActions from '@/components/admin/AdminUserActions';
import { getAllCourses } from '@/lib/courses/registry';

export const metadata: Metadata = { title: 'Detalle de usuario | BackOffice' };
export const dynamic = 'force-dynamic';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdminRole('admin.users.read');
  const perms = permissionsForRole(session.profile?.rol);
  const { id } = await params;
  const sb = adminDb();

  const { data: profile } = sb
    ? await sb
        .from('profiles')
        .select('id, nombre, apellido, email, avatar_url, rol, estado, created_at, last_sign_in_at')
        .eq('id', id)
        .maybeSingle()
    : { data: null };
  if (!profile) notFound();

  const [{ data: courses }, { count: courseCount }, { count: certCount }, { count: quizCount }, { data: activity }] =
    sb
      ? await Promise.all([
          sb.from('user_courses').select('course_id, status, progress_pct, total_study_seconds, started_at, completed_at, last_access_at').eq('user_id', id),
          sb.from('user_courses').select('*', { count: 'exact', head: true }).eq('user_id', id),
          sb.from('certificates').select('*', { count: 'exact', head: true }).eq('user_id', id),
          sb.from('user_quiz_attempts').select('*', { count: 'exact', head: true }).eq('user_id', id),
          sb.from('activity_logs').select('event, created_at, payload').eq('user_id', id).order('created_at', { ascending: false }).limit(10),
        ])
      : [{ data: [] }, { count: 0 }, { count: 0 }, { count: 0 }, { data: [] }];

  const catalog = getAllCourses();
  const courseMap = new Map(catalog.map((c) => [String(c.id), c]));

  const courseRows = (courses ?? []).map((row) => {
    const meta = courseMap.get(String(row.course_id));
    return { ...row, slug: meta?.slug, title: meta?.title };
  });

  const { data: certs } = sb
    ? await sb.from('certificates').select('certificate_number, course_id, issued_at, created_at').eq('user_id', id).order('issued_at', { ascending: false })
    : { data: [] };

  const { data: quizzes } = sb
    ? await sb.from('user_quiz_attempts').select('score, max_score, passed, submitted_at').eq('user_id', id).order('submitted_at', { ascending: false }).limit(5)
    : { data: [] };

  const name = fullName(profile.nombre, profile.apellido);

  return (
    <div className="space-y-6">
      <PageHeader
        title={name}
        description={`${profile.email} · registrado el ${formatDate(profile.created_at)}`}
        badge={<RoleBadge rol={profile.rol} />}
        actions={
          <div className="flex gap-2">
            <ButtonLink href="/admin/usuarios">← Usuarios</ButtonLink>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Cursos" value={courseCount ?? 0} icon={BookOpen} tone="brand" />
        <StatCard label="Certificados" value={certCount ?? 0} icon={Award} tone="sun" />
        <StatCard label="Intentos de quiz" value={quizCount ?? 0} icon={ClipboardCheck} tone="leaf" />
        <StatCard label="Último acceso" value={<span className="text-base">{timeAgo(profile.last_sign_in_at)}</span>} icon={Mail} tone="clay" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Cuenta"
          subtitle="Rol y estado de la cuenta en la plataforma"
          actions={
            <div className="flex gap-2">
              <Badge tone="slate">{profile.estado ?? '—'}</Badge>
            </div>
          }
        >
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-2xl object-cover" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-xl font-extrabold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                {initials(profile.nombre, profile.apellido)}
              </span>
            )}
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
              <p className="mt-1 text-xs text-slate-400">ID: {profile.id}</p>
            </div>
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <AdminUserActions
              userId={profile.id}
              rol={profile.rol ?? 'guest'}
              estado={profile.estado ?? 'activo'}
              canWrite={perms.includes('admin.users.write')}
              canDelete={perms.includes('admin.users.delete')}
            />
          </div>
        </Card>

        <Card title="Cursos del alumno" subtitle="Inscripciones y progreso" padded={false}>
          {courseRows.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={BookOpen} title="Sin cursos" description="Este usuario todavía no se inscribió en ningún curso." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60">
                  <tr>
                    <Th>Curso</Th>
                    <Th>Estado</Th>
                    <Th>Progreso</Th>
                    <Th>Estudio</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {courseRows.map((row) => (
                    <tr key={`${row.course_id}-${row.status}`}>
                      <Td>
                        <span className="block max-w-[220px] truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {row.title ?? row.course_id}
                        </span>
                      </Td>
                      <Td>
                        <StatusBadge estado={row.status} />
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full rounded-full bg-brand-500" style={{ width: `${row.progress_pct ?? 0}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{row.progress_pct ?? 0}%</span>
                        </div>
                      </Td>
                      <Td>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(row.last_access_at)}</span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Certificados" subtitle="Emisiones de la cuenta" padded={false}>
          {!certs || certs.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Award} title="Sin certificados" description="Este usuario no ha emitido certificados todavía." />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {(certs ?? []).map((c) => {
                const meta = courseMap.get(String(c.course_id));
                return (
                  <li key={c.certificate_number} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{meta?.title ?? c.course_id}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{c.certificate_number}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{formatDate(c.issued_at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Intentos de cuestionarios" subtitle="Últimos 5 intentos con nota" padded={false}>
          {!quizzes || quizzes.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={ClipboardCheck} title="Sin intentos" description="El usuario no envió cuestionarios con nota todavía." />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {(quizzes ?? []).map((qa, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {qa.score}/{qa.max_score}
                  </span>
                  <StatusBadge estado={qa.passed ? 'aprobado' : 'no-aprobado'} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(qa.submitted_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Actividad reciente" subtitle="Últimos 10 eventos registrados" padded={false}>
        {!activity || activity.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={Activity} title="Sin actividad" description="Los eventos de curso aparecerán cuando el usuario avance." />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {(activity ?? []).map((a, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
                  {a.event}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ButtonLink href="/admin/usuarios">← Volver a Usuarios</ButtonLink>
    </div>
  );
}
