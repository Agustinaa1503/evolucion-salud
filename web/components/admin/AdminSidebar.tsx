'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid } from 'lucide-react';
import { ADMIN_NAV } from '@/lib/admin/nav';

export default function AdminSidebar({
  permissions,
  collapsed,
  onNavigate,
}: {
  permissions: string[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const can = (perm: string) => permissions.includes(perm);
  const groups = ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(item.permission)),
  })).filter((group) => group.items.length > 0);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      className={`flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-950 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-800">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
          <LayoutGrid className="h-5 w-5" aria-hidden="true" />
        </span>
        {!collapsed ? (
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-extrabold text-slate-900 dark:text-slate-50">
              Evolución Salud
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-400">
              BackOffice
            </span>
          </span>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="BackOffice">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            {!collapsed ? (
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                {group.label}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        active
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <Icon
                        className={`h-4.5 w-4.5 shrink-0 ${collapsed ? 'mx-auto' : ''}`}
                        aria-hidden="true"
                      />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed ? (
        <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
            Plataforma educativa
          </p>
          <Link
            href="/"
            className="mt-1 block truncate text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Ver el sitio público →
          </Link>
        </div>
      ) : null}
    </aside>
  );
}
