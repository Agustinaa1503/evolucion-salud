import Link from 'next/link';
import {
  ArrowRight,
  Brain,
  ClipboardCheck,
  Clock3,
  Headphones,
  MessageCircle,
  Quote,
  Sparkles,
  Users,
} from 'lucide-react';
import HomeHero from '@/components/home/HomeHero';
import SectionHeading from '@/components/SectionHeading';
import Reveal from '@/components/motion/Reveal';
import Marquee from '@/components/motion/Marquee';
import Carousel from '@/components/motion/Carousel';
import CourseCard from '@/components/CourseCard';
import ProductCard from '@/components/ProductCard';
import BlogCard from '@/components/BlogCard';
import NewsletterForm from '@/components/NewsletterForm';
import Disclaimer from '@/components/Disclaimer';
import Icon from '@/components/Icon';
import { site, whatsappLink } from '@/lib/data/site';
import { getFreeCourses } from '@/lib/courses/registry';
import { featuredProducts } from '@/lib/data/products';
import { featuredPosts } from '@/lib/data/blog';
import { podcast } from '@/lib/data/podcast';
import { testimonials, testimonialsNote } from '@/lib/data/testimonials';
import { img } from '@/lib/images';

const pillars = [
  {
    icon: 'brain',
    title: 'Mente',
    text: 'Cómo tus pensamientos y creencias modulan tu biología celular.',
    gradient: 'from-clay-500 to-leaf-600',
  },
  {
    icon: 'heart',
    title: 'Cuerpo',
    text: 'El sistema nervioso, las hormonas y la inmunidad trabajando en red.',
    gradient: 'from-sky-500 to-indigo-600',
  },
  {
    icon: 'waves',
    title: 'Emociones',
    text: 'Las emociones como señales biológicas que se transforman en materia.',
    gradient: 'from-violet-500 to-purple-700',
  },
  {
    icon: 'moon',
    title: 'Hábitos',
    text: 'Sueño, alimentación y ritmos circadianos como medicina cotidiana.',
    gradient: 'from-amber-500 to-orange-600',
  },
];

const marqueeTopics = [
  'Mente',
  'Cuerpo',
  'Emociones',
  'Hábitos',
  'Sueño',
  'Cronobiología',
  'Carga alostática',
  'Ambioma',
  'Regulación emocional',
  'Respiración vagal',
  'Psicoinmunoneuroendocrinología',
];

