import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Acceso',
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 bg-grid opacity-40"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-clay-500/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-slate-900/5">
            <Image
              src="/logo.png"
              alt="Logo de Evolución Salud"
              width={48}
              height={48}
              className="h-full w-full object-contain p-1"
            />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-extrabold tracking-tight text-white">
              Evolución Salud
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-brand-300">
              Líderes en PINE
            </span>
          </span>
        </Link>

        <div className="rounded-3xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur-xl">
          {children}
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
          Material de carácter psicoeducativo que no reemplaza la consulta con un
          profesional de la salud.
        </p>
      </div>
    </div>
  );
}
