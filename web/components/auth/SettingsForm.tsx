'use client';

import { useActionState } from 'react';
import { Bell, KeyRound, Mail } from 'lucide-react';
import { changePasswordAction, updateSettingsAction } from '@/lib/auth/actions';
import { AuthAlert, FormField, SubmitButton } from '@/components/auth/ui';
import { useAuth } from '@/components/auth/AuthProvider';

export function SettingsForm() {
  const { settings } = useAuth();
  const [state, action] = useActionState(updateSettingsAction, { ok: false });

  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Mail className="h-4 w-4" aria-hidden="true" />
        </span>
        <label className="flex-1">
          <span className="block font-semibold text-slate-800">
            Recibir newsletter semanal
          </span>
          <span className="block text-sm text-slate-500">
            Contenido educativo PINE y novedades de la plataforma.
          </span>
          <input
            type="checkbox"
            name="receive_newsletter"
            defaultChecked={settings?.receive_newsletter ?? true}
            className="mt-3 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
        </label>
      </div>

      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Bell className="h-4 w-4" aria-hidden="true" />
        </span>
        <label className="flex-1">
          <span className="block font-semibold text-slate-800">
            Avisos por email
          </span>
          <span className="block text-sm text-slate-500">
            Notificaciones de progreso, certificados y nuevos cursos.
          </span>
          <input
            type="checkbox"
            name="notification_email"
            defaultChecked={settings?.notification_email ?? true}
            className="mt-3 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
        </label>
      </div>

      <AuthAlert result={state} successText="Preferencias guardadas." />
      <SubmitButton label="Guardar preferencias" />
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePasswordAction, { ok: false });

  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <KeyRound className="h-4 w-4 text-brand-600" aria-hidden="true" />
        Cambiar contraseña
      </div>
      <FormField
        label="Nueva contraseña"
        htmlFor="new-password"
        error={state.fieldErrors?.password}
        hint="Mínimo 8 caracteres, con mayúscula, minúscula y número."
      >
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          className="input"
        />
      </FormField>
      <FormField
        label="Confirmar contraseña"
        htmlFor="new-password-confirm"
        error={state.fieldErrors?.confirmation}
      >
        <input
          id="new-password-confirm"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          className="input"
        />
      </FormField>
      <AuthAlert result={state} successText="Contraseña actualizada correctamente." />
      <SubmitButton label="Actualizar contraseña" />
    </form>
  );
}
