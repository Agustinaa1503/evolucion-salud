'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import {
  loginAction,
  registerAction,
  forgotPasswordAction,
  resetPasswordAction,
  type AuthActionResult,
} from '@/lib/auth/actions';
import { AuthAlert, FormField, SubmitButton } from '@/components/auth/ui';
import OAuthButtons from '@/components/auth/OAuthButtons';
import { useAuth } from '@/components/auth/AuthProvider';

const initial: AuthActionResult = { ok: false };

export function LoginForm({ next = '/profile' }: { next?: string }) {
  const { demoMode } = useAuth();
  const [state, action] = useActionState(loginAction, initial);

  return (
    <div className="space-y-6">
      {demoMode ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          La autenticación está en modo demo. Configure las variables de Supabase
          para habilitar el ingreso.
        </div>
      ) : null}

      <OAuthButtons />

      <form action={action} className="space-y-4" noValidate>
        <input type="hidden" name="next" value={next} />
        <FormField label="Email" htmlFor="email" error={state.fieldErrors?.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nombre@email.com"
            className="input"
          />
        </FormField>
        <FormField
          label="Contraseña"
          htmlFor="password"
          error={state.fieldErrors?.password}
        >
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="input"
          />
        </FormField>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="remember"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Recordarme
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            ¿Olvidó su contraseña?
          </Link>
        </div>
        <AuthAlert result={state} />
        <SubmitButton label="Iniciar sesión" />
      </form>
    </div>
  );
}

export function RegisterForm() {
  const { demoMode } = useAuth();
  const [state, action] = useActionState(registerAction, initial);

  return (
    <div className="space-y-6">
      {demoMode ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          La autenticación está en modo demo. Configure las variables de Supabase
          para habilitar el registro.
        </div>
      ) : null}

      <form action={action} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nombre" htmlFor="nombre" error={state.fieldErrors?.nombre}>
            <input
              id="nombre"
              name="nombre"
              type="text"
              autoComplete="given-name"
              placeholder="Ana"
              className="input"
            />
          </FormField>
          <FormField
            label="Apellido"
            htmlFor="apellido"
            error={state.fieldErrors?.apellido}
          >
            <input
              id="apellido"
              name="apellido"
              type="text"
              autoComplete="family-name"
              placeholder="Pérez"
              className="input"
            />
          </FormField>
        </div>
        <FormField label="Email" htmlFor="email" error={state.fieldErrors?.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nombre@email.com"
            className="input"
          />
        </FormField>
        <FormField
          label="Contraseña"
          htmlFor="password"
          error={state.fieldErrors?.password}
          hint="Mínimo 8 caracteres, con mayúscula, minúscula y número."
        >
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="input"
          />
        </FormField>
        <FormField
          label="Confirmar contraseña"
          htmlFor="confirmation"
          error={state.fieldErrors?.confirmation}
        >
          <input
            id="confirmation"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="input"
          />
        </FormField>
        <AuthAlert
          result={state}
          successText="Cuenta creada. Revise su email para confirmar la cuenta."
        />
        <SubmitButton label="Crear cuenta" />
        <p className="text-xs leading-relaxed text-slate-500">
          Al crear la cuenta acepta recibir información educativa de Evolución
          Salud y confirma haber leído el aviso legal. El material es de carácter
          psicoeducativo y no reemplaza la consulta con un profesional de la
          salud.
        </p>
      </form>
    </div>
  );
}

export function ForgotPasswordForm() {
  const { demoMode } = useAuth();
  const [state, action] = useActionState(forgotPasswordAction, initial);

  return (
    <div className="space-y-6">
      {demoMode ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          La autenticación está en modo demo. Configure las variables de Supabase
          para habilitar la recuperación.
        </div>
      ) : null}

      <form action={action} className="space-y-4" noValidate>
        <FormField
          label="Email"
          htmlFor="email"
          error={state.fieldErrors?.email}
          hint="Le enviaremos un enlace para restablecer su contraseña."
        >
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nombre@email.com"
            className="input"
          />
        </FormField>
        <AuthAlert
          result={state}
          successText="Si el email está registrado, recibirá un enlace para restablecer su contraseña."
        />
        <SubmitButton label="Enviar enlace" />
      </form>
    </div>
  );
}

export function ResetPasswordForm({ code }: { code: string }) {
  const { demoMode } = useAuth();
  const [state, action] = useActionState(resetPasswordAction, initial);

  return (
    <div className="space-y-6">
      {demoMode ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          La autenticación está en modo demo. Configure las variables de Supabase
          para habilitar la recuperación.
        </div>
      ) : null}

      <form action={action} className="space-y-4" noValidate>
        <input type="hidden" name="code" value={code} />
        <FormField
          label="Nueva contraseña"
          htmlFor="password"
          error={state.fieldErrors?.password}
          hint="Mínimo 8 caracteres, con mayúscula, minúscula y número."
        >
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="input"
          />
        </FormField>
        <FormField
          label="Confirmar nueva contraseña"
          htmlFor="confirmation"
          error={state.fieldErrors?.confirmation}
        >
          <input
            id="confirmation"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="input"
          />
        </FormField>
        <AuthAlert result={state} />
        <SubmitButton label="Restablecer contraseña" />
      </form>
    </div>
  );
}
