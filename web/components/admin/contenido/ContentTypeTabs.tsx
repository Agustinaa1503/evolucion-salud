'use client';

import Link from 'next/link';
import { FileText, Mic, Package, Mail, type LucideIcon } from 'lucide-react';
import {
  CONTENT_KINDS,
  CONTENT_KIND_LABELS,
} from '@/components/admin/contenido/meta';
import type { FileContentKind } from '@/lib/content/parser';

const ICONS: Record<FileContentKind, LucideIcon> = {
  blog: FileText,
  podcast: Mic,
  product: Package,
  newsletter: Mail,
};

/**
 * Tabs de navegación entre los tipos de contenido del CMS.
 */
export default function ContentTypeTabs({
  counts,
  active,
}: {
  counts: Record<string, number>;
  active: FileContentKind;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-card dark:border-slate-800 dark:bg-slate-900">
      {CONTENT_KINDS.map((kind) => {
        const Icon = ICONS[kind];
        const isActive = kind === active;
        return (
          <Link
            key={kind}
            href={`/admin/contenido?kind=${kind}`}
            aria-current={isActive ? 'page' : undefined}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-brand-600 text-white dark:bg-brand-500'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {CONTENT_KIND_LABELS[kind]}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {counts[kind] ?? 0}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
