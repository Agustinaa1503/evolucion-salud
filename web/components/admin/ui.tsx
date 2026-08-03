/**
 * Kit de UI del BackOffice (componentes presentacionales).
 *
 * Sin `'use client'`: puede importarse desde Server Components y desde
 * componentes cliente. Los componentes con estado propio viven en archivos
 * separados (AdminShell, AdminPagination, ConfirmDialog, etc.).
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, Inbox, type LucideIcon } from 'lucide-react';
import { ROLE_LABELS, type Role } from '@/lib/admin/rbac';

type Tone = 'brand' | 'leaf' | 'clay' | 'sun' | 'ink' | 'slate' | 'red';

const toneClasses: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-950 dark:text-brand-300 dark:ring-brand-800',
  leaf: 'bg-leaf-50 text-leaf-700 ring-leaf-200 dark:bg-leaf-950 dark:text-leaf-300 dark:ring-leaf-800',
  clay: 'bg-clay-50 text-clay-700 ring-clay-200 dark:bg-clay-950 dark:text-clay-300 dark:ring-clay-800',
  sun: 'bg-sun-50 text-sun-800 ring-sun-300 dark:bg-sun-950 dark:text-sun-300 dark:ring-sun-800',
  ink: 'bg-ink-950 text-white ring-ink-900 dark:bg-slate-100 dark:text-ink-950 dark:ring-slate-700',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
  red: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800',
};

export function Badge({
  children,
  tone = 'slate',
  className = '',
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const roleTones: Record<string, Tone> = {
  super_admin: 'red',
  admin: 'brand',
  editor: 'clay',
  teacher: 'leaf',
  student: 'slate',
  alumno: 'slate',
  guest: 'slate',
};

export function RoleBadge({ rol }: { rol?: string | null }) {
  const label = rol ? (ROLE_LABELS[rol as Role] ?? rol) : '—';
  return <Badge tone={roleTones[rol ?? ''] ?? 'slate'}>{label}</Badge>;
}

export function StatusBadge({ estado }: { estado?: string | null }) {
  const map: Record<string, Tone> = {
    activo: 'leaf',
    activa: 'leaf',
    published: 'leaf',
    active: 'leaf',
    completed: 'leaf',
    success: 'leaf',
    waiting: 'clay',
    pendiente: 'clay',
    pending: 'clay',
    in_progress: 'brand',
    'en-curso': 'brand',
    'in-development': 'clay',
    draft: 'slate',
    archived: 'slate',
    upcoming: 'clay',
    inactive: 'slate',
    bloqueado: 'red',
    suspended: 'red',
    error: 'red',
    failed: 'red',
  };
  const label = (estado ?? '—').replace(/_/g, ' ').replace(/-/g, ' ');
  return (
    <Badge tone={map[(estado ?? '').toLowerCase()] ?? 'slate'}>
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </Badge>
  );
}

export function Card({
  title,
  subtitle,
  actions,
  children,
  className = '',
  padded = true,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'brand',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: 'brand' | 'leaf' | 'clay' | 'sun';
}) {
  const iconTones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300',
    leaf: 'bg-leaf-50 text-leaf-600 dark:bg-leaf-950 dark:text-leaf-300',
    clay: 'bg-clay-50 text-clay-600 dark:bg-clay-950 dark:text-clay-300',
    sun: 'bg-sun-50 text-sun-700 dark:bg-sun-950 dark:text-sun-300',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-4">
        {Icon ? (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconTones[tone]}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-1 truncate text-2xl font-extrabold text-slate-900 dark:text-slate-50">
            {value}
          </p>
          {hint ? <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  badge,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            {title}
          </h1>
          {badge}
        </div>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400',
  secondary:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
  ghost:
    'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

export function ButtonLink({
  href,
  children,
  variant = 'secondary',
  className = '',
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${buttonVariants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      ) : null}
      {actionHref && actionLabel ? (
        <ButtonLink href={actionHref} variant="primary" className="mt-5">
          {actionLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </ButtonLink>
      ) : null}
    </div>
  );
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={`whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 text-sm text-slate-700 dark:text-slate-300 ${className}`}>{children}</td>
  );
}
