'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  GraduationCap,
  Heart,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingCart,
  UserRound,
  X,
} from 'lucide-react';
import { useCart } from './CartProvider';
import { useAuth } from '@/components/auth/AuthProvider';

const nav = [
  { href: '/', label: 'Inicio' },
  { href: '/cursos', label: 'Cursos' },
  { href: '/tienda', label: 'Tienda' },
  { href: '/cuestionario', label: 'Cuestionario' },
  { href: '/podcast', label: 'Podcast' },
  { href: '/blog', label: 'Blog' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/contacto', label: 'Contacto' },
];

export default function Header() {
  const pathname = usePathname();
  const { count } = useCart();
  const { user, profile, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const initials =
    `${profile?.nombre?.[0] ?? ''}${profile?.apellido?.[0] ?? ''}`.toUpperCase() ||
    'ES';

  const userLinks = [
    { href: '/mi-aprendizaje', label: 'Mi aprendizaje', icon: GraduationCap },
    { href: '/mis-favoritos', label: 'Mis favoritos', icon: Heart },
    { href: '/profile', label: 'Mi perfil', icon: UserRound },
    { href: '/settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-slate-200/70 bg-white/85 shadow-[0_8px_30px_-12px_rgb(6_19_15/0.12)] backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="container-page flex items-center justify-between gap-4 py-3">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Evolución Salud — Inicio">
          <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-slate-900/5 transition group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="Logo de Evolución Salud"
              width={44}
              height={44}
              priority
              className="h-full w-full object-contain p-1"
            />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-extrabold tracking-tight text-white">
              Evolución Salud
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-purple-400">
              Líderes en PINE
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  active ? 'text-brand-700' : 'text-purple-400 hover:text-yellow-400'
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-full bg-brand-100/80"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                ) : null}
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/buscar"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/70 bg-white/70 text-slate-600 backdrop-blur transition hover:border-brand-300 hover:text-brand-700"
            aria-label="Buscar"
            title="Buscar"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </Link>

          <Link
            href="/cursos"
            className="hidden items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lift transition hover:bg-brand-700 md:inline-flex"
          >
            Ver cursos
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          {loading ? null : user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenu((v) => !v)}
                className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white/70 text-sm font-bold text-brand-700 backdrop-blur transition hover:border-brand-300"
                aria-label="Menú de usuario"
                aria-expanded={userMenu}
              >
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </button>
              <AnimatePresence>
                {userMenu ? (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 mt-3 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
                  >
                    <div className="border-b border-slate-100 px-3 py-2.5">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {[profile?.nombre, profile?.apellido]
                          .filter(Boolean)
                          .join(' ') || 'Usuario'}
                      </p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                    <div className="mt-1.5 space-y-0.5">
                      {userLinks.map(({ href, label, icon: Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setUserMenu(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                          {label}
                        </Link>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenu(false);
                          void signOut();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Cerrar sesión
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-700 backdrop-blur transition hover:border-brand-300 hover:text-brand-700 md:inline-flex"
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Ingresar
            </Link>
          )}

          <Link
            href="/carrito"
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-700 backdrop-blur transition hover:border-brand-300 hover:text-brand-700"
            aria-label={`Carrito (${count} productos)`}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {count > 0 ? (
              <motion.span
                key={count}
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white shadow-lift"
              >
                {count}
              </motion.span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-700 backdrop-blur transition hover:border-brand-300 lg:hidden"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.nav
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="border-t border-slate-200/70 bg-white/95 px-4 pb-6 pt-3 backdrop-blur-xl lg:hidden"
            aria-label="Principal móvil"
          >
            {nav.map((item, i) => {
              const active = isActive(item.href);
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`mt-1 flex items-center justify-between rounded-xl px-4 py-3 text-base font-semibold ${
                      active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                    <ArrowRight className="h-4 w-4 opacity-40" aria-hidden="true" />
                  </Link>
                </motion.div>
              );
            })}
            <Link
              href="/cursos"
              onClick={() => setOpen(false)}
              className="btn-primary mt-4 w-full"
            >
              Explorar cursos
            </Link>
            <div className="mt-3 space-y-2">
              {loading ? null : user ? (
                <>
                  {userLinks.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      {label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      void signOut();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="btn-outline w-full"
                >
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  Ingresar
                </Link>
              )}
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
