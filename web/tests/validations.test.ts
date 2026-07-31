import { describe, expect, it } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateName,
  validateLoginForm,
  validateRegisterForm,
  validateResetForm,
  validateProfileForm,
  MIN_PASSWORD_LENGTH,
} from '@/lib/auth/validations';

describe('validateEmail', () => {
  it('rechaza vacíos y formatos inválidos', () => {
    expect(validateEmail('')).not.toBeNull();
    expect(validateEmail('   ')).not.toBeNull();
    expect(validateEmail('sin-arroba')).not.toBeNull();
    expect(validateEmail('a@b')).not.toBeNull();
    expect(validateEmail('a@b.c')).not.toBeNull();
    expect(validateEmail('@b.com')).not.toBeNull();
  });

  it('acepta emails válidos y normaliza', () => {
    expect(validateEmail('ana@ejemplo.com')).toBeNull();
    expect(validateEmail('  ANA@Ejemplo.com  ')).toBeNull();
    expect(validateEmail('a.b+c@sub.ejemplo.com.ar')).toBeNull();
  });

  it('rechaza emails demasiado largos', () => {
    expect(validateEmail(`${'a'.repeat(300)}@b.com`)).not.toBeNull();
  });
});

describe('validatePassword', () => {
  it('rechaza contraseñas débiles', () => {
    expect(validatePassword('')).not.toBeNull();
    expect(validatePassword('corta')).not.toBeNull();
    expect(validatePassword('solo-minusculas-123')).not.toBeNull();
    expect(validatePassword('SOLO-MAYUSCULAS-123')).not.toBeNull();
    expect(validatePassword('SinNumero!abc')).not.toBeNull();
    expect(validatePassword('a'.repeat(200))).not.toBeNull();
  });

  it('acepta contraseñas robustas', () => {
    expect(validatePassword('Passw0rd!')).toBeNull();
    expect(validatePassword(`Abc${'a'.repeat(MIN_PASSWORD_LENGTH)}1`)).toBeNull();
  });
});

describe('validatePasswordMatch', () => {
  it('detecta contraseñas distintas', () => {
    expect(validatePasswordMatch('Passw0rd!', 'Passw0rd2')).not.toBeNull();
  });

  it('acepta contraseñas iguales', () => {
    expect(validatePasswordMatch('Passw0rd!', 'Passw0rd!')).toBeNull();
  });
});

describe('validateName', () => {
  it('rechaza vacíos, números y símbolos', () => {
    expect(validateName('', 'nombre')).not.toBeNull();
    expect(validateName('Ana 123', 'nombre')).not.toBeNull();
    expect(validateName('Ana@', 'apellido')).not.toBeNull();
  });

  it('acepta nombres con tildes y apóstrofes', () => {
    expect(validateName('María José', 'nombre')).toBeNull();
    expect(validateName("O'Brien", 'apellido')).toBeNull();
    expect(validateName('Espíndola', 'apellido')).toBeNull();
  });
});

describe('validateLoginForm', () => {
  it('reporta errores de email y contraseña', () => {
    const errors = validateLoginForm({ email: 'mal', password: '' });
    expect(errors.email).toBeTruthy();
    expect(errors.password).toBeTruthy();
  });

  it('no reporta errores en un formulario válido', () => {
    const errors = validateLoginForm({ email: 'ana@ejemplo.com', password: 'x' });
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

describe('validateRegisterForm', () => {
  it('valida todos los campos', () => {
    const errors = validateRegisterForm({
      nombre: '',
      apellido: 'Pérez',
      email: 'ana@ejemplo.com',
      password: 'Passw0rd!',
      confirmation: 'Passw0rd!',
    });
    expect(errors.nombre).toBeTruthy();
  });

  it('detecta contraseñas que no coinciden', () => {
    const errors = validateRegisterForm({
      nombre: 'Ana',
      apellido: 'Pérez',
      email: 'ana@ejemplo.com',
      password: 'Passw0rd!',
      confirmation: 'OtraC0sa!',
    });
    expect(errors.confirmation).toBeTruthy();
  });

  it('acepta un formulario completo válido', () => {
    const errors = validateRegisterForm({
      nombre: 'Ana',
      apellido: 'Pérez',
      email: 'ana@ejemplo.com',
      password: 'Passw0rd!',
      confirmation: 'Passw0rd!',
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

describe('validateResetForm', () => {
  it('valida y compara contraseñas', () => {
    expect(
      validateResetForm({ password: 'abc', confirmation: 'abc' }).password
    ).toBeTruthy();
    expect(
      validateResetForm({ password: 'Passw0rd!', confirmation: 'distinta1' })
        .confirmation
    ).toBeTruthy();
    expect(
      validateResetForm({ password: 'Passw0rd!', confirmation: 'Passw0rd!' })
    ).toEqual({});
  });
});

describe('validateProfileForm', () => {
  it('valida nombre y apellido', () => {
    expect(validateProfileForm({ nombre: '', apellido: 'Pérez' }).nombre).toBeTruthy();
    expect(validateProfileForm({ nombre: 'Ana', apellido: 'Pérez' })).toEqual({});
  });
});
