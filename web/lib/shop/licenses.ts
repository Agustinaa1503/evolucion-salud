/**
 * Licencias y biblioteca digital (SUBFASE 12.5).
 *
 * Cierra el ciclo de venta: cuando una orden pasa a `paid`, se crean las
 * licencias de los productos comprados (idempotente), se envía el email de
 * entrega con el enlace de acceso y el comprador descarga los assets desde
 * `/acceso/[token]` o `/mi-biblioteca` (URL firmada del bucket privado
 * `product-assets`). Cada descarga se registra en `asset_downloads`.
 *
 * Solo se importa en el servidor (server components / server actions / api):
 * usa el cliente service_role (atraviesa RLS; la validación de pertenencia
 * se hace en el código). Las firmas de URLs y los assets viven en
 * `lib/products/assets.ts`; la entrega por email en `lib/email`.
 */
import { createHash, randomBytes } from 'node:crypto';
import { getOrder } from '@/lib/orders';
import { getProduct } from '@/lib/data/products';
import {
  createSignedAssetUrl,
  getProductAssets,
  type ProductAssetRow,
} from '@/lib/products/assets';
import { sendPurchaseAccessEmail } from '@/lib/email';
import { getServerSupabaseClient } from '@/lib/supabase/server';

export type LicenseStatus = 'active' | 'revoked';

export type LicenseRow = {
  id: string;
  email: string;
  customer_name: string | null;
  user_id: string | null;
  order_id: string;
  product_slug: string;
  product_title: string;
  access_token: string;
  status: LicenseStatus;
  granted_at: string;
  last_downloaded_at: string | null;
  created_at: string;
};

export type OrderItem = { slug?: string; qty?: number; price?: number };

