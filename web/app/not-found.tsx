import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-leaf-500/20 blur-3xl" aria-hidden="true" />
      <div className="container-page relative flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-brand-200 backdrop-blur">
          <Compass className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold text-white sm:text-4xl">
          Esta página se perdió en el camino
        </h1>
        <p className="mt-3 max-w-md text-slate-300">
          Parece que el enlace no existe o fue movido. Puedes volver al inicio o
          explorar nuestros recursos PINE.
        </p>
        <Link href="/" className="btn-primary mt-8">
          <Home className="h-4 w-4" aria-hidden="true" />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
