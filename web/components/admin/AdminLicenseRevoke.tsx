'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldX } from 'lucide-react';
import { adminRevokeLicense } from '@/lib/admin/orders-actions';
import { ConfirmDialog, type ConfirmState } from './ConfirmDialog';

/**
 * Revoca una licencia desde el BackOffice (con confirmación). El comprador
 * pierde el acceso a los descargables de esa licencia.
 */
export default function AdminLicenseRevoke({
  licenseId,
  productTitle,
  canWrite,
}: {
  licenseId: string;
  productTitle: string;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (!canWrite) return null;

  const run = async () => {
    setBusy(true);
    setMessage(null);
    const res = await adminRevokeLicense(licenseId);
    setBusy(false);
    setMessage({ ok: res.ok, text: res.ok ? (res.message ?? 'Revocada.') : (res.error ?? 'Error') });
    if (res.ok) router.refresh();
  };

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          setConfirm({
            title: 'Revocar licencia',
            message: `¿Querés revocar el acceso de "${productTitle}"? El comprador dejará de ver los descargables de esta licencia.`,
            confirmLabel: 'Revocar',
            danger: true,
            onConfirm: run,
          })
        }
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        <ShieldX className="h-3.5 w-3.5" aria-hidden="true" />
        {busy ? '…' : 'Revocar'}
      </button>
      {message && (
        <span className={`text-xs ${message.ok ? 'text-leaf-700' : 'text-red-600'}`}>{message.text}</span>
      )}
      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
    </span>
  );
}
