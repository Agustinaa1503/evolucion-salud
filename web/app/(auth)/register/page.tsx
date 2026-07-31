import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/AuthForms';

export const metadata: Metadata = {
  title: 'Crear cuenta',
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
        Crear cuenta
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Acceda a sus cursos, su progreso y sus certificados.
      </p>

      <div className="mt-7">
        <RegisterForm />
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        ¿Ya tiene una cuenta?{' '}
        <Link
          href="/login"
          className="font-semibold text-brand-700 hover:text-brand-800"
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
