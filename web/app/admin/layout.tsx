import type { Metadata } from 'next';
import { requireAdminRole } from '@/lib/auth/session';
import { permissionsForRole } from '@/lib/admin/rbac';
import AdminShell from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: 'BackOffice | Evolución Salud',
  robots: { index: false, follow: false },
};

/**
 * Layout del BackOffice. Exige sesión con acceso de administración
 * (`admin.access`), calcula los permisos del rol para filtrar la navegación y
 * entrega las notificaciones del administrador al header.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireAdminRole('admin.access');

  const { createServerSupabaseClient } = await import('@/lib/auth/session');
  const supabase = await createServerSupabaseClient();

  const [{ data: notifications }, { data: notifReads }] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, title, body, link, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('notifications').select('id, read_at'),
  ]);

  const unreadCount = (notifReads ?? []).filter((n) => !n.read_at).length;

  const name = [profile?.nombre, profile?.apellido].filter(Boolean).join(' ') || user.email;

  return (
    <AdminShell
      user={{
        id: user.id,
        email: user.email,
        name,
        rol: profile?.rol ?? 'guest',
        avatar: profile?.avatar_url ?? null,
      }}
      permissions={permissionsForRole(profile?.rol)}
      notifications={
        (notifications ?? []).map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          link: n.link,
          read_at: n.read_at,
          created_at: n.created_at,
        }))
      }
      unreadCount={unreadCount}
    >
      {children}
    </AdminShell>
  );
}
