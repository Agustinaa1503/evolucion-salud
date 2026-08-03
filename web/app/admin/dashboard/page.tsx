import {
  Award,
  BookOpen,
  ClipboardCheck,
  Clock,
  Mail,
  TrendingUp,
  UserRound,
  Users,
  Activity,
} from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { adminDb, countWhere, bucketByDay, bucketByWeek } from '@/lib/admin/data';
import { formatCompact, formatDateTime, timeAgo } from '@/lib/admin/format';
import { PageHeader, StatCard, Card, Badge, EmptyState } from '@/components/admin/ui';
import { BarChart, DonutChart } from '@/components/admin/charts';
import { ROLE_LABELS, type Role } from '@/lib/admin/rbac';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await requireAdminRole('admin.dashboard');
  const sb = adminDb();

  const [totalUsers, newUsers30, courses, activeCourses, subscribers, waitlist, certificates, quizAttempts] =
    await Promise.all([
      countWhere(sb, 'profiles'),
      sb
        ? sb
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
        : null,
      countWhere(sb, 'courses'),
      sb ? sb.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'published') : null,
      countWhere(sb, 'newsletter_subscribers'),
      countWhere(sb, 'course_waitlist'),
      countWhere(sb, 'certificates'),
      countWhere(sb, 'user_quiz_attempts'),
    ]);

  const [inProgress, completed] = await Promise.all([
    countWhere(sb, 'user_courses', 'status', 'in_progress'),
    countWhere(sb, 'user_courses', 'status', 'completed'),
  ]);

  const [{ data: profileRows }, { data: activityRows }, { data: recentAudit }] = await Promise.all([
    sb ? sb.from('profiles').select('created_at, last_sign_in_at') : Promise.resolve({ data: null }),
    sb ? sb.from('activity_logs').select('created_at') : Promise.resolve({ data: null }),
    sb
      ? sb
          .from('admin_audit_logs')
          .select('id, action, category, target_type, target_id, detail, created_at, profiles(email, nombre, apellido)')
          .order('created_at', { ascending: false })
          .limit(8)
      : Promise.resolve({ data: null }),
  ]);

  const profileDates = (profileRows ?? []).map((p) => p.created_at);
  const activityDates = (activityRows ?? []).map((a) => a.created_at);

  const weekly = bucketByWeek(profileDates, 8);
  const dailyActivity = bucketByDay(activityDates, 7);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Resumen general de la plataforma educativa. Los números se actualizan con cada consulta; las tendencias se preparan para la FASE 12 (analytics)."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Usuarios registrados" value={formatCompact(totalUsers)} hint={`+${formatCompact(newUsers30?.count ?? 0)} en 30 días`} icon={Users} tone="brand" />
        <StatCard label="Cursos activos" value={formatCompact(activeCourses?.count ?? 0)} hint={`${formatCompact(courses)} en catálogo`} icon={BookOpen} tone="leaf" />
        <StatCard label="Suscriptores" value={formatCompact(subscribers)} hint={`${formatCompact(waitlist)} en lista de espera`} icon={Mail} tone="clay" />
        <StatCard label="Certificados emitidos" value={formatCompact(certificates)} hint={`${formatCompact(quizAttempts)} intentos de quiz`} icon={Award} tone="sun" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          title="Registros semanales"
          subtitle="Altas de usuarios por semana (últimas 8)"
          padded={false}
          className="lg:col-span-2"
        >
          <div className="p-5">
            {weekly.every((w) => w.value === 0) ? (
              <EmptyState
                icon={UserRound}
                title="Sin registros todavía"
                description="Cuando haya usuarios, verá la tendencia de altas semanales."
              />
            ) : (
              <BarChart data={weekly} tone="brand" height={180} />
            )}
          </div>
        </Card>

        <Card title="Inscripciones" subtitle="Distribución de cursos del alumno">
          <DonutChart
            label={formatCompact(inProgress + completed)}
            segments={[
              { label: 'En curso', value: inProgress, color: '#762d8f' },
              { label: 'Completados', value: completed, color: '#38805a' },
            ]}
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Actividad de aprendizaje" subtitle="Eventos por día (últimos 7 días)" padded={false} className="lg:col-span-2">
          <div className="p-5">
            {activityDates.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="Sin actividad registrada"
                description="Los eventos de curso (inicio, lecciones, videos, quizzes) aparecerán aquí."
              />
            ) : (
              <BarChart data={dailyActivity} tone="leaf" height={160} />
            )}
          </div>
        </Card>

        <Card title="Actividad reciente" subtitle="Últimos eventos de auditoría" padded={false}>
          {!sb || recentAudit?.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={Clock}
                title="Sin eventos"
                description="Los inicios de sesión de administradores y los cambios quedan registrados en Logs."
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {(recentAudit ?? []).map((log) => {
                const who = log.profiles
                  ? [log.profiles.nombre, log.profiles.apellido].filter(Boolean).join(' ') || log.profiles.email
                  : 'Sistema';
                return (
                  <li key={log.id} className="flex items-start gap-3 px-5 py-3">
                    <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {log.action} <span className="text-slate-400">·</span>{' '}
                        <span className="font-normal text-slate-500 dark:text-slate-400">{who}</span>
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Badge tone="slate">{log.category}</Badge>
                        <span className="truncate">{log.target_type}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(log.created_at)} · {formatDateTime(log.created_at)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Roles del equipo" subtitle="Cuentas habilitadas en el BackOffice">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(['super_admin', 'admin', 'editor', 'teacher'] as const).map((rol) => (
            <div key={rol} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {ROLE_LABELS[rol as Role]}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {rol === 'super_admin' ? 'Acceso total' : rol === 'admin' ? 'Gestión total' : rol === 'editor' ? 'Contenido' : 'Cursos'}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
