/**
 * Metadatos de assets de producto (SUBFASE 12.3.2) — lógica pura.
 *
 * Este módulo es client-safe (sin storage ni filesystem): define las reglas de
 * ruta en el bucket, validación de subida, estado de upload y versionado. Las
 * operaciones con Storage viven en `assets.ts` (server-only) y las server
 * actions en `actions.ts`.
 *
 * Convención de Storage:
 *   bucket `product-assets` (privado) → ruta `productSlug/assetSlug`.
 *   El nombre de descarga se deriva de `file_name` del metadato (sin ext en la
 *   ruta; el contentType se fija en la subida).
 */
import type { ProductAsset, ProductAssetType } from '@/lib/content/types';

/** Tamaño máximo aceptado por el bucket (250 MB). Debe coincidir con 00015. */
export const MAX_ASSET_BYTES = 262144000;

/** Tipos MIME permitidos por el bucket `product-assets` (migración 00015). */
export const ALLOWED_ASSET_MIMES: string[] = [
  'application/pdf',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
  'video/mp4',
  'application/zip',
  'application/octet-stream',
];

/** Mapeo de tipo de asset → MIME típico (para sugerencias y validación). */
export const DEFAULT_MIME_BY_TYPE: Record<ProductAssetType, string> = {
  pdf: 'application/pdf',
  audio: 'audio/mpeg',
  video: 'video/mp4',
  zip: 'application/zip',
  plantilla: 'application/zip',
  otro: 'application/octet-stream',
};

/** Ruta del objeto dentro del bucket `product-assets` (sin prefijo del bucket). */
export function assetStoragePath(productSlug: string, assetSlug: string): string {
  return `${productSlug}/${assetSlug}`;
}

/** ¿El asset ya tiene un archivo subido? (estado del badge en BackOffice). */
export const isAssetUploaded = (uploadedAt: string | null): boolean =>
  Boolean(uploadedAt);

/** Versión siguiente tras una re-subida (el re-upload siempre incrementa). */
export const nextAssetVersion = (version: number): number =>
  (Number.isFinite(version) ? version : 1) + 1;

/** Tipo de asset sugerido a partir del MIME del archivo. */
export function guessAssetTypeFromMime(mime: string): ProductAssetType {
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'video/mp4') return 'video';
  if (mime === 'application/zip') return 'zip';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/octet-stream') return 'otro';
  if (mime.includes('document') || mime.includes('sheet')) return 'plantilla';
  return 'otro';
}

export type AssetUploadValidation =
  | { ok: true; mime: string; type: ProductAssetType }
  | { ok: false; error: string };

/**
 * Valida los datos de un archivo a subir contra los límites del bucket y el
 * tipo declarado en el Markdown. Devuelve el MIME efectivo y el tipo.
 */
export function validateAssetUpload(input: {
  fileName?: string;
  mime?: string;
  sizeBytes?: number;
  type?: ProductAssetType;
}): AssetUploadValidation {
  if (!input.fileName || !input.fileName.trim()) {
    return { ok: false, error: 'Falta el nombre del archivo.' };
  }
  const size = input.sizeBytes ?? 0;
  if (size <= 0) {
    return { ok: false, error: 'El archivo está vacío.' };
  }
  if (size > MAX_ASSET_BYTES) {
    return { ok: false, error: 'El archivo supera el límite de 250 MB.' };
  }
  const mime = input.mime ?? 'application/octet-stream';
  if (!ALLOWED_ASSET_MIMES.includes(mime)) {
    return {
      ok: false,
      error: `El tipo de archivo ${mime} no está permitido. Use PDF, audio, video o ZIP.`,
    };
  }
  const type = input.type ?? guessAssetTypeFromMime(mime);
  return { ok: true, mime, type };
}

/** Estado de un asset en la BD (columnas relevantes de `product_assets`). */
export type AssetDbState = {
  uploaded_at: string | null;
  storage_path: string | null;
  version: number;
};

/** Vista fusionada MD + BD para el BackOffice (estado del uploader). */
export type AssetMergeState = {
  assetSlug: string;
  title: string;
  fileName: string;
  mime: string;
  sizeBytes: number;
  type: ProductAssetType;
  version: number;
  sortOrder: number;
  uploaded: boolean;
  storagePath: string | null;
};

/**
 * Fusiona el asset declarado en el Markdown con su fila de `product_assets`.
 * El Markdown es la fuente del título/nombre; la BD aporta el estado de subida.
 */
export function mergeAssetWithDb(
  asset: ProductAsset,
  db: AssetDbState | null
): AssetMergeState {
  return {
    assetSlug: asset.slug,
    title: asset.title,
    fileName: asset.fileName,
    mime: asset.mime,
    sizeBytes: asset.sizeBytes,
    type: asset.type,
    version: db?.version ?? asset.version,
    sortOrder: asset.sortOrder ?? 0,
    uploaded: isAssetUploaded(db?.uploaded_at ?? null),
    storagePath: db?.storage_path ?? null,
  };
}

/** Aplica los metadatos del archivo subido a un asset declarado. */
export function applyUploadMetadata(
  asset: ProductAsset,
  input: { fileName: string; mime: string; sizeBytes: number; type: ProductAssetType }
): ProductAsset {
  return {
    ...asset,
    fileName: input.fileName,
    mime: input.mime,
    sizeBytes: input.sizeBytes,
    type: input.type,
  };
}
