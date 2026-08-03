'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronRight,
  ExternalLink,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
} from 'lucide-react';
import { ADMIN_NAV, adminItemForPath } from '@/lib/admin/nav';
import { ROLE_LABELS, type Role } from '@/lib/admin/rbac';
import AdminSearchInput from './AdminSearchInput';
import AdminThemeToggle from './AdminThemeToggle';
import { useAuth } from '@/components/auth/AuthProvider';
import { markNotificationRead } from '@/lib/lms/actions';

export type AdminNotif = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export default function AdminHeader({
  user,
  notifications,
  unreadCount,
  collapsed,
  onToggleSidebar,
  onMenuClick,
}: {
  user: { id: string; email: string; name: string; rol: string; avatar?: string | null };
  notifications: AdminNotif[];
  unreadCount: number;
  collapsed: boolean;
  onToggleSidebar: () => void;
  onMenuClick: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [locallyRead, setLocallyRead] = useState<Set<string>>(new Set());
  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const item = adminItemForPath(pathname);
  const group = item ? ADMIN_NAV.find((g) => g.items.some((i) => i.href === item.href)) : undefined;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const visibleNotifications = notifications
    .filter((n) => !locallyRead.has(n.id))
    .slice(0, 8);

  const openNotification = async (notif: AdminNotif) => {
    if (!notif.read_at && !locallyRead.has(notif.id)) {
      setLocallyRead((s) => new Set(s).add(notif.id));
      try {
        await markNotificationRead(notif.id);
        router.refresh();
      } catch {
        // Sin red, la marca local ya ocultó la notificación.
      }
    }
    if (notif.link) router.push(notif.link);
    else router.push('/admin/logs');
    setBellOpen(false);
  };

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut();
    router.push('/login');
  };

  const initials = user.name
    ? user.name.split(' ').map((p) => p.charAt(0)).join('').slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:inline-flex dark:hover:bg-slate-800"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" aria-hidden="true" /> : <PanelLeftClose className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      <nav aria-label="Ruta actual" className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex">
        <Link
          href="/admin/dashboard"
          className="truncate font-semibold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        >
          BackOffice
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" aria-hidden="true" />
        <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
          {group?.label}
          {group && item ? ' · ' : ''}
          {item?.label ?? 'Inicio'}
        </span>
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <AdminSearchInput className="hidden w-56 md:block" />
        <AdminThemeToggle />

        {/* Notificaciones */}
        <div className="relative" ref={bellRef}>
          <button
            type="button"
            onClick={() => setBellOpen((o) => !o)}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Notificaciones"
          >
            <Bell className="h-4.5 w-4.5" aria-hidden="true" />
            {unreadCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </button>
          {bellOpen ? (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Notificaciones</p>
              </div>
              <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                {visibleNotifications.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-slate-400">No hay notificaciones.</li>
                ) : (
                  visibleNotifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => void openNotification(n)}
                        className="w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{n.title}</span>
                          {!n.read_at ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-label="No leída" />
                          ) : null}
                        </span>
                        {n.body ? <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{n.body}</span> : null}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Perfil */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {initials}
              </span>
            )}
            <span className="hidden text-left leading-tight lg:block">
              <span className="block max-w-[140px] truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                {user.name || 'Administrador'}
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {ROLE_LABELS[user.rol as Role] ?? user.rol}
              </span>
            </span>
          </button>
          {profileOpen ? (
            <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{user.name || 'Administrador'}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
              </div>
              <ul className="p-1.5">
                <li>
                  <Link
                    href="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <UserRound className="h-4 w-4" aria-hidden="true" /> Mi perfil
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" /> Sitio público
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" /> Cerrar sesión
                  </button>
                </li>
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
