'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, UserCog } from 'lucide-react';
import { adminUpdateUser, adminDeleteUser } from '@/lib/admin/actions';
import { ROLE_LABELS, type Role } from '@/lib/admin/rbac';
import { ConfirmDialog, type ConfirmState } from './ConfirmDialog';

const ASSIGNABLE_ROLES: Role[] = ['super_admin', 'admin', 'editor', 'teacher', 'student', 'guest'];

const ESTADOS = ['activo', 'suspendido', 'bloqueado'] as const;

/**
 * Acciones de un usuario del BackOffice: cambiar rol, cambiar estado y
 * eliminar (con confirmación). Las mutaciones pasan por server actions que
 * validan el permiso del administrador que opera.
 */
export default function AdminUserActions({
  userId,
  rol,
  estado,
  canWrite,
  canDelete,
}: {
  userId: string;
  rol: string;
  estado: string;
  canWrite: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const run = async (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, successMsg: string) => {
    setBusy(true);
    setMessage(null);
    const res = await fn();
    setBusy(false);
    setMessage({ ok: res.ok, text: res.ok ? (res.message ?? successMsg) : (res.error ?? 'Error') });
    if (res.ok) router.refresh();
  };

  if (!canWrite) {
    return <span className="text-xs text-slate-400">Sin permisos para editar.</span>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <UserCog className="h-4 w-4 text-slate-400" aria-hidden="true" />
        <label className="sr-only" htmlFor={`rol-${userId}`}>Rol</label>
        <select
          id={`rol-${userId}`}
          value={rol}
          disabled={busy}
          onChange={(e) => void run(() => adminUpdateUser({ userId, rol: e.target.value }), 'Rol actualizado.')}
          className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor={`estado-${userId}`}>Estado</label>
        <select
          id={`estado-${userId}`}
          value={estado}
          disabled={busy}
          onChange={(e) => void run(() => adminUpdateUser({ userId, estado: e.target.value }), 'Estado actualizado.')}
          className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          {ESTADOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {canDelete ? (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              setConfirm({
                title: 'Eliminar usuario',
                message: 'Se eliminará la cuenta de acceso y el perfil. Esta acción no se puede deshacer.',
                confirmLabel: 'Eliminar',
                danger: true,
                onConfirm: async () => {
                  const res = await adminDeleteUser(userId);
                  setMessage({ ok: res.ok, text: res.ok ? 'Usuario eliminado.' : (res.error ?? 'Error') });
                  router.refresh();
                },
              })
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-50 px-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
            aria-label="Eliminar usuario"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Eliminar
          </button>
        ) : null}
      </div>
      {message ? (
        <p className={`text-xs font-semibold ${message.ok ? 'text-leaf-600 dark:text-leaf-400' : 'text-red-600 dark:text-red-400'}`}>
          {message.text}
        </p>
      ) : null}
      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}
