import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ResetPasswordForm } from '@/components/auth/AuthForms';

export const metadata: Metadata = {
  title: 'Restablecer contraseña',
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
        Restablecer contraseña
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Defina una nueva contraseña para su cuenta.
      </p>

      <div className="mt-7">
        <ResetPasswordForm code={code ?? ''} />
      </div>

      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a iniciar sesión
      </Link>
    </div>
  );
}
