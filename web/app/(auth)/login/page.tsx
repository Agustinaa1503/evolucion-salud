import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/AuthForms';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
        Bienvenido de nuevo
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Ingrese a su cuenta para continuar con su aprendizaje.
      </p>

      <div className="mt-7">
        <LoginForm next={next} />
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        ¿Aún no tiene cuenta?{' '}
        <Link
          href="/register"
          className="font-semibold text-brand-700 hover:text-brand-800"
        >
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
