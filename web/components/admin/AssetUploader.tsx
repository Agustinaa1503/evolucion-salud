'use client';

/**
 * Uploader de asset de producto (SUBFASE 12.3.2).
 *
 * Cliente: recibe un asset declarado en el Markdown del producto y su estado de
 * sync en `product_assets`, y permite subir / previsualizar / eliminar el
 * archivo en el bucket privado `product-assets` vía server actions (guard admin
 * + auditoría en el servidor).
 */
import { useCallback, useRef, useState } from 'react';
import { Download, FileUp, Loader2, Trash2, Upload } from 'lucide-react';
import { uploadProductAsset, removeProductAsset, signProductAssetUrl } from '@/lib/products/actions';
import { assetTypeLabel } from '@/lib/products/types';
import { formatBytes } from '@/lib/admin/format';
import type { AssetMergeState } from '@/lib/products/asset-meta';

export default function AssetUploader({
  productSlug,
  asset,
  canWrite,
}: {
  productSlug: string;
  asset: AssetMergeState;
  canWrite: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const onUpload = useCallback(async () => {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setMessage({ ok: false, text: 'Seleccione un archivo primero.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    const form = new FormData();
    form.set('productSlug', productSlug);
    form.set('assetSlug', asset.assetSlug);
    form.set('file', file);
    const res = await uploadProductAsset(form);
    setBusy(false);
    setMessage({ ok: res.ok, text: res.ok ? (res.message ?? 'Subido.') : (res.error ?? 'Error al subir.') });
    if (res.ok && inputRef.current) inputRef.current.value = '';
  }, [productSlug, asset.assetSlug]);

  const onDownload = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    const res = await signProductAssetUrl(productSlug, asset.assetSlug);
    setBusy(false);
    if (res.url) {
      window.open(res.url, '_blank', 'noopener,noreferrer');
    } else {
      setMessage({ ok: false, text: res.error ?? 'No se pudo generar el enlace.' });
    }
  }, [productSlug, asset.assetSlug]);

  const onRemove = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    const res = await removeProductAsset(productSlug, asset.assetSlug);
    setBusy(false);
    setMessage({ ok: res.ok, text: res.ok ? (res.message ?? 'Eliminado.') : (res.error ?? 'Error al eliminar.') });
  }, [productSlug, asset.assetSlug]);

  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{asset.title}</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {asset.fileName} · {assetTypeLabel[asset.type]}
            {asset.sizeBytes ? ` · ${formatBytes(asset.sizeBytes)}` : ''}
            {asset.uploaded ? ` · v${asset.version}` : ''}
          </p>
        </div>
        {asset.uploaded ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={onDownload}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-leaf-50 px-2.5 text-xs font-semibold text-leaf-700 transition-colors hover:bg-leaf-100 disabled:opacity-50 dark:bg-leaf-950 dark:text-leaf-300 dark:hover:bg-leaf-900"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Descargar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onRemove}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-50 px-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Quitar
            </button>
          </div>
        ) : canWrite ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              aria-label={`Archivo para ${asset.title}`}
              className="block max-w-[220px] text-xs text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-slate-600 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-300"
            />
            <button
              type="button"
              disabled={busy}
              onClick={onUpload}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-400"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Upload className="h-3.5 w-3.5" aria-hidden="true" />}
              Subir
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Sin permisos para subir.</span>
        )}
      </div>
      {message ? (
        <p className={`mt-2 text-xs font-semibold ${message.ok ? 'text-leaf-600 dark:text-leaf-400' : 'text-red-600 dark:text-red-400'}`}>
          {message.text}
        </p>
      ) : null}
      {!asset.uploaded ? (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-clay-600 dark:text-clay-400">
          <FileUp className="h-3 w-3" aria-hidden="true" />
          Pendiente de subida
        </p>
      ) : null}
    </div>
  );
}
