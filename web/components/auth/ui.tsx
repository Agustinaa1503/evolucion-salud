'use client';

import { useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AuthActionResult } from '@/lib/auth/actions';

export function AuthAlert({
  result,
  successText,
}: {
  result: AuthActionResult | null;
  successText?: string;
}) {
  if (!result) return null;
  if (result.ok && !successText) return null;

  if (result.ok) {
    return (
      <div
        role="status"
        className="flex items-start gap-2.5 rounded-xl border border-leaf-200 bg-leaf-50 px-4 py-3 text-sm text-leaf-800"
      >
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{successText ?? 'Listo.'}</span>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{result.error ?? 'Ocurrió un error inesperado.'}</span>
    </div>
  );
}

export function FormField({
  label,
  htmlFor,
  error,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

export function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Procesando…
        </>
      ) : (
        label
      )}
    </button>
  );
}
