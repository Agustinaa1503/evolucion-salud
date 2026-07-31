import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, GraduationCap, HeartPulse, Users } from 'lucide-react';
import CourseCard from '@/components/CourseCard';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/motion/Reveal';
import Icon from '@/components/Icon';
import { getFreeCourses, getPublicCourses, getUpcomingCourses } from '@/lib/courses/registry';
import { img } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Cursos y capacitaciones PINE',
  description:
    'Cursos gratuitos y formaciones de PsicoInmunoNeuroEndocrinología (PINE): PINE en 15 minutos, Estrés Ocupacional e Introducción a la PINE (próximo lanzamiento).',
};

const features = [
  {
    icon: 'clock',
    title: 'Autoasistido',
    text: 'Avance a su ritmo, desde cualquier dispositivo y sin horarios.',
  },
  {
    icon: 'users',
    title: 'Todo público y profesionales',
    text: 'Niveles adaptados: desde la primera aproximación hasta la formación avanzada.',
  },
  {
    icon: 'heart',
    title: 'Rigor científico',
    text: 'Contenido psicoeducativo con evidencia, revisado por el equipo de licenciadas.',
  },
];

export default function CursosPage() {
  const publicCourses = getPublicCourses();
  const free = getFreeCourses();
  const upcoming = getUpcomingCourses();

  return (
    <>
      <PageHero
        eyebrow="Cursos y capacitaciones"
        title={
          <>
            Formación en PINE, <span className="text-gradient">a tu ritmo</span>
          </>
        }
        description="Cursos autoasistidos con rigor científico y lenguaje claro. Empieza gratis y profundiza cuando estés listo."
        image={img.library}
      />

      <section className="container-page py-16 lg:py-24">
        {free.length ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  Cursos gratuitos disponibles
                </h2>
                <p className="mt-2 max-w-xl text-slate-600">
                  Empiece hoy mismo, sin costo y sin inscripción previa.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-leaf-50 px-4 py-1.5 text-xs font-bold text-leaf-700">
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                {free.length} {free.length === 1 ? 'curso' : 'cursos'} gratis
              </span>
            </div>
            <div className="mt-8 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {free.map((course, i) => (
                <Reveal key={course.slug} delay={i * 0.07}>
                  <CourseCard course={course} />
                </Reveal>
              ))}
            </div>
          </>
        ) : null}

        {upcoming.length ? (
          <div className="mt-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  Próximos lanzamientos
                </h2>
                <p className="mt-2 max-w-xl text-slate-600">
                  Formaciones en desarrollo. Anótese para recibir novedades del lanzamiento.
                </p>
              </div>
            </div>
            <div className="mt-8 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((course, i) => (
                <Reveal key={course.slug} delay={i * 0.07}>
                  <CourseCard course={course} />
                </Reveal>
              ))}
            </div>
          </div>
        ) : null}

        <Reveal>
          <div className="mt-16 flex h-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-8 text-center transition hover:border-brand-400">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-leaf-600 text-white shadow-lift">
              <GraduationCap className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-extrabold text-slate-900">
              ¿Quiere una formación a medida?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Diseñamos talleres y capacitaciones para instituciones y equipos de
              salud, presenciales y online.
            </p>
            <Link href="/contacto" className="btn-secondary mt-6">
              Contáctenos
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <div className="group flex h-full items-start gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card transition duration-500 hover:-translate-y-1 hover:shadow-lift">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                  <Icon name={f.icon} className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-extrabold text-slate-900">{f.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{f.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-slate-400">
          {publicCourses.length} {publicCourses.length === 1 ? 'curso' : 'cursos'} en el catálogo · El
          contenido es psicoeducativo y no reemplaza la consulta con un profesional de la salud.
        </p>
      </section>
    </>
  );
}
