/**
 * Validación de los datos del formulario de lista de espera (FASE 7).
 * Funciones puras, sin dependencias externas, testeadas con Vitest.
 */

export const WAITLIST_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const WAITLIST_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type WaitlistInput = {
  email: string;
  courseSlug: string;
  name?: string;
};

export type WaitlistValidation = {
  ok: boolean;
  error?: string;
  email?: string;
  name?: string;
  courseSlug?: string;
};

/** Normaliza el email: minúsculas y sin espacios alrededor. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Normaliza el nombre (opcional): recorta y anula cadenas vacías. */
export function normalizeName(name?: string): string | undefined {
  const trimmed = name?.trim() ?? '';
  return trimmed === '' ? undefined : trimmed;
}

/** Valida la entrada de la lista de espera y devuelve los valores normalizados. */
export function validateWaitlistInput(input: WaitlistInput): WaitlistValidation {
  const email = normalizeEmail(input.email ?? '');
  const courseSlug = (input.courseSlug ?? '').trim().toLowerCase();
  const name = normalizeName(input.name);

  if (!WAITLIST_EMAIL_RE.test(email)) {
    return { ok: false, error: 'Ingrese un email válido.' };
  }
  if (!WAITLIST_SLUG_RE.test(courseSlug)) {
    return { ok: false, error: 'Curso no válido.' };
  }

  return { ok: true, email, name, courseSlug };
}
