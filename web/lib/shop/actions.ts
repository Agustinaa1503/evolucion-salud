/**
 * Server actions de la biblioteca digital (SUBFASE 12.5).
 *
 * Acciones para el comprador: listar la propia biblioteca, leer una licencia
 * por token y registrar descargas. La validación de pertenencia corre acá
 * (no se confía en el cliente); el acceso a la BD es service_role.
 */
'use server';

import { requireUser } from '@/lib/auth/session';
import {
  getLicenseByToken,
  getMyLicenses,
  recordAssetDownload,
  type LicenseAccess,
} from '@/lib/shop/licenses';

/** Biblioteca del usuario autenticado (página /mi-biblioteca). */
export async function getMyLibrary(): Promise<LicenseAccess[]> {
  const session = await requireUser();
  if (!session.user.email) return [];
  return getMyLicenses({
    userId: session.user.id,
    email: session.user.email,
  });
}

/** Acceso público de una licencia por token (página /acceso/[token]). */
export async function getAccessByToken(
  token: string
): Promise<LicenseAccess | null> {
  return getLicenseByToken(token);
}

/**
 * Registra una descarga. Se valida que el caller posea la licencia: por
 * sesión (licenseId) o por token público (access token de la licencia).
 * El enlace de descarga (URL firmada) ya fue generado por el servidor.
 */
export async function logAssetDownload(input: {
  licenseId?: string;
  token?: string;
  productSlug: string;
  assetSlug: string;
  fileName?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  if (!input.licenseId && !input.token) {
    return { ok: false, error: 'Falta la licencia.' };
  }
  if (!input.productSlug || !input.assetSlug) {
    return { ok: false, error: 'Falta el asset.' };
  }

  let licenseId = input.licenseId;
  if (input.token) {
    const access = await getLicenseByToken(input.token);
    if (!access) return { ok: false, error: 'Acceso no válido.' };
    licenseId = access.license.id;
  } else if (licenseId) {
    const session = await requireUser();
    const library = await getMyLicenses({
      userId: session.user.id,
      email: session.user.email,
    });
    const owns = library.some((l) => l.license.id === licenseId);
    if (!owns) return { ok: false, error: 'Licencia no encontrada.' };
  }

  if (!licenseId) return { ok: false, error: 'Licencia no encontrada.' };
  return recordAssetDownload({
    licenseId,
    productSlug: input.productSlug,
    assetSlug: input.assetSlug,
    fileName: input.fileName,
  });
}
