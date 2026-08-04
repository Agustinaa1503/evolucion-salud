'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminRole } from '@/lib/auth/session';
import { logAdminEvent } from '@/lib/admin/audit';
import { grantLicensesForOrder, revokeLicense } from '@/lib/shop/licenses';
import { getOrder } from '@/lib/orders';

export type AdminOrdersActionResult =
  | { ok: true; message?: string; granted?: number }
  | { ok: false; error: string };

/** Reenvía la entrega de una orden pagada (idempotente): crea las licencias
 * faltantes y manda los emails. Requiere `admin.orders.write`. */
export async function adminReGrantOrder(orderId: string): Promise<AdminOrdersActionResult> {
  const session = await requireAdminRole('admin.orders.write');
  if (!orderId) return { ok: false, error: 'Falta la orden.' };
  const order = await getOrder(orderId);
  if (!order) return { ok: false, error: 'Orden no encontrada.' };
  if (order.status !== 'paid') {
    return { ok: false, error: 'La orden todavía no está pagada.' };
  }
  const { granted } = await grantLicensesForOrder(orderId);
  await logAdminEvent({
    action: 'admin_change',
    category: 'orders',
    targetType: 'order',
    targetId: orderId,
    detail: { op: 'regrant', granted: granted.length, by: session.user.email },
  });
  revalidatePath('/admin/pedidos');
  return { ok: true, message: `Entrega reenviada (${granted.length} licencias nuevas).` };
}

/** Revoca una licencia (el comprador pierde el acceso). Requiere
 * `admin.orders.write`. */
export async function adminRevokeLicense(licenseId: string): Promise<AdminOrdersActionResult> {
  const session = await requireAdminRole('admin.orders.write');
  if (!licenseId) return { ok: false, error: 'Falta la licencia.' };
  const ok = await revokeLicense(licenseId);
  if (!ok) return { ok: false, error: 'Licencia no encontrada.' };
  await logAdminEvent({
    action: 'admin_change',
    category: 'orders',
    targetType: 'license',
    targetId: licenseId,
    detail: { op: 'revoke', by: session.user.email },
  });
  revalidatePath('/admin/pedidos');
  return { ok: true, message: 'Licencia revocada.' };
}
