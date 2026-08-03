/**
 * RBAC del BackOffice de Evolución Salud.
 *
 * Módulo 100% puro (sin imports de servidor): define los roles, el catálogo de
 * permisos por módulo y las funciones de comprobación que usan tanto el guard
 * de sesión (`requireAdminRole`) como la UI (sidebar filtrado por permisos) y
 * los tests. Los permisos se reflejan en Supabase en la tabla `role_permissions`
 * (migración 20260731000010_admin_backoffice.sql); esta tabla es la fuente para
 * `has_permission()` en las policies RLS y en el smoke test.
 */

export type Role =
  | 'super_admin'
  | 'admin'
  | 'editor'
  | 'teacher'
  | 'student'
  | 'guest'
  | 'alumno';

export type AdminRole = 'super_admin' | 'admin' | 'editor' | 'teacher';

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Administrador',
  admin: 'Administrador',
  editor: 'Editor',
  teacher: 'Docente',
  student: 'Alumno',
  guest: 'Invitado',
  alumno: 'Alumno',
};

/** Roles que pueden entrar al BackOffice. */
export const ADMIN_ROLES: AdminRole[] = ['super_admin', 'admin', 'editor', 'teacher'];

export type Permission =
  | 'admin.access'
  | 'admin.dashboard'
  | 'admin.users.read'
  | 'admin.users.write'
  | 'admin.users.delete'
  | 'admin.courses.read'
  | 'admin.courses.write'
  | 'admin.blog.read'
  | 'admin.blog.write'
  | 'admin.podcast.read'
  | 'admin.podcast.write'
  | 'admin.resources.read'
  | 'admin.resources.write'
  | 'admin.taxonomy.read'
  | 'admin.taxonomy.write'
  | 'admin.newsletter.read'
  | 'admin.newsletter.write'
  | 'admin.waitlist.read'
  | 'admin.quizzes.read'
  | 'admin.certificates.read'
  | 'admin.certificates.write'
  | 'admin.settings.read'
  | 'admin.settings.write'
  | 'admin.logs.read';

export const ALL_PERMISSIONS: Permission[] = [
  'admin.access',
  'admin.dashboard',
  'admin.users.read',
  'admin.users.write',
  'admin.users.delete',
  'admin.courses.read',
  'admin.courses.write',
  'admin.blog.read',
  'admin.blog.write',
  'admin.podcast.read',
  'admin.podcast.write',
  'admin.resources.read',
  'admin.resources.write',
  'admin.taxonomy.read',
  'admin.taxonomy.write',
  'admin.newsletter.read',
  'admin.newsletter.write',
  'admin.waitlist.read',
  'admin.quizzes.read',
  'admin.certificates.read',
  'admin.certificates.write',
  'admin.settings.read',
  'admin.settings.write',
  'admin.logs.read',
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ALL_PERMISSIONS,
  admin: [
    'admin.access',
    'admin.dashboard',
    'admin.users.read',
    'admin.users.write',
    'admin.courses.read',
    'admin.courses.write',
    'admin.blog.read',
    'admin.blog.write',
    'admin.podcast.read',
    'admin.podcast.write',
    'admin.resources.read',
    'admin.resources.write',
    'admin.taxonomy.read',
    'admin.taxonomy.write',
    'admin.newsletter.read',
    'admin.newsletter.write',
    'admin.waitlist.read',
    'admin.quizzes.read',
    'admin.certificates.read',
    'admin.certificates.write',
    'admin.settings.read',
    'admin.settings.write',
    'admin.logs.read',
  ],
  editor: [
    'admin.access',
    'admin.dashboard',
    'admin.courses.read',
    'admin.blog.read',
    'admin.blog.write',
    'admin.podcast.read',
    'admin.podcast.write',
    'admin.resources.read',
    'admin.resources.write',
    'admin.taxonomy.read',
    'admin.taxonomy.write',
    'admin.newsletter.read',
    'admin.waitlist.read',
    'admin.quizzes.read',
    'admin.certificates.read',
    'admin.logs.read',
  ],
  teacher: [
    'admin.access',
    'admin.dashboard',
    'admin.courses.read',
    'admin.courses.write',
    'admin.quizzes.read',
    'admin.certificates.read',
    'admin.logs.read',
  ],
  student: [],
  guest: [],
  alumno: [],
};

