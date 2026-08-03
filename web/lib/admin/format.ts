/**
 * Utilidades de formato y paginación para el BackOffice.
 * Módulo 100% puro (testeable sin BD ni React).
 */

const numberFormat = new Intl.NumberFormat('es-AR');
const compactFormat = new Intl.NumberFormat('es-AR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatNumber = (n: number): string => numberFormat.format(n);

export const formatCompact = (n: number): string => compactFormat.format(n);

export const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })} ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
};

export const timeAgo = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'hace un momento';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `hace ${days} días`;
  const months = Math.round(days / 30);
  if (months < 12) return `hace ${months} meses`;
  return `hace ${Math.round(months / 12)} años`;
};

export const initials = (a?: string | null, b?: string | null): string =>
  [a, b]
    .filter(Boolean)
    .map((s) => (s as string).trim().charAt(0).toUpperCase())
    .join('')
    .slice(0, 2) || '?';

export const fullName = (a?: string | null, b?: string | null): string =>
  [a, b].filter(Boolean).join(' ').trim() || '—';

export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const parsePage = (value: string | string[] | undefined): number => {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
};

export const clampPage = (page: number, totalPages: number): number =>
  Math.max(1, Math.min(page, Math.max(1, totalPages)));

export function paginate<T>(items: T[], page = 1, pageSize = 20): PageResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = clampPage(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
}

/** Convierte filas a CSV (con separador `;` y BOM para Excel en español). */
export function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const escape = (value: string | number | boolean | null | undefined): string => {
    const s = value === null || value === undefined ? '' : String(value);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    '\uFEFF',
    headers.map(escape).join(';'),
    ...rows.map((row) => row.map(escape).join(';')),
  ].join('\n');
}