/** Una licencia lista para mostrar/descargar (licencia + producto + assets). */
export type LicenseAccess = {
  license: LicenseRow;
  product: {
    slug: string;
    title: string;
    description: string;
    format: string;
    level: string;
    banner?: string | null;
  };
  assets: {
    slug: string;
    title: string;
    file_name: string;
    mime: string;
    size_bytes: number;
    downloaded?: boolean;
    signedUrl?: string;
    urlExpiresIn: number;
  }[];
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/** Token de acceso aleatorio y único por licencia (32 bytes hex). */
export function createAccessToken(): string {
  return randomBytes(16).toString('hex');
}

/** Slug normalizado a partir del nombre de archivo (para el registro). */
export function fileSlug(fileName: string): string {
  return createHash('sha1').update(fileName).digest('hex').slice(0, 16);
}

/**
 * Extrae los ítems de una orden y resuelve qué licencias corresponden.
 * Lógica pura (testeable): recibe el array de items y un resolvedor de
 * productos. Devuelve las licencias a crear (productos válidos con precio).
 */
export function orderItemsToLicenses(
  items: unknown,
  resolver: (slug: string) => { title: string; price: number } | undefined = (
    slug
  ) => getProduct(slug)
): { product_slug: string; product_title: string; qty: number; price: number }[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const result: {
    product_slug: string;
    product_title: string;
    qty: number;
    price: number;
  }[] = [];
  for (const raw of items as OrderItem[]) {
    const slug = typeof raw?.slug === 'string' ? raw.slug.trim() : '';
    if (!slug || seen.has(slug)) continue;
    const product = resolver(slug);
    if (!product || product.price <= 0) continue;
    seen.add(slug);
    result.push({
      product_slug: slug,
      product_title: product.title,
      qty: Math.max(1, Number(raw.qty) || 1),
      price: Number(raw.price) || product.price,
    });
  }
  return result;
}

/**
 * Crea (o recupera) las licencias de una orden pagada. Idempotente: si la
 * licencia ya existe para (order_id, product_slug), no la duplica ni reenvía
 * el email. Devuelve las licencias de la orden.
 */
export async function grantLicensesForOrder(
  orderId: string,
  order?: { email: string; customer_name: string | null; items: unknown; status: string }
): Promise<{ granted: LicenseRow[]; all: LicenseRow[] }> {
  const sb = getServerSupabaseClient();
  const resolved =
    order ??
    ((await getOrder(orderId)) as {
      email: string;
      customer_name: string | null;
      items: unknown;
      status: string;
    } | null) ??
    null;
  if (!sb || !resolved || resolved.status !== 'paid') {
    return { granted: [], all: [] };
  }

  const entries = orderItemsToLicenses(resolved.items);
  const rows = entries.map((e) => ({
    email: resolved.email.toLowerCase(),
    customer_name: resolved.customer_name,
    order_id: orderId,
    product_slug: e.product_slug,
    product_title: e.product_title,
    access_token: createAccessToken(),
    status: 'active' as const,
  }));

  let granted: LicenseRow[] = [];
  if (rows.length > 0) {
    const { data, error } = await sb
      .from('licenses')
      .upsert(rows, {
        onConflict: 'order_id,product_slug',
        ignoreDuplicates: true,
      })
      .select('*');
    if (error) {
      console.error('[licenses] grantLicensesForOrder:', error.message);
    } else {
      granted = (data ?? []) as LicenseRow[];
      // Entrega: un email por licencia recién creada (solo las insertadas).
      await Promise.all(
        granted.map(async (lic) => {
          await sendPurchaseAccessEmail({
            email: lic.email,
            name: lic.customer_name ?? undefined,
            productTitle: lic.product_title,
            accessUrl: `${APP_URL}/acceso/${lic.access_token}`,
          }).catch(() => null);
        })
      );
    }
  }

  const { data: all } = await sb
    .from('licenses')
    .select('*')
    .eq('order_id', orderId);
  return { granted, all: (all ?? []) as LicenseRow[] };
}

/** Si la orden está pagada, garantiza sus licencias (webhook y polling). */
export async function deliverIfPaid(order: {
  id: string;
  status: string;
}): Promise<{ granted: LicenseRow[]; all: LicenseRow[] }> {
  if (order.status !== 'paid') return { granted: [], all: [] };
  return grantLicensesForOrder(order.id);
}

/** Resuelve un producto + assets firmados para una licencia dada. */
async function buildLicenseAccess(
  lic: LicenseRow
): Promise<LicenseAccess | null> {
  const product = getProduct(lic.product_slug);
  if (!product) return null;
  const assets = await getProductAssets(lic.product_slug);
  const withUrls = await Promise.all(
    assets
      .filter((a) => a.uploaded_at)
      .map(async (a) => {
        const signed = await createSignedAssetUrl(lic.product_slug, a.asset_slug, {
          fileName: a.file_name,
        });
        return {
          slug: a.asset_slug,
          title: a.title,
          file_name: a.file_name,
          mime: a.mime,
          size_bytes: a.size_bytes,
          signedUrl: signed.url,
          urlExpiresIn: 3600,
        };
      })
  );
  return {
    license: lic,
    product: {
      slug: product.slug,
      title: product.title,
      description: product.shortDescription ?? product.description ?? '',
      format: product.format ?? 'recurso',
      level: product.level,
      banner: product.banner ?? null,
    },
    assets: withUrls,
  };
}

/** Todas las licencias activas de un usuario (por uid y por email). */
export async function getMyLicenses(input: {
  userId: string;
  email: string;
}): Promise<LicenseAccess[]> {
  const sb = getServerSupabaseClient();
  if (!sb) return [];
  const email = input.email.toLowerCase();

  // Vincular compras hechas con este email antes de registrar el usuario.
  await sb
    .from('licenses')
    .update({ user_id: input.userId })
    .is('user_id', null)
    .eq('email', email);

  const { data, error } = await sb
    .from('licenses')
    .select('*')
    .or(`user_id.eq.${input.userId},email.eq.${email}`)
    .eq('status', 'active')
    .order('granted_at', { ascending: false });
  if (error) {
    console.error('[licenses] getMyLicenses:', error.message);
    return [];
  }
  const rows = (data ?? []) as LicenseRow[];
  const resolved = await Promise.all(rows.map(buildLicenseAccess));
  return resolved.filter((l): l is LicenseAccess => l !== null);
}

/** Acceso público de una licencia por token (página /acceso/[token]). */
export async function getLicenseByToken(
  token: string
): Promise<LicenseAccess | null> {
  const sb = getServerSupabaseClient();
  if (!sb || !token) return null;
  const { data, error } = await sb
    .from('licenses')
    .select('*')
    .eq('access_token', token)
    .eq('status', 'active')
    .maybeSingle();
  if (error || !data) return null;
  return buildLicenseAccess(data as LicenseRow);
}

/**
 * Registra una descarga de un asset. Se valida que el caller posea la
 * licencia (por token o por sesión) antes de invocarla. Actualiza también
 * `last_downloaded_at` de la licencia.
 */
export async function recordAssetDownload(input: {
  licenseId: string;
  productSlug: string;
  assetSlug: string;
  fileName?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const sb = getServerSupabaseClient();
  if (!sb) return { ok: false, error: 'Supabase no está configurado.' };
  const { error } = await sb.from('asset_downloads').insert({
    license_id: input.licenseId,
    product_slug: input.productSlug,
    asset_slug: input.assetSlug,
    file_name: input.fileName ?? null,
  });
  if (error) return { ok: false, error: error.message };
  await sb
    .from('licenses')
    .update({ last_downloaded_at: new Date().toISOString() })
    .eq('id', input.licenseId);
  return { ok: true };
}

/** Revoca una licencia (administración). Devuelve false si no existía. */
export async function revokeLicense(licenseId: string): Promise<boolean> {
  const sb = getServerSupabaseClient();
  if (!sb) return false;
  const { data, error } = await sb
    .from('licenses')
    .update({ status: 'revoked' })
    .eq('id', licenseId)
    .select('id')
    .single();
  return !error && !!data;
}

export type { ProductAssetRow };
