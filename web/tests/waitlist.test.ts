import { describe, it, expect } from 'vitest';
import {
  validateWaitlistInput,
  normalizeEmail,
  normalizeName,
} from '@/lib/waitlist/validation';

describe('validateWaitlistInput', () => {
  it('acepta un email válido y normaliza a minúsculas', () => {
    const r = validateWaitlistInput({ email: '  Ana@Gmail.com ', courseSlug: 'introduccion-pine' });
    expect(r.ok).toBe(true);
    expect(r.email).toBe('ana@gmail.com');
  });

  it('rechaza un email inválido', () => {
    const r = validateWaitlistInput({ email: 'no-es-un-email', courseSlug: 'introduccion-pine' });
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it('rechaza un email vacío', () => {
    const r = validateWaitlistInput({ email: '', courseSlug: 'introduccion-pine' });
    expect(r.ok).toBe(false);
  });

  it('rechaza un courseSlug inválido (espacios o mayúsculas)', () => {
    const r = validateWaitlistInput({ email: 'a@b.com', courseSlug: 'Introduccion PINE' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe('Curso no válido.');
  });

  it('normaliza el courseSlug a minúsculas', () => {
    const r = validateWaitlistInput({ email: 'a@b.com', courseSlug: 'INTRODUCCION-PINE' });
    expect(r.ok).toBe(true);
    expect(r.courseSlug).toBe('introduccion-pine');
  });

  it('acepta nombre opcional y lo recorta', () => {
    const r = validateWaitlistInput({
      email: 'a@b.com',
      courseSlug: 'introduccion-pine',
      name: '  Ana  ',
    });
    expect(r.ok).toBe(true);
    expect(r.name).toBe('Ana');
  });

  it('anula un nombre vacío', () => {
    const r = validateWaitlistInput({ email: 'a@b.com', courseSlug: 'introduccion-pine', name: '   ' });
    expect(r.ok).toBe(true);
    expect(r.name).toBeUndefined();
  });

  it('no requiere nombre', () => {
    const r = validateWaitlistInput({ email: 'a@b.com', courseSlug: 'introduccion-pine' });
    expect(r.ok).toBe(true);
    expect(r.name).toBeUndefined();
  });
});

describe('normalizeEmail / normalizeName', () => {
  it('normaliza espacios y mayúsculas', () => {
    expect(normalizeEmail('  CARLOS@Mail.com  ')).toBe('carlos@mail.com');
  });

  it('anula nombres vacíos', () => {
    expect(normalizeName('')).toBeUndefined();
    expect(normalizeName('  ')).toBeUndefined();
    expect(normalizeName('Ana')).toBe('Ana');
  });
});
