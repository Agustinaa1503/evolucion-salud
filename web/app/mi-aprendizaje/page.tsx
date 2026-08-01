import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, Clock, GraduationCap, Inbox } from 'lucide-react';
import PageHero from '@/components/PageHero';
import MyCourseCard from '@/components/lms/MyCourseCard';
import NotificationsList from '@/components/lms/NotificationsList';
import { requireUser } from '@/lib/auth/session';
import { getMyLearning } from '@/lib/lms/actions';
import { formatStudyTime } from '@/lib/lms/progress';
import { getCourse } from '@/lib/courses/registry';

export const metadata: Metadata = {
  title: 'Mi aprendizaje',
  robots: { index: false, follow: false },
};

const stats = [
  { key: 'inProgress', label: 'Cursos en curso', icon: BookOpen, color: 'text-brand-700 bg-brand-50' },
  { key: 'completed', label: 'Completados', icon: CheckCircle2, color: 'text-leaf-700 bg-leaf-50' },
  { key: 'studyTime', label: 'Tiempo de estudio', icon: Clock, color: 'text-clay-700 bg-clay-50' },
] as const;

export default async function MyLearningPage() {
  await requireUser();
  const data = await getMyLearning();

  return (
    <>
      <PageHero
        eyebrow="Mi cuenta"
        title="Mi aprendizaje"
        description="Siga el progreso de sus cursos, retome donde quedó y consulte sus notificaciones."
      />

      <section className="container-page py-12 lg:py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card">
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stats[0].color}`}>
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{data.stats.inProgress}</p>
              <p className="text-sm font-medium text-slate-500">Cursos en curso</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card">
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stats[1].color}`}>
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{data.stats.completed}</p>
              <p className="text-sm font-medium text-slate-500">Completados</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card">
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stats[2].color}`}>
              <Clock className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">
                {formatStudyTime(data.stats.totalStudySeconds)}
              </p>
              <p className="text-sm font-medium text-slate-500">Tiempo de estudio</p>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-6 w-6 text-brand-700" aria-hidden="true" />
              <h2 className="text-xl font-extrabold text-slate-900">Mis cursos</h2>
            </div>

            {data.courses.length === 0 ? (
              <div className="mt-6 flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 p-12 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-card">
                  <Inbox className="h-7 w-7" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-slate-800">Aún no inscribiste cursos</h3>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Cuando comiences un curso, aparecerá acá con tu avance. Empieza gratis con
                  nuestras propuestas introductorias.
                </p>
                <Link href="/cursos" className="btn-primary mt-6">
                  Explorar cursos
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {data.courses.map((course) => (
                  <MyCourseCard key={course.slug} course={course} catalog={getCourse(course.slug)} />
                ))}
              </div>
            )}
          </div>

          <aside>
            <div className="flex items-center gap-3">
              <span className="relative flex h-6 w-6 items-center justify-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <span className="text-sm font-extrabold leading-none">{data.unreadCount}</span>
                </span>
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">Notificaciones</h2>
            </div>
            <div className="mt-6">
              <NotificationsList notifications={data.notifications} />
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
