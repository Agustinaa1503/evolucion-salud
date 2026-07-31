import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Eye, HeartHandshake, Target } from 'lucide-react';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/motion/Reveal';
import Disclaimer from '@/components/Disclaimer';
import Icon from '@/components/Icon';
import { team } from '@/lib/data/site';
import { img } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Sobre nosotros',
  description:
    'Evolución Salud es una plataforma educativa de PsicoInmunoNeuroEndocrinología (PINE) de Córdoba, Argentina. Conocé nuestra misión, visión, enfoque y equipo.',
};

const pillars = [
  {
    icon: 'brain',
    title: 'Mente',
    text: 'Pensamientos, creencias y expectativas modulan tu biología celular.',
  },
  {
    icon: 'heart',
    title: 'Cuerpo',
    text: 'Sistema nervioso, sistema endocrino e inmunidad trabajan como una sola red.',
  },
  {
    icon: 'waves',
    title: 'Emociones',
    text: 'Las emociones son señales biológicas: reconocerlas es el primer paso para regularlas.',
  },
  {
    icon: 'moon',
    title: 'Hábitos',
    text: 'Sueño, alimentación, movimiento y ritmos circadianos como medicina cotidiana.',
  },
  {
    icon: 'users',
    title: 'Ambioma',
    text: 'La familia, el hogar y la red social son parte activa del proceso de salud.',
  },
  {
    icon: 'leaf',
    title: 'Prevención',
    text: 'Psicoeducación para que cada persona se convierta en protagonista de su bienestar.',
  },
];

export default function NosotrosPage() {
  return (
    <>
      <PageHero
        eyebrow="Sobre nosotros"
        title={
          <>
            Descubrí, inspirá, <span className="text-gradient">transformá</span>
          </>
        }
        description="Somos una plataforma educativa de Córdoba, Argentina, dedicada a la PsicoInmunoNeuroEndocrinología (PINE). Integramos mente, cuerpo, emociones, hábitos y salud para democratizar el conocimiento científico."
        image={img.teamMeet}
      />

      <section className="container-page py-16 lg:py-24">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="group h-full rounded-3xl border border-slate-200/80 bg-white p-8 shadow-card transition duration-500 hover:-translate-y-1 hover:shadow-lift sm:p-10">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                <Target className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-xl font-extrabold text-slate-900">Nuestra misión</h2>
              <p className="mt-3 leading-relaxed text-slate-600">
                Democratizar el conocimiento científico sobre salud integral:
                acercar la PINE a profesionales y al público general en un
                lenguaje claro, cálido y riguroso, sin diagnóstico a distancia y
                siempre dentro del marco de la psicoeducación.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="group h-full rounded-3xl border border-slate-200/80 bg-white p-8 shadow-card transition duration-500 hover:-translate-y-1 hover:shadow-lift sm:p-10">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                <Eye className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-xl font-extrabold text-slate-900">Nuestra visión</h2>
              <p className="mt-3 leading-relaxed text-slate-600">
                Ser líderes en PINE en el mundo hispanohablante: la referencia
                cuando alguien busca entender la conexión entre lo que siente,
                piensa y vive, y cómo eso impacta en su salud.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-50 py-16 lg:py-24">
        <div className="absolute inset-0 bg-dots opacity-40" aria-hidden="true" />
        <div className="container-page relative">
          <div className="grid gap-12 lg:grid-cols-5 lg:items-center">
            <div className="lg:col-span-2">
              <Reveal>
                <span className="eyebrow">Enfoque PINE</span>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                  Un paradigma integrativo
                </h2>
                <p className="mt-4 leading-relaxed text-slate-600">
                  La PsicoInmunoNeuroEndocrinología estudia la comunicación
                  entre la mente, el sistema nervioso, el sistema endocrino y
                  el sistema inmunológico. Estos son nuestros pilares.
                </p>
              </Reveal>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:col-span-3">
              {pillars.map((p, i) => (
                <Reveal key={p.title} delay={i * 0.06}>
                  <div className="group h-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card transition duration-500 hover:-translate-y-1 hover:shadow-lift">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                      <Icon name={p.icon} className="h-6 w-6" />
                    </span>
                    <h3 className="mt-4 text-lg font-extrabold text-slate-900">{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16 lg:py-24">
        <Reveal>
          <div className="text-center">
            <span className="eyebrow mx-auto">Equipo</span>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Las licenciadas detrás de Evolución Salud
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Un equipo clínico que une rigor científico, experiencia en alta
              complejidad y calidez humana.
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-7 md:grid-cols-3">
          {team.map((member, i) => (
            <Reveal key={member.name} delay={i * 0.1}>
              <div className="group flex h-full flex-col items-center rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-card transition duration-500 hover:-translate-y-1 hover:shadow-lift">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-brand-500 to-clay-500 opacity-40 blur-lg transition group-hover:opacity-80" aria-hidden="true" />
                  <span className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-leaf-600 text-2xl font-extrabold text-white shadow-lg">
                    {member.initials}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-extrabold text-slate-900">{member.name}</h3>
                <p className="mt-1 text-sm font-bold text-brand-700">{member.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{member.bio}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-page pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-leaf-800 p-8 text-white sm:p-12">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-leaf-400/20 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <HeartHandshake className="h-10 w-10 text-leaf-100" aria-hidden="true" />
              <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">Nuestro compromiso</h2>
              <p className="mt-4 max-w-2xl leading-relaxed text-leaf-50/90">
                Todo nuestro contenido es psicoeducativo: busca informar, inspirar
                y acompañar, nunca reemplazar la atención médica. Creemos que la
                persona informada y reconocida es la protagonista de su propio
                proceso de salud.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/cursos" className="btn-dark">
                  Explorar los cursos
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/contacto" className="btn-outline border-white/30 bg-white/10 text-white hover:bg-white/20">
                  Escribinos
                </Link>
              </div>
              <Disclaimer className="mt-8 max-w-xl border-amber-200/40 bg-white/10 text-amber-50" />
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
