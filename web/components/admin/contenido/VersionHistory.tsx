'use client';

import { useState } from 'react';
import { GitCompare, ChevronDown, ChevronUp } from 'lucide-react';
import { workflowStatusLabel } from '@/lib/content/workflow';
import { diffVersions, type DiffLine } from '@/lib/content/diff';
import { formatDateTime, timeAgo } from '@/lib/admin/format';
import { Badge, Th, Td } from '@/components/admin/ui';
import type { ContentVersionRow } from '@/lib/content/versioning';

function DiffLineRow({ line }: { line: DiffLine }) {
  if (line.type === 'unchanged') return null;
  const prefix = line.type === 'added' ? '+' : '−';
  const cls =
    line.type === 'added'
      ? 'bg-leaf-50 text-leaf-800 dark:bg-leaf-950/70 dark:text-leaf-300'
      : 'bg-red-50 text-red-700 dark:bg-red-950/70 dark:text-red-300';
  return (
    <div className={`whitespace-pre-wrap px-3 py-0.5 font-mono text-[11px] leading-relaxed ${cls}`}>
      <span className="mr-1 select-none opacity-60">{prefix}</span>
      {line.value}
    </div>
  );
}

function statusTone(status: string): 'leaf' | 'clay' | 'slate' {
  if (status === 'published') return 'leaf';
  if (status === 'review') return 'clay';
  return 'slate';
}

/**
 * Tabla del historial de versiones con vista de diff entre versiones
 * consecutivas (front matter + cuerpo). El estado de apertura vive acá.
 */
export default function VersionHistory({
  kind,
  slug,
  versions,
}: {
  kind: string;
  slug: string;
  versions: ContentVersionRow[];
}) {
  const [open, setOpen] = useState<number | null>(null);
  // versions llegan ordenadas de más reciente a más antigua.
  const toggle = (i: number) => setOpen(open === i ? null : i);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60">
          <tr>
            <Th>Versión</Th>
            <Th>Estado</Th>
            <Th>Editor</Th>
            <Th>Fecha</Th>
            <Th>Nota editorial</Th>
            <Th>Cambios</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {versions.map((v, i) => (
            <VersionRow
              key={v.id}
              v={v}
              isOpen={open === i}
              prev={versions[i + 1] ?? null}
              onToggle={() => toggle(i)}
            />
          ))}
        </tbody>
      </table>
      <p className="sr-only">
        Historial de /{kind}/{slug} — seleccione «Ver cambios» para comparar versiones.
      </p>
    </div>
  );
}

function VersionRow({
  v,
  isOpen,
  prev,
  onToggle,
}: {
  v: ContentVersionRow;
  isOpen: boolean;
  prev: ContentVersionRow | null;
  onToggle: () => void;
}) {
  const diff = isOpen ? diffVersions(prev, v) : [];
  const hasDiff = diff.some((d) => d.type !== 'unchanged');
  return (
    <>
      <tr className="align-top transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
        <Td className="whitespace-nowrap font-bold text-slate-800 dark:text-slate-100">v{v.version}</Td>
        <Td>
          <Badge tone={statusTone(v.status_after)}>
            {workflowStatusLabel(v.status_after as 'draft' | 'review' | 'published' | 'archived')}
          </Badge>
        </Td>
        <Td>
          <span className="text-xs text-slate-600 dark:text-slate-300">{v.editor_email ?? 'sistema'}</span>
          {v.editor_kind === 'agent' ? (
            <span className="ml-1 rounded bg-slate-100 px-1 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              IA
            </span>
          ) : null}
        </Td>
        <Td>
          <span className="block text-xs text-slate-600 dark:text-slate-300" title={formatDateTime(v.created_at)}>
            {timeAgo(v.created_at)}
          </span>
          <span className="block text-[11px] text-slate-400">{formatDateTime(v.created_at)}</span>
        </Td>
        <Td>
          <span className="text-xs text-slate-600 dark:text-slate-300">{v.summary ?? '—'}</span>
        </Td>
        <Td>
          <button
            type="button"
            onClick={onToggle}
            disabled={!prev}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-expanded={isOpen}
          >
            <GitCompare className="h-3.5 w-3.5" aria-hidden="true" />
            {isOpen ? 'Ocultar cambios' : 'Ver cambios'}
            {isOpen ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </Td>
      </tr>
      {isOpen ? (
        <tr>
          <td colSpan={6} className="bg-slate-50/50 px-4 py-3 dark:bg-slate-900/40">
            {!hasDiff ? (
              <p className="text-xs text-slate-400">
                Sin diferencias en el contenido (solo cambió el estado o la nota editorial).
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="border-b border-slate-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:border-slate-700">
                  {prev
                    ? `Cambios de v${prev.version} → v${v.version} (front matter + cuerpo)`
                    : 'Versión inicial'}
                </div>
                <div className="max-h-96 divide-y divide-slate-100 overflow-auto dark:divide-slate-800">
                  {diff.map((line, idx) => (
                    <DiffLineRow key={idx} line={line} />
                  ))}
                </div>
              </div>
            )}
          </td>
        </tr>
      ) : null}
    </>
  );
}
