/**
 * Assets de producto — capa de servidor (SUBFASE 12.3.2).
 *
 * Solo se importa en server components / server actions: usa el cliente
 * service_role para tocar Storage (bucket privado `product-assets`) y la tabla
 * `product_assets`. El guard de rol corre ANTES en las server actions; este
 * módulo no conoce la sesión.
 *
 * La entrega al usuario final (URL firmada por licencia + registro de
 * descargas) es la SUBFASE 12.5; acá se construye la gestión del equipo
 * (upload / preview / remove) y los metadatos.
 */
import { getServerSupabaseClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { assetStoragePath } from './asset-meta';

export type ProductAssetRow = {
  id: string;
  product_slug: string;
  asset_slug: string;
  title: string;
  file_name: string;
  mime: string;
  size_bytes: number;
  storage_path: string | null;
  type: string;
  version: number;
  sort_order: number;
  uploaded_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Duración por defecto de las URLs firmadas (60 min). */
export const SIGNED_URL_TTL_SECONDS = 3600;

/** Lee todos los assets declarados y sincronizados de un producto. */
export async function getProductAssets(
  productSlug: string
): Promise<ProductAssetRow[]> {
  const supabase = getServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('product_assets')
    .select('*')
    .eq('product_slug', productSlug)
    .order('sort_order')
    .order('created_at');
  if (error) {
    console.error('[product-assets] getProductAssets:', error.message);
    return [];
  }
  return (data ?? []) as ProductAssetRow[];
}

/** Lee todos los assets de todos los productos (para el BackOffice y sync). */
export async function getAllProductAssets(): Promise<ProductAssetRow[]> {
  const supabase = getServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('product_assets')
    .select('*')
    .order('product_slug')
    .order('sort_order');
  if (error) {
    console.error('[product-assets] getAllProductAssets:', error.message);
    return [];
  }
  return (data ?? []) as ProductAssetRow[];
}

/** Busca un asset puntual por su slug dentro del producto. */
export async function getProductAsset(
  productSlug: string,
  assetSlug: string
): Promise<ProductAssetRow | null> {
  const supabase = getServerSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('product_assets')
    .select('*')
    .eq('product_slug', productSlug)
    .eq('asset_slug', assetSlug)
    .maybeSingle();
  if (error) {
    console.error('[product-assets] getProductAsset:', error.message);
    return null;
  }
  return (data ?? null) as ProductAssetRow | null;
}

/** ¿Existe el objeto en Storage? (la entrega en 12.5 exige objeto presente). */
export async function assetObjectExists(
  productSlug: string,
  assetSlug: string
): Promise<boolean> {
  const supabase = getServerSupabaseClient();
  if (!supabase) return false;
  const { data } = await supabase.storage
    .from('product-assets')
    .list(productSlug, { limit: 100, offset: 0, search: assetSlug });
  return (data ?? []).some((o) => o.name === assetSlug);
}

/**
 * Sube el archivo al bucket privado `product-assets` (upsert). Devuelve la
 * ruta del objeto y el tamaño efectivo. El contentType se fija explícitamente
 * para que el browser sirva el archivo correctamente sin extensión en la ruta.
 */
export async function uploadAssetObject(input: {
  productSlug: string;
  assetSlug: string;
  file: ArrayBuffer | Buffer;
  contentType: string;
}): Promise<{ path: string; error?: string }> {
  const supabase = getServerSupabaseClient();
  if (!supabase) return { path: '', error: 'Supabase no está configurado.' };

  const storagePath = assetStoragePath(input.productSlug, input.assetSlug);
  const { error } = await supabase.storage
    .from('product-assets')
    .upload(storagePath, input.file, {
      contentType: input.contentType,
      upsert: true,
      cacheControl: '3600',
    });
  if (error) return { path: '', error: error.message };
  return { path: storagePath };
}

/** Elimina el objeto de Storage (si existe). No falla si ya no está. */
export async function removeAssetObject(
  productSlug: string,
  assetSlug: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServerSupabaseClient();
  if (!supabase) return { ok: false, error: 'Supabase no está configurado.' };

  const storagePath = assetStoragePath(productSlug, assetSlug);
  const { error } = await supabase.storage
    .from('product-assets')
    .remove([storagePath]);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * URL firmada de un asset (para preview/descarga en BackOffice y, desde 12.5,
 * para la entrega por licencia). El nombre de descarga se toma de `file_name`.
 */
export async function createSignedAssetUrl(
  productSlug: string,
  assetSlug: string,
  options: { fileName?: string; expiresIn?: number } = {}
): Promise<{ url?: string; error?: string }> {
  const supabase = getServerSupabaseClient();
  if (!supabase) return { error: 'Supabase no está configurado.' };

  const { data, error } = await supabase.storage
    .from('product-assets')
    .createSignedUrl(
      assetStoragePath(productSlug, assetSlug),
      options.expiresIn ?? SIGNED_URL_TTL_SECONDS,
      options.fileName ? { download: options.fileName } : undefined
    );
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}

export { isServerSupabaseConfigured };
