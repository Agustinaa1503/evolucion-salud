'use server';

/**
 * Server actions de assets de producto (SUBFASE 12.3.2).
 *
 * Upload / preview / remove de archivos descargables desde el BackOffice.
 * Todas exigen rol admin con permiso de recursos; usan service_role para el
 * Storage y la tabla `product_assets`, y quedan en auditoría.
 */
import { revalidatePath } from 'next/cache';
import { requireAdminRole } from '@/lib/auth/session';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { logAdminEvent } from '@/lib/admin/audit';
import {
  applyUploadMetadata,
  nextAssetVersion,
  validateAssetUpload,
} from './asset-meta';
import {
  createSignedAssetUrl,
  getProductAsset,
  removeAssetObject,
  uploadAssetObject,
} from './assets';

export type ProductAssetActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

function fileSizeOf(file: File): number {
  return typeof file.size === 'number' ? file.size : 0;
}

/**
 * Sube el archivo de un asset declarado en el Markdown del producto. Requiere
 * que el asset exista en `product_assets` (correr `npm run db:sync-products`).
 * Incrementa la versión, fija `uploaded_at`/`storage_path` y actualiza los
 * metadatos del archivo.
 */
export async function uploadProductAsset(formData: FormData): Promise<ProductAssetActionResult> {
  await requireAdminRole('admin.resources.write');

  const productSlug = String(formData.get('productSlug') ?? '');
  const assetSlug = String(formData.get('assetSlug') ?? '');
  const file = formData.get('file');

  if (!productSlug || !assetSlug || !file || !(file instanceof File)) {
    return { ok: false, error: 'Faltan el producto, el asset o el archivo.' };
  }
  if (file.size === 0) {
    return { ok: false, error: 'El archivo está vacío.' };
  }

  const supabase = getServerSupabaseClient();
  if (!supabase) return { ok: false, error: 'Supabase no está configurado.' };

  const declared = await getProductAsset(productSlug, assetSlug);
  if (!declared) {
    return {
      ok: false,
      error: `El asset "${assetSlug}" no está sincronizado. Corra npm run db:sync-products.`,
    };
  }

  const validation = validateAssetUpload({
    fileName: file.name,
    mime: file.type || 'application/octet-stream',
    sizeBytes: fileSizeOf(file),
    type: declared.type as never,
  });
  if (!validation.ok) return { ok: false, error: validation.error };

  const bytes = Buffer.from(await file.arrayBuffer());
  const { path, error } = await uploadAssetObject({
    productSlug,
    assetSlug,
    file: bytes,
    contentType: validation.mime,
  });
  if (error) return { ok: false, error: `No se pudo subir el archivo: ${error}` };

  const version = nextAssetVersion(declared.version);
  const { error: updateError } = await supabase
    .from('product_assets')
    .update({
      storage_path: path,
      uploaded_at: new Date().toISOString(),
      version,
      file_name: file.name,
      mime: validation.mime,
      size_bytes: fileSizeOf(file),
      type: validation.type,
      updated_at: new Date().toISOString(),
    })
    .eq('id', declared.id);
  if (updateError) {
    return { ok: false, error: `Archivo subido, pero no se actualizaron los metadatos: ${updateError.message}` };
  }

  await logAdminEvent({
    action: 'admin_change',
    category: 'products',
    targetType: 'product_asset',
    targetId: `${productSlug}/${assetSlug}`,
    detail: { action: 'upload', version, size: fileSizeOf(file) },
  });

  revalidatePath(`/admin/recursos/${productSlug}`);
  revalidatePath('/admin/recursos');
  return { ok: true, message: `Archivo subido (v${version}).` };
}

/**
 * Elimina el archivo de Storage y deja el asset declarado como "pendiente
 * upload" (no borra el metadato del Markdown).
 */
export async function removeProductAsset(
  productSlug: string,
  assetSlug: string
): Promise<ProductAssetActionResult> {
  await requireAdminRole('admin.resources.write');

  const supabase = getServerSupabaseClient();
  if (!supabase) return { ok: false, error: 'Supabase no está configurado.' };

  const declared = await getProductAsset(productSlug, assetSlug);
  if (!declared) return { ok: false, error: 'El asset no existe.' };

  const removed = await removeAssetObject(productSlug, assetSlug);
  if (!removed.ok) return { ok: false, error: `No se pudo eliminar el archivo: ${removed.error}` };

  const { error: updateError } = await supabase
    .from('product_assets')
    .update({
      storage_path: null,
      uploaded_at: null,
      version: 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', declared.id);
  if (updateError) {
    return { ok: false, error: `Archivo eliminado, pero no se actualizó el estado: ${updateError.message}` };
  }

  await logAdminEvent({
    action: 'admin_change',
    category: 'products',
    targetType: 'product_asset',
    targetId: `${productSlug}/${assetSlug}`,
    detail: { action: 'remove' },
  });

  revalidatePath(`/admin/recursos/${productSlug}`);
  return { ok: true, message: 'Archivo eliminado.' };
}

/** URL firmada para preview/descarga desde el BackOffice (admin). */
export async function signProductAssetUrl(
  productSlug: string,
  assetSlug: string
): Promise<{ url?: string; error?: string }> {
  await requireAdminRole('admin.resources.read');

  const declared = await getProductAsset(productSlug, assetSlug);
  if (!declared || !declared.uploaded_at) {
    return { error: 'El asset no tiene archivo subido.' };
  }

  const signed = await createSignedAssetUrl(productSlug, assetSlug, {
    fileName: declared.file_name,
  });
  if (signed.error) return { error: signed.error };
  return { url: signed.url };
}
