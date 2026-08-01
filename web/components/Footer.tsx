import Link from 'next/link';
import Image from 'next/image';
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Play,
  Radio,
  ThumbsUp,
  Youtube,
} from 'lucide-react';
import { site, socialLinks, whatsappLink } from '@/lib/data/site';
import Disclaimer from './Disclaimer';

const navColumns = [
  {
    title: 'Navegación',
    links: [
      { href: '/', label: 'Inicio' },
      { href: '/cursos', label: 'Cursos y capacitaciones' },
      { href: '/biblioteca', label: 'Catálogo' },
      { href: '/tienda', label: 'Tienda de guías' },
      { href: '/blog', label: 'Blog' },
      { href: '/nosotros', label: 'Sobre nosotros' },
      { href: '/contacto', label: 'Contacto' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { href: '/descarga-gratuita', label: 'Checklist Matriz PINE (gratis)' },
      { href: '/cuestionario', label: 'Cuestionario Matriz PINE' },
      { href: '/newsletter', label: 'Newsletter semanal' },
      { href: '/podcast', label: 'Podcast' },
      { href: '/categorias', label: 'Categorías' },
      { href: '/tags', label: 'Etiquetas' },
      { href: '/carrito', label: 'Carrito' },
    ],
  },
];

const socialIcon = (label: string) => {
  switch (label) {
    case 'Instagram':
      return <Instagram className="h-4 w-4" aria-hidden="true" />;
    case 'Facebook':
      return <Facebook className="h-4 w-4" aria-hidden="true" />;
    case 'TikTok':
      return <Music2 className="h-4 w-4" aria-hidden="true" />;
    case 'LinkedIn':
      return <Linkedin className="h-4 w-4" aria-hidden="true" />;
    case 'Threads':
      return <Radio className="h-4 w-4" aria-hidden="true" />;
    case 'Pinterest':
      return <ThumbsUp className="h-4 w-4" aria-hidden="true" />;
    case 'YouTube':
      return <Youtube className="h-4 w-4" aria-hidden="true" />;
    default:
      return <Play className="h-4 w-4" aria-hidden="true" />;
  }
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-ink-950 text-slate-300">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-leaf-500/10 blur-3xl" />

      <div className="container-page relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-glow ring-1 ring-white/10">
              <Image
                src="/logo.png"
                alt="Logo de Evolución Salud"
                width={44}
                height={44}
                className="h-full w-full object-contain p-1"
              />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-extrabold tracking-tight text-white">
                Evolución Salud
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-leaf-300">
                Líderes en PINE
              </span>
            </span>
          </Link>
          <p className="mt-5 text-sm leading-relaxed text-slate-400">
            Plataforma educativa de PsicoInmunoNeuroEndocrinología. {site.tagline}
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-slate-400">
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-leaf-400" aria-hidden="true" />
              <a href={`mailto:${site.email}`} className="transition hover:text-leaf-300">
                {site.email}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <MessageCircle className="h-4 w-4 shrink-0 text-leaf-400" aria-hidden="true" />
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-leaf-300"
              >
                {site.whatsapp.display}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-leaf-400" aria-hidden="true" />
              {site.location}
            </li>
          </ul>
        </div>

        {navColumns.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              {col.title}
            </h3>
            <ul className="mt-5 space-y-3">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-sm text-slate-400 transition hover:text-leaf-300"
                  >
                    <span className="h-px w-3 bg-slate-600 transition group-hover:w-5 group-hover:bg-leaf-400" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Redes</h3>
          <div className="mt-5 grid grid-cols-4 gap-2">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={s.label}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:-translate-y-0.5 hover:border-leaf-400/50 hover:text-leaf-300"
              >
                {socialIcon(s.label)}
              </a>
            ))}
          </div>
          <Link
            href="/newsletter"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            Suscríbete a la newsletter
          </Link>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="container-page py-8">
          <Disclaimer className="text-slate-500" />
          <p className="mt-5 text-xs leading-relaxed text-slate-500">
            © {year} Evolución Salud · {site.location} · Todos los derechos
            reservados. El contenido de este sitio es de carácter psicoeducativo
            y no constituye práctica clínica a distancia.
          </p>
        </div>
      </div>
    </footer>
  );
}