/** Grupos de permisos agrupados por módulo, para UI (Configuración → Roles). */
export const PERMISSION_GROUPS: {
  key: string;
  label: string;
  permissions: { permission: Permission; label: string; description: string }[];
}[] = [
  {
    key: 'acceso',
    label: 'Acceso',
    permissions: [
      { permission: 'admin.access', label: 'Acceso al BackOffice', description: 'Puede entrar a /admin.' },
      { permission: 'admin.dashboard', label: 'Dashboard', description: 'Ve el panel de métricas.' },
    ],
  },
  {
    key: 'usuarios',
    label: 'Usuarios',
    permissions: [
      { permission: 'admin.users.read', label: 'Ver usuarios', description: 'Lista y detalle de cuentas.' },
      { permission: 'admin.users.write', label: 'Editar usuarios', description: 'Cambia rol, estado y datos.' },
      { permission: 'admin.users.delete', label: 'Eliminar usuarios', description: 'Puede eliminar cuentas.' },
    ],
  },
  {
    key: 'cursos',
    label: 'Cursos',
    permissions: [
      { permission: 'admin.courses.read', label: 'Ver cursos', description: 'Catálogo y estado de cursos.' },
      { permission: 'admin.courses.write', label: 'Gestionar cursos', description: 'Publica y sincroniza cursos.' },
    ],
  },
  {
    key: 'contenido',
    label: 'Contenido',
    permissions: [
      { permission: 'admin.blog.read', label: 'Ver blog', description: 'Artículos del blog.' },
      { permission: 'admin.blog.write', label: 'Gestionar blog', description: 'Publica y edita artículos.' },
      { permission: 'admin.podcast.read', label: 'Ver podcast', description: 'Episodios del podcast.' },
      { permission: 'admin.podcast.write', label: 'Gestionar podcast', description: 'Publica y edita episodios.' },
      { permission: 'admin.resources.read', label: 'Ver recursos', description: 'Productos y descargables.' },
      { permission: 'admin.resources.write', label: 'Gestionar recursos', description: 'Publica y edita recursos.' },
      { permission: 'admin.taxonomy.read', label: 'Ver categorías y tags', description: 'Catálogo de clasificación.' },
      { permission: 'admin.taxonomy.write', label: 'Gestionar taxonomía', description: 'Crea y edita categorías y tags.' },
    ],
  },
  {
    key: 'captacion',
    label: 'Captación',
    permissions: [
      { permission: 'admin.newsletter.read', label: 'Ver newsletter', description: 'Suscriptores y segmentos.' },
      { permission: 'admin.newsletter.write', label: 'Gestionar newsletter', description: 'Edita segmentos y envía.' },
      { permission: 'admin.waitlist.read', label: 'Lista de espera', description: 'Espera de cursos próximos.' },
    ],
  },
  {
    key: 'evaluacion',
    label: 'Evaluación',
    permissions: [
      { permission: 'admin.quizzes.read', label: 'Cuestionarios', description: 'Intentos y notas de alumnos.' },
      { permission: 'admin.certificates.read', label: 'Certificados', description: 'Emisiones y verificación.' },
      { permission: 'admin.certificates.write', label: 'Gestionar certificados', description: 'Reemite y administra.' },
    ],
  },
  {
    key: 'sistema',
    label: 'Sistema',
    permissions: [
      { permission: 'admin.settings.read', label: 'Ver configuración', description: 'Ajustes del BackOffice.' },
      { permission: 'admin.settings.write', label: 'Editar configuración', description: 'Guarda ajustes del BackOffice.' },
      { permission: 'admin.logs.read', label: 'Logs', description: 'Auditoría y actividad.' },
    ],
  },
];

export const isAdminRole = (rol?: string | null): rol is AdminRole =>
  Boolean(rol && (ADMIN_ROLES as string[]).includes(rol));

export const permissionsForRole = (rol?: string | null): Permission[] =>
  rol ? (ROLE_PERMISSIONS[rol as Role] ?? []) : [];

export const hasPermission = (rol?: string | null, permission?: string): boolean =>
  Boolean(permission && permissionsForRole(rol).includes(permission as Permission));

export const canAccessAdmin = (rol?: string | null): boolean =>
  hasPermission(rol, 'admin.access');

/** Ruta de inicio para un rol con acceso al BackOffice. */
export const adminHomeForRole = (rol?: string | null): string => {
  if (!canAccessAdmin(rol)) return '/cursos';
  return '/admin/dashboard';
};