export default function HomePage() {
  return (
    <>
      <HomeHero />

      {/* ============ MARQUEE ============ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-700 via-leaf-600 to-brand-700 py-4">
        <Marquee>
          {marqueeTopics.map((topic) => (
            <span
              key={topic}
              className="mx-6 flex items-center gap-3 whitespace-nowrap text-sm font-bold uppercase tracking-widest text-white/90"
            >
              <Sparkles className="h-3.5 w-3.5 text-leaf-200" aria-hidden="true" />
              {topic}
            </span>
          ))}
        </Marquee>
      </div>

      {/* ============ PILARES PINE ============ */}
      <section className="container-page py-20 lg:py-28">
        <SectionHeading
          eyebrow="Enfoque PINE"
          title="Mente, cuerpo, emociones, hábitos: un solo sistema"
          description="La PsicoInmunoNeuroEndocrinología estudia cómo se comunican tu cerebro, tus hormonas y tu sistema inmunológico. El estrés, el sueño, la alimentación y tu entorno no son temas separados: son un mismo entramado biológico."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 shadow-card transition duration-500 hover:-translate-y-1.5 hover:shadow-lift">
                <div
                  className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${p.gradient} opacity-10 blur-2xl transition group-hover:opacity-25`}
                />
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${p.gradient} text-white shadow-lift transition duration-500 group-hover:rotate-6 group-hover:scale-110`}
                >
                  <Icon name={p.icon} className="h-7 w-7" />
                </span>
                <h3 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {p.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ QUÉ ES LA PINE ============ */}
      <section className="relative overflow-hidden bg-slate-50 py-20 lg:py-28">
        <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-60" />
        <div className="container-page relative grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              <div className="overflow-hidden rounded-[2rem] shadow-lift">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.pineMindful}
                  alt="Naturaleza en calma"
                  className="h-[26rem] w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-lift sm:-right-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                  <Brain className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Neurociencia</p>
                  <p className="text-xs text-slate-500">traducida a tu día a día</p>
                </div>
              </div>
            </div>
          </Reveal>
          <div>
            <SectionHeading
              align="left"
              eyebrow="¿Qué es la PINE?"
              title="Una sola biología, una sola historia"
              description="Tus pensamientos no son solo 'mentales', tus emociones no son solo 'psicológicas'. Cada uno de ellos produce moléculas que circulan por tu cuerpo, cambian tu inmunidad y condicionan tu recuperación."
            />
            <Reveal delay={0.1}>
              <ul className="mt-8 space-y-4">
                {[
                  {
                    title: 'El estrés se transforma en materia',
                    text: 'Carga alostática: el costo biológico de vivir en alerta.',
                  },
                  {
                    title: 'El sueño repara o desgasta',
                    text: 'Cronobiología y melatonina como medicina cotidiana.',
                  },
                  {
                    title: 'El entorno te sostiene',
                    text: 'Ambioma: el clima físico y emocional que te rodea.',
                  },
                ].map((f) => (
                  <li key={f.title} className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-brand-200">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
                    <div>
                      <p className="font-bold text-slate-900">{f.title}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{f.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-8">
                <Link href="/cursos" className="btn-primary group">
                  Aprende las bases gratis
                  <ArrowRight
                    className="h-4 w-4 transition group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ CURSOS ============ */}
      <section className="container-page py-20 lg:py-28">
        <SectionHeading
          eyebrow="Cursos y capacitaciones"
          title="Aprende PINE a tu ritmo, gratis"
          description="Formaciones autoasistidas con rigor científico y lenguaje claro. Para público general y profesionales."
        />
        <Reveal className="mt-14">
          <Carousel auto intervalMs={6000}>
            {getFreeCourses().map((course) => (
              <div
                key={course.slug}
                className="snap-card w-[19rem] shrink-0 sm:w-[21rem]"
              >
                <CourseCard course={course} />
              </div>
            ))}
          </Carousel>
        </Reveal>
        <Reveal className="mt-10 text-center">
          <Link href="/cursos" className="btn-outline group">
            Ver todos los cursos
            <ArrowRight
              className="h-4 w-4 transition group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </Reveal>
      </section>

      {/* ============ TIENDA ============ */}
      <section className="bg-slate-50 py-20 lg:py-28">
        <div className="container-page">
          <SectionHeading
            eyebrow="Tienda de guías"
            title="Recursos descargables para tu proceso"
            description="Guías, meditaciones y protocolos basados en la escalera de valor PINE: empieza gratis y profundiza cuando estés listo."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product, i) => (
              <Reveal key={product.slug} delay={i * 0.08}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 text-center">
            <Link href="/tienda" className="btn-outline group">
              Ver toda la tienda
              <ArrowRight
                className="h-4 w-4 transition group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ============ LEAD MAGNET ============ */}
      <section className="container-page py-20 lg:py-28">
        <Reveal>
          <div className="relative grid overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-leaf-700 to-leaf-800 lg:grid-cols-2">
            <div className="bg-dots pointer-events-none absolute inset-0 opacity-40" />
            <div className="relative p-10 sm:p-14">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-leaf-100 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Recurso gratis
              </span>
              <h2 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                Descargá la Checklist Matriz PINE
              </h2>
              <p className="mt-4 max-w-lg leading-relaxed text-leaf-50/90">
                Un checklist imprimible de autorreconocimiento para las primeras
                72 horas después de un diagnóstico o ante una cirugía
                programada. Es tu punto de partida: registrá, regulá y
                organizá tu ambioma.
              </p>
              <ul className="mt-7 space-y-3 text-sm text-leaf-50/90">
                {[
                  'Registro de sueño, tensión y emociones',
                  'Respiración vagal y hábitos de descanso',
                  'Organización de la red de apoyo familiar',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
                      <ClipboardCheck className="h-3.5 w-3.5 text-leaf-200" aria-hidden="true" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/descarga-gratuita" className="btn-white mt-9 group">
                Quiero la checklist gratis
                <ArrowRight
                  className="h-4 w-4 transition group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
            <div className="relative hidden items-center justify-center p-10 lg:flex">
              <div className="relative">
                <div className="absolute -inset-6 rounded-[2rem] bg-white/10 blur-2xl" />
                <div className="relative rotate-2 overflow-hidden rounded-2xl border border-white/25 bg-white/95 p-6 shadow-glass">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <p className="text-sm font-extrabold text-slate-900">
                      Checklist Matriz PINE
                    </p>
                    <span className="rounded-full bg-leaf-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-leaf-700">
                      72 hs
                    </span>
                  </div>
                  {['Sueño', 'Tensión', 'Emociones', 'Red de apoyo'].map((row) => (
                    <div key={row} className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-400" />
                      <span className="text-sm font-medium text-slate-600">{row}</span>
                      <span className="ml-auto flex gap-1">
                        {[0, 1, 2, 3].map((d) => (
                          <span key={d} className="h-2.5 w-6 rounded-full bg-brand-100" />
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ CUESTIONARIO ============ */}
      <section className="relative overflow-hidden bg-ink-950 py-20 lg:py-28">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -right-32 top-10 h-96 w-96 animate-blob rounded-full bg-brand-500/15 blur-3xl" />
        <div className="container-page relative grid gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              align="left"
              light
              eyebrow="Cuestionario Matriz PINE"
              title="Descubre tu propio Mapa PINE"
              description="Un cuestionario de autorreconocimiento de 1 a 10 en percepción, activación corporal y ambioma. No es un diagnóstico: es una guía psicoeducativa para que cada persona identifique su propio proceso. Por eso es individual e intransferible."
            />
            <div className="mt-10 space-y-5">
              {[
                {
                  title: 'Responde de forma individual',
                  text: 'Paciente, familiar o profesional: cada quien completa su propia matriz.',
                },
                {
                  title: 'Recibe tu Mapa PINE',
                  text: 'El sistema analiza tus respuestas y te muestra qué áreas necesitan foco.',
                },
                {
                  title: 'Habilita tu acceso',
                  text: 'Con tu código personal accedes a las herramientas y guías recomendadas para tu perfil.',
                },
              ].map((step, i) => (
                <Reveal key={step.title} delay={i * 0.08}>
                  <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-brand-400/40">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-leaf-600 text-sm font-extrabold text-white shadow-glow">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-bold text-white">{step.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-400">
                        {step.text}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.25}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/cuestionario" className="btn-primary">
                  Completar el cuestionario
                </Link>
                <Link
                  href="/descarga-gratuita"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Empezar con la checklist gratis
                </Link>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="overflow-hidden rounded-[2rem] border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.pineNature}
                  alt="Naturaleza y bienestar"
                  className="h-[26rem] w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-4 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl sm:-left-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-white">Personal</p>
                  <p className="text-xs text-leaf-200">Tu proceso, tu mapa</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ PODCAST ============ */}
      <section className="container-page py-20 lg:py-28">
        <SectionHeading
          eyebrow="Podcast"
          title="PINE en tus oídos"
          description={podcast.description}
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {podcast.episodes.slice(0, 3).map((ep, i) => (
            <Reveal key={ep.slug} delay={i * 0.08}>
              <Link
                href="/podcast"
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card transition duration-500 hover:-translate-y-1.5 hover:shadow-lift"
              >
                <div className="relative h-44 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ep.image}
                    alt={ep.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <span className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur">
                    <Headphones className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="absolute bottom-4 left-4 rounded-full bg-black/45 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                    {ep.duration}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-600">
                    Episodio
                  </p>
                  <h3 className="mt-1.5 font-bold leading-snug text-slate-900 transition group-hover:text-brand-700">
                    {ep.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-2">
                    {ep.description}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-brand-600">
                    Escuchar episodio
                    <ArrowRight
                      className="h-4 w-4 transition group-hover:translate-x-1.5"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10 text-center">
          <Link href="/podcast" className="btn-outline group">
            Ver todos los episodios
            <ArrowRight
              className="h-4 w-4 transition group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </Reveal>
      </section>

      {/* ============ BLOG ============ */}
      <section className="bg-slate-50 py-20 lg:py-28">
        <div className="container-page">
          <SectionHeading
            eyebrow="Blog"
            title="Aprendé con nuestros artículos"
            description="Contenido divulgativo de PINE con evidencia científica, en lenguaje claro."
          />
          <Reveal className="mt-14">
            <Carousel>
              {featuredPosts.map((post) => (
                <div
                  key={post.slug}
                  className="snap-card w-[20rem] shrink-0 sm:w-[22rem]"
                >
                  <BlogCard post={post} />
                </div>
              ))}
            </Carousel>
          </Reveal>
          <Reveal className="mt-10 text-center">
            <Link href="/blog" className="btn-outline group">
              Ver todos los artículos
              <ArrowRight
                className="h-4 w-4 transition group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ============ TESTIMONIOS ============ */}
      <section className="container-page py-20 lg:py-28">
        <SectionHeading
          eyebrow="Testimonios"
          title="Lo que dicen quienes participan"
        />
        <Reveal className="mt-14">
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.author}
                className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white to-brand-50/40 p-7 shadow-card transition duration-500 hover:-translate-y-1.5 hover:shadow-lift"
              >
                <Quote className="h-9 w-9 text-brand-300" aria-hidden="true" />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-700">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-brand-100 pt-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-leaf-600 text-xs font-extrabold text-white">
                    {t.author.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.author}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
        <p className="mt-8 text-center text-xs text-slate-400">{testimonialsNote}</p>
      </section>

      {/* ============ NEWSLETTER ============ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-leaf-700 to-leaf-800 py-20 lg:py-28">
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-40" />
        <div className="container-page relative">
          <SectionHeading
            light
            eyebrow="Newsletter"
            title="Un email por semana para tu bienestar"
            description="Contenido educativo PINE, herramientas prácticas y novedades. Sin spam, gratis, y con baja fácil."
          />
          <Reveal className="mx-auto mt-10 max-w-xl">
            <div className="rounded-3xl border border-white/20 bg-white/10 p-2 backdrop-blur-xl">
              <NewsletterForm />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ CTA WHATSAPP ============ */}
      <section className="container-page py-20 lg:py-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-brand-50 via-white to-leaf-50 p-10 text-center sm:p-14">
            <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-40" />
            <div className="relative">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-whatsapp to-whatsapp-dark text-white shadow-lift">
                <MessageCircle className="h-8 w-8" aria-hidden="true" />
              </span>
              <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                ¿Tienes dudas o quieres información para tu institución?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-600">
                Escríbenos por WhatsApp. Atendemos consultas sobre cursos,
                guías, talleres presenciales y formaciones para equipos de
                salud.
              </p>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-dark group mt-8"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Escríbenos a {site.whatsapp.display}
              </a>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                  Respuesta en el día
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ClipboardCheck className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                  Asesoramiento psicoeducativo
                </span>
              </div>
              <Disclaimer className="mx-auto mt-6 max-w-md" />
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
