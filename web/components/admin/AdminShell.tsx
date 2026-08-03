'use client';

import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader, { type AdminNotif } from './AdminHeader';

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  rol: string;
  avatar?: string | null;
};

/**
 * Shell del BackOffice: sidebar colapsable, header (breadcrumbs, buscador,
 * tema, notificaciones y perfil) y área de contenido. Responsive: en móvil el
 * menú se abre como panel deslizante.
 */
export default function AdminShell({
  user,
  permissions,
  notifications,
  unreadCount,
  children,
}: {
  user: AdminUser;
  permissions: string[];
  notifications: AdminNotif[];
  unreadCount: number;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-ink-950 dark:text-slate-100">
      <div className="sticky top-0 hidden h-screen shrink-0 lg:block">
        <AdminSidebar permissions={permissions} collapsed={collapsed} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          user={user}
          notifications={notifications}
          unreadCount={unreadCount}
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 shadow-2xl">
            <AdminSidebar
              permissions={permissions}
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
