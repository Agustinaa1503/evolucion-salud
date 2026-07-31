'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/auth/session';
import {
  validateForgotForm,
  validateLoginForm,
  validateProfileForm,
  validateRegisterForm,
  validateResetForm,
} from './validations';
import type { FieldErrors } from './validations';

export type AuthActionResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: FieldErrors;
  needsEmailConfirmation?: boolean;
};

async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}

/** Solo permite redirects relativos internos (evita open redirect). */
function sanitizeNext(value: string): string {
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  return '/profile';
}

export async function loginAction(
  _prev: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const next = sanitizeNext(String(formData.get('next') ?? '/profile'));

  const fieldErrors = validateLoginForm({ email, password });
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes('email not confirmed')) {
      return {
        ok: false,
        error: 'Debe confirmar su email antes de ingresar. Revise su casilla de correo.',
      };
    }
    return { ok: false, error: 'Email o contraseña incorrectos.' };
  }
  redirect(next);
}

export async function registerAction(
  _prev: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const nombre = String(formData.get('nombre') ?? '');
  const apellido = String(formData.get('apellido') ?? '');
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirmation = String(formData.get('confirmation') ?? '');

  const fieldErrors = validateRegisterForm({
    nombre,
    apellido,
    email,
    password,
    confirmation,
  });
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre: nombre.trim(), apellido: apellido.trim() },
      emailRedirectTo: `${await getOrigin()}/login`,
    },
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes('already registered')) {
      return { ok: false, error: 'Ya existe una cuenta con este email.' };
    }
    return { ok: false, error: error.message };
  }

  if (!data.session) {
    return { ok: true, needsEmailConfirmation: true };
  }

  redirect('/profile');
}

export async function forgotPasswordAction(
  _prev: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const email = String(formData.get('email') ?? '');
  const fieldErrors = validateForgotForm({ email });
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  const supabase = await createServerSupabaseClient();
  // Siempre responde ok (por seguridad) aunque el email no exista.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await getOrigin()}/reset-password`,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function resetPasswordAction(
  _prev: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const code = String(formData.get('code') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirmation = String(formData.get('confirmation') ?? '');

  const fieldErrors = validateResetForm({ password, confirmation });
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  const supabase = await createServerSupabaseClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return { ok: false, error: 'El enlace de recuperación no es válido o ha expirado.' };
    }
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) return { ok: false, error: updateError.message };

  redirect('/profile');
}

export async function updateProfileAction(
  _prev: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const nombre = String(formData.get('nombre') ?? '');
  const apellido = String(formData.get('apellido') ?? '');

  const fieldErrors = validateProfileForm({ nombre, apellido });
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase
    .from('profiles')
    .update({ nombre: nombre.trim(), apellido: apellido.trim() })
    .eq('id', user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function changePasswordAction(
  _prev: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const password = String(formData.get('password') ?? '');
  const confirmation = String(formData.get('confirmation') ?? '');

  const fieldErrors = validateResetForm({ password, confirmation });
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      ok: false,
      error:
        error.message.includes('reauth')
          ? 'Debe volver a iniciar sesión para cambiar la contraseña.'
          : error.message,
    };
  }
  return { ok: true };
}

export async function updateSettingsAction(
  _prev: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const receiveNewsletter = formData.get('receive_newsletter') === 'on';
  const notificationEmail = formData.get('notification_email') === 'on';

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase
    .from('user_settings')
    .update({
      receive_newsletter: receiveNewsletter,
      notification_email: notificationEmail,
    })
    .eq('user_id', user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
