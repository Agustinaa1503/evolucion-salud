'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  FileClock,
  Pencil,
  Archive,
  Send,
  Trash2,
  Undo2,
} from 'lucide-react';
import {
  cmsDeleteContent,
  cmsSetStatus,
} from '@/lib/content/content-actions';
import { ConfirmDialog, type ConfirmState } from '@/components/admin/ConfirmDialog';
import type { FileContentKind } from '@/lib/content/parser';
import type { EditorialStatus } from '@/lib/content/types';

function StatusMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <span className="block max-w-40 text-[11px] leading-snug text-red-600 dark:text-red-400">
      {message}
    </span>
  );
}

const actionClasses =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800';

/**
 * Acciones por fila del listado de contenido: editar, historial, cambios de
 * estado (workflow) y eliminación (con confirmación). Llaman a las server
 * actions del CMS y refrescan la lista.
 */
export default function ContentRowActions({
  kind,
  slug,
  status,
}: {
  kind: FileContentKind;
  slug: string;
  status: EditorialStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const run = (action: () => Promise<unknown>) => {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res && typeof res === 'object' && 'ok' in res && (res as { ok: boolean }).ok === false) {
        setError((res as { error?: string }).error ?? 'No se pudo completar la acción.');
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href={`/admin/contenido/${kind}/${slug}`}
        className={actionClasses}
        title="Editar"
        aria-label="Editar"
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </Link>
      <Link
        href={`/admin/contenido/${kind}/${slug}/historial`}
        className={actionClasses}
        title="Historial de versiones"
        aria-label="Historial"
      >
        <FileClock className="h-4 w-4" aria-hidden="true" />
      </Link>
      {status === 'draft' || status === 'review' ? (
        <button
          type="button"
          className={`${actionClasses} hover:border-leaf-300 hover:text-leaf-600 dark:hover:border-leaf-700`}
          title="Publicar"
          aria-label="Publicar"
          disabled={isPending}
          onClick={() => run(() => cmsSetStatus(kind, slug, 'published'))}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
      {status === 'published' || status === 'review' ? (
        <button
          type="button"
          className={actionClasses}
          title="Archivar"
          aria-label="Archivar"
          disabled={isPending}
          onClick={() => run(() => cmsSetStatus(kind, slug, 'archived'))}
        >
          <Archive className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
      {status === 'archived' ? (
        <button
          type="button"
          className={actionClasses}
          title="Reabrir como borrador"
          aria-label="Reabrir como borrador"
          disabled={isPending}
          onClick={() => run(() => cmsSetStatus(kind, slug, 'draft'))}
        >
          <Undo2 className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
      <button
        type="button"
        className={`${actionClasses} hover:border-red-300 hover:text-red-600 dark:hover:border-red-700 dark:hover:text-red-400`}
        title="Eliminar (se recomienda archivar)"
        aria-label="Eliminar"
        disabled={isPending}
        onClick={() =>
          setConfirm({
            title: 'Eliminar documento',
            message: `Se eliminará físicamente /${kind}/${slug} de Contenido/ y se recompilará la web. El historial en Supabase se conserva. ¿Continuar?`,
            confirmLabel: 'Eliminar',
            danger: true,
            onConfirm: async () => {
              await cmsDeleteContent(kind, slug);
              router.refresh();
            },
          })
        }
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
      <StatusMessage message={error} />
      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
      {status === 'published' ? (
        <Link
          href={`/${kind === 'product' ? 'tienda' : kind}/${slug}`}
          className={`${actionClasses} hidden text-leaf-600 hover:text-leaf-700 dark:text-leaf-400 md:inline-flex`}
          title="Ver en la web"
          aria-label="Ver en la web"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
