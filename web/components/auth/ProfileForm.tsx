'use client';

import { useActionState } from 'react';
import { updateProfileAction } from '@/lib/auth/actions';
import { AuthAlert, FormField, SubmitButton } from '@/components/auth/ui';
import { useAuth } from '@/components/auth/AuthProvider';
import AvatarPicker from '@/components/auth/AvatarPicker';

export default function ProfileForm() {
  const { profile } = useAuth();
  const [state, action] = useActionState(updateProfileAction, { ok: false });

  return (
    <form action={action} className="space-y-4" noValidate>
      <AvatarPicker />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Nombre"
          htmlFor="nombre"
          error={state.fieldErrors?.nombre}
        >
          <input
            id="nombre"
            name="nombre"
            type="text"
            autoComplete="given-name"
            defaultValue={profile?.nombre ?? ''}
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
            defaultValue={profile?.apellido ?? ''}
            className="input"
          />
        </FormField>
      </div>
      <AuthAlert result={state} successText="Perfil actualizado correctamente." />
      <SubmitButton label="Guardar cambios" />
    </form>
  );
}
