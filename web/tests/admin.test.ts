import { describe, expect, it } from 'vitest';
import {
  ADMIN_ROLES,
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS,
  permissionsForRole,
  hasPermission,
  canAccessAdmin,
  isAdminRole,
  adminHomeForRole,
} from '../lib/admin/rbac';
import {
  formatNumber,
  formatCompact,
  formatDate,
  formatDateTime,
  timeAgo,
  initials,
  fullName,
  parsePage,
  clampPage,
  paginate,
  toCsv,
} from '../lib/admin/format';
import { mergeGroup, SETTINGS_FIELDS, DEFAULT_SETTINGS_BY_GROUP } from '../lib/admin/settings';

describe('admin/rbac', () => {
  it('define los 7 roles con el legado alumno incluido', () => {
    expect(ADMIN_ROLES).toEqual(['super_admin', 'admin', 'editor', 'teacher']);
    for (const rol of ['super_admin', 'admin', 'editor', 'teacher', 'student', 'guest', 'alumno']) {
      expect(permissionsForRole(rol)).toBeInstanceOf(Array);
    }
  });

  it('super_admin tiene todos los permisos', () => {
    expect(permissionsForRole('super_admin')).toEqual(ALL_PERMISSIONS);
    expect(hasPermission('super_admin', 'admin.users.delete')).toBe(true);
  });

  it('admin no puede eliminar usuarios', () => {
    expect(hasPermission('admin', 'admin.users.delete')).toBe(false);
    expect(hasPermission('admin', 'admin.settings.write')).toBe(true);
  });

  it('editor no toca usuarios ni configuración ni certificados write', () => {
    expect(hasPermission('editor', 'admin.users.read')).toBe(false);
    expect(hasPermission('editor', 'admin.blog.write')).toBe(true);
    expect(hasPermission('editor', 'admin.settings.read')).toBe(false);
    expect(hasPermission('editor', 'admin.certificates.write')).toBe(false);
  });

  it('teacher solo ve cursos, cuestionarios, certificados y logs', () => {
    expect(hasPermission('teacher', 'admin.courses.write')).toBe(true);
    expect(hasPermission('teacher', 'admin.users.read')).toBe(false);
    expect(hasPermission('teacher', 'admin.newsletter.read')).toBe(false);
    expect(hasPermission('teacher', 'admin.certificates.read')).toBe(true);
  });

  it('student/guest/alumno no acceden al BackOffice', () => {
    for (const rol of ['student', 'guest', 'alumno']) {
      expect(canAccessAdmin(rol)).toBe(false);
      expect(adminHomeForRole(rol)).toBe('/cursos');
    }
  });

  it('isAdminRole distingue roles admin de no admin', () => {
    expect(isAdminRole('super_admin')).toBe(true);
    expect(isAdminRole('teacher')).toBe(true);
    expect(isAdminRole('student')).toBe(false);
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole('rol-desconocido')).toBe(false);
  });

  it('hasPermission ignora permisos vacíos o roles desconocidos', () => {
    expect(hasPermission(undefined, 'admin.access')).toBe(false);
    expect(hasPermission('super_admin', undefined)).toBe(false);
    expect(hasPermission('rol-inventado', 'admin.access')).toBe(false);
  });
});

describe('admin/format', () => {
  it('formatea números con separadores es-AR', () => {
    expect(formatNumber(1234)).toBe('1.234');
  });

  it('formatea compacto', () => {
    expect(typeof formatCompact(1500)).toBe('string');
  });

  it('fechas inválidas o ausentes devuelven "—"', () => {
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('no-es-fecha')).toBe('—');
    expect(formatDateTime(null)).toBe('—');
  });

  it('formatea fechas ISO válidas', () => {
    expect(formatDate('2026-08-01T12:00:00Z')).toMatch(/01\/08\/2026/);
    expect(formatDateTime('2026-08-01T12:00:00Z')).toContain('2026');
  });

  it('timeAgo devuelve texto relativo', () => {
    expect(timeAgo(undefined)).toBe('—');
    expect(timeAgo(new Date().toISOString())).toBe('hace un momento');
    expect(timeAgo(new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString())).toMatch(/^hace \d+ h/);
  });

  it('iniciales y nombre completo', () => {
    expect(initials('Carina', 'Lescano')).toBe('CL');
    expect(initials('claudia', '')).toBe('C');
    expect(initials(null, null)).toBe('?');
    expect(fullName('Claudia', 'Espinoza')).toBe('Claudia Espinoza');
    expect(fullName(null, '')).toBe('—');
  });

  it('paginación con límites', () => {
    const items = Array.from({ length: 45 }, (_, i) => i + 1);
    const p1 = paginate(items, 1, 20);
    expect(p1.items).toHaveLength(20);
    expect(p1.totalPages).toBe(3);
    expect(paginate(items, 99, 20).page).toBe(3);
    expect(paginate(items, 0, 20).page).toBe(1);
    expect(clampPage(5, 2)).toBe(2);
    expect(clampPage(0, 0)).toBe(1);
  });

  it('parsePage resuelve valores de searchParams', () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage('3')).toBe(3);
    expect(parsePage(['2', '9'])).toBe(2);
    expect(parsePage('abc')).toBe(1);
    expect(parsePage('0')).toBe(1);
  });

  it('toCsv agrega BOM, separador ; y escapa comillas', () => {
    const csv = toCsv(['Nombre', 'Email'], [['Evolución "Salud"', null], ['a;b', 'x@y.com']]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Evolución ""Salud"""');
    expect(csv).toContain('"a;b";x@y.com');
  });
});

describe('admin/settings', () => {
  it('todos los grupos tienen campos en SETTINGS_FIELDS', () => {
    for (const group of Object.keys(DEFAULT_SETTINGS_BY_GROUP)) {
      expect(SETTINGS_FIELDS[group as keyof typeof SETTINGS_FIELDS]).toBeDefined();
      expect(SETTINGS_FIELDS[group as keyof typeof SETTINGS_FIELDS].length).toBeGreaterThan(0);
    }
  });

  it('mergeGroup combina defaults con valores de BD', () => {
    const merged = mergeGroup('institucional', { nombre: 'Evolución Salud 2.0', ubicacion: 42 });
    expect(merged.nombre).toBe('Evolución Salud 2.0');
    expect(merged.ubicacion).toBe('42');
    expect(merged.slogan).toBe(DEFAULT_SETTINGS_BY_GROUP.institucional.slogan);
  });

  it('mergeGroup ignora claves desconocidas y valores no string', () => {
    const merged = mergeGroup('seo', { hackeado: 'x', keywords: 123 as unknown as string });
    expect('hackeado' in merged).toBe(false);
    expect(merged.keywords).toBe('123');
  });

  it('mergeGroup con null devuelve defaults', () => {
    expect(mergeGroup('contacto', null)).toEqual(DEFAULT_SETTINGS_BY_GROUP.contacto);
  });
});
