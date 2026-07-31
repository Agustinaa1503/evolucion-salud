export type FieldErrors = Record<string, string>;

export const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(email: string): string | null {
  const value = email.trim().toLowerCase();
  if (!value) return 'Ingrese su email.';
  if (value.length > 254) return 'El email es demasiado largo.';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(value)) return 'Ingrese un email válido.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Ingrese una contraseña.';
  if (password.length < MIN_PASSWORD_LENGTH)
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (password.length > 128) return 'La contraseña es demasiado larga.';
  if (!/[A-Z]/.test(password)) return 'Incluya al menos una letra mayúscula.';
  if (!/[a-z]/.test(password)) return 'Incluya al menos una letra minúscula.';
  if (!/\d/.test(password)) return 'Incluya al menos un número.';
  return null;
}

export function validatePasswordMatch(
  password: string,
  confirmation: string
): string | null {
  if (password !== confirmation) return 'Las contraseñas no coinciden.';
  return null;
}

export function validateName(value: string, field: 'nombre' | 'apellido'): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `Ingrese su ${field}.`;
  if (trimmed.length > 80) return `El ${field} es demasiado largo.`;
  if (!/^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ' -]+$/.test(trimmed))
    return `El ${field} solo puede contener letras y espacios.`;
  return null;
}

export function validateLoginForm(input: {
  email: string;
  password: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;
  if (!input.password) errors.password = 'Ingrese su contraseña.';
  return errors;
}

export function validateRegisterForm(input: {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  confirmation: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const nombreError = validateName(input.nombre, 'nombre');
  if (nombreError) errors.nombre = nombreError;
  const apellidoError = validateName(input.apellido, 'apellido');
  if (apellidoError) errors.apellido = apellidoError;
  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;
  const passwordError = validatePassword(input.password);
  if (passwordError) errors.password = passwordError;
  const matchError = validatePasswordMatch(input.password, input.confirmation);
  if (matchError) errors.confirmation = matchError;
  return errors;
}

export function validateForgotForm(input: { email: string }): FieldErrors {
  const errors: FieldErrors = {};
  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;
  return errors;
}

export function validateResetForm(input: {
  password: string;
  confirmation: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const passwordError = validatePassword(input.password);
  if (passwordError) errors.password = passwordError;
  const matchError = validatePasswordMatch(input.password, input.confirmation);
  if (matchError) errors.confirmation = matchError;
  return errors;
}

export function validateProfileForm(input: {
  nombre: string;
  apellido: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const nombreError = validateName(input.nombre, 'nombre');
  if (nombreError) errors.nombre = nombreError;
  const apellidoError = validateName(input.apellido, 'apellido');
  if (apellidoError) errors.apellido = apellidoError;
  return errors;
}
