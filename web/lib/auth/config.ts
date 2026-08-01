export type Role = 'alumno' | 'admin';

export type AuthProviderName = 'google' | 'github' | 'facebook';

export const ROLES: Record<Role, string> = {
  alumno: 'Alumno',
  admin: 'Administrador',
};

/**
 * Proveedores OAuth habilitados. Se leen de NEXT_PUBLIC_AUTH_PROVIDERS
 * (lista separada por comas: "google,github,facebook").
 * Por defecto están todos deshabilitados hasta configurar las credenciales
 * en el panel de Supabase (Auth → Providers).
 */
export const enabledProviders = (): AuthProviderName[] =>
  (process.env.NEXT_PUBLIC_AUTH_PROVIDERS ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p): p is AuthProviderName =>
      ['google', 'github', 'facebook'].includes(p)
    );

export const isProviderEnabled = (name: AuthProviderName): boolean =>
  enabledProviders().includes(name);

/** Rutas públicas de auth (redirigen al perfil si ya hay sesión). */
export const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];

/** Rutas protegidas que requieren sesión. */
export const PROTECTED_PAGES = [
  '/profile',
  '/settings',
  '/mi-aprendizaje',
  '/mis-favoritos',
  '/admin',
];

export const isProtectedPage = (pathname: string): boolean =>
  PROTECTED_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export const isAuthPage = (pathname: string): boolean =>
  AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
