'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminRole } from '@/lib/auth/session';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { isServerSupabaseConfigured } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/admin/rbac';
import { logAdminEvent } from '@/lib/admin/audit';
import { mergeGroup, type SettingsGroup } from '@/lib/admin/settings';

export type AdminActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

/**
 * Actualiza el rol, el estado o los datos de un usuario desde el BackOffice.
 * Requiere `admin.users.write`. La escritura se hace con service_role (la RLS
 * del usuario solo lee lo propio) y queda registrada en auditoría.
 */
export async function adminUpdateUser(input: {
  userId: string;
  rol?: string;
  estado?: string;
  nombre?: string;
  apellido?: string;
}): Promise<AdminActionResult> {
  const session = await requireAdminRole('admin.users.write');
  if (!input.userId) return { ok: false, error: 'Falta el usuario.' };

  const patch: { rol?: string; estado?: string; nombre?: string; apellido?: string } = {};
  if (input.rol !== undefined) patch.rol = input.rol;
  if (input.estado !== undefined) patch.estado = input.estado;
  if (input.nombre !== undefined) patch.nombre = input.nombre;
  if (input.apellido !== undefined) patch.apellido = input.apellido;
  if (Object.keys(patch).length === 0) return { ok: false, error: 'No hay cambios.' };

  const supabase = getServerSupabaseClient();
  if (!supabase) return { ok: false, error: 'Supabase no está configurado.' };

  const { error } = await supabase.from('profiles').update(patch).eq('id', input.userId);
  if (error) return { ok: false, error: error.message };

  await logAdminEvent({
    action: 'admin_change',
    category: 'users',
    targetType: 'user',
    targetId: input.userId,
    detail: { changed: Object.keys(patch), by: session.user.email },
  });

  revalidatePath('/admin/usuarios');
  revalidatePath('/admin/usuarios/[id]', 'layout');
  return { ok: true, message: 'Usuario actualizado.' };
}

/**
 * Elimina un usuario (auth + perfil) desde el BackOffice. Requiere
 * `admin.users.delete`. Se elimina primero el usuario de auth (con su cascada)
 * y luego el perfil residual si quedara.
 */
export async function adminDeleteUser(userId: string): Promise<AdminActionResult> {
  const session = await requireAdminRole('admin.users.delete');
  if (!userId) return { ok: false, error: 'Falta el usuario.' };
  if (userId === session.user.id) {
    return { ok: false, error: 'No puede eliminar su propia cuenta.' };
  }

  const supabase = getServerSupabaseClient();
  if (!supabase) return { ok: false, error: 'Supabase no está configurado.' };

  try {
    await supabase.auth.admin.deleteUser(userId);
  } catch {
    return { ok: false, error: 'No se pudo eliminar la cuenta de autenticación.' };
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);
  if (profileError) {
    return { ok: false, error: `Usuario de auth eliminado, pero el perfil quedó pendiente: ${profileError.message}` };
  }

  await logAdminEvent({
    action: 'admin_change',
    category: 'users',
    targetType: 'user',
    targetId: userId,
    detail: { action: 'delete', by: session.user.email },
  });

  revalidatePath('/admin/usuarios');
  return { ok: true, message: 'Usuario eliminado.' };
}

/**
 * Guarda un grupo de configuración del BackOffice. Requiere
 * `admin.settings.write`. Solo guarda campos conocidos del esquema.
 */
export async function adminUpdateSettings(
  group: SettingsGroup,
  values: Record<string, string>
): Promise<AdminActionResult> {
  const session = await requireAdminRole('admin.settings.write');
  const merged = mergeGroup(group, values);

  const supabase = getServerSupabaseClient();
  if (!supabase) return { ok: false, error: 'Supabase no está configurado.' };

  const { error } = await supabase.from('backoffice_settings').upsert(
    { key: group, value: merged as never, updated_at: new Date().toISOString(), updated_by: session.user.id },
    { onConflict: 'key' }
  );
  if (error) return { ok: false, error: error.message };

  await logAdminEvent({
    action: 'settings',
    category: 'settings',
    targetType: 'setting',
    targetId: group,
    detail: { changed: Object.keys(values), by: session.user.email },
  });

  revalidatePath('/admin/configuracion');
  return { ok: true, message: 'Configuración guardada.' };
}

/**
 * Estado de configuración de Supabase para el BackOffice. Se expone en el
 * módulo Configuración para diagnóstico.
 */
export async function adminBackofficeStatus(): Promise<{
  ok: boolean;
  configured: boolean;
  version?: string;
}> {
  await requireAdminRole('admin.settings.read');
  if (!isServerSupabaseConfigured) return { ok: false, configured: false };
  return { ok: true, configured: true, version: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'conectado' : 'sin URL' };
}

export { hasPermission };
