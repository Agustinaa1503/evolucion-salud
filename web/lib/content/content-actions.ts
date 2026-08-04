'use server';

/**
 * Server actions del CMS de contenido (Subfase 12.2).
 *
 * Estas acciones son la interfaz entre el BackOffice (`/admin/contenido`) y el
 * `ContentService`. Todo pasa por la misma ruta que los agentes de IA:
 * validación → transición de estado → bump de versión → historial (RPC) →
 * recompilación de la copia pública.
 *
 * Permisos: `admin.content.read` para leer/listar/historial y
 * `admin.content.write` para guardar/publicar/eliminar.
 */
import { revalidatePath } from 'next/cache';
import { requireAdminRole } from '@/lib/auth/session';
import { getContentRepository } from '@/lib/content/repository';
import {
  ContentService,
  type ContentActor,
  type SaveResult,
} from '@/lib/content/service';
import { createSupabaseVersioner } from '@/lib/content/supabase-versioner';
import { logAdminEvent } from '@/lib/admin/audit';
import type { FileContentKind } from '@/lib/content/parser';
import type { ContentDoc, EditorialStatus } from '@/lib/content/types';
import type { ContentVersionRow } from '@/lib/content/versioning';

const KINDS: FileContentKind[] = ['blog', 'podcast', 'product', 'newsletter'];

// Regex de slug (mismo criterio que el parser).
const SLUG_OK = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function toKind(value: string): FileContentKind | null {
  return (KINDS as string[]).includes(value) ? (value as FileContentKind) : null;
}

const KIND_META: Record<FileContentKind, { category: string; targetType: string }> = {
  blog: { category: 'blog', targetType: 'blog_post' },
  podcast: { category: 'podcast', targetType: 'episode' },
  product: { category: 'resources', targetType: 'product' },
  newsletter: { category: 'newsletter', targetType: 'newsletter' },
};

function revalidateAllContent(): void {
  for (const path of [
    '/admin/contenido',
    '/admin/blog',
    '/admin/podcast',
    '/admin/recursos',
    '/admin/newsletter',
    '/blog',
    '/podcast',
    '/tienda',
    '/newsletter',
    '/biblioteca',
    '/categorias',
    '/tags',
    '/buscar',
  ]) {
    revalidatePath(path, 'layout');
  }
  revalidatePath('/', 'layout');
}

async function getCmsService(): Promise<ContentService> {
  const versioner = await createSupabaseVersioner();
  return new ContentService(getContentRepository(), versioner);
}

/** Lista los documentos de un tipo (incluye borradores). */
export async function cmsListContent(kind: string): Promise<ContentDoc[]> {
  await requireAdminRole('admin.content.read');
  const k = toKind(kind);
  if (!k) return [];
  const service = await getCmsService();
  return service.list(k);
}

/** Devuelve un documento (o null). */
export async function cmsGetContent(
  kind: string,
  slug: string
): Promise<ContentDoc | null> {
  await requireAdminRole('admin.content.read');
  const k = toKind(kind);
  if (!k || !slug) return null;
  const service = await getCmsService();
  return service.get(k, slug) ?? null;
}

/** Historial de versiones de un documento. */
export async function cmsContentHistory(
  kind: string,
  slug: string
): Promise<ContentVersionRow[]> {
  await requireAdminRole('admin.content.read');
  const k = toKind(kind);
  if (!k || !slug) return [];
  const versioner = await createSupabaseVersioner();
  return versioner.list(k, slug);
}

export type CmsSaveInput = {
  kind: string;
  slug: string;
  frontmatter: Record<string, unknown>;
  body: string;
  /** Estado destino (por defecto el del front matter o `draft`). */
  status?: EditorialStatus;
  summary?: string | null;
};

/** Guarda un documento (crea o actualiza). Requiere `admin.content.write`. */
export async function cmsSaveContent(input: CmsSaveInput): Promise<SaveResult> {
  const session = await requireAdminRole('admin.content.write');
  const k = toKind(input.kind);
  if (!k) return { ok: false, error: 'Tipo de contenido inválido.' };
  if (!input.slug || !SLUG_OK.test(input.slug)) {
    return { ok: false, error: 'Slug inválido (solo minúsculas, números y guiones).' };
  }

  const status = (input.status ?? 'draft') as EditorialStatus;
  const frontmatter: Record<string, unknown> = {
    ...input.frontmatter,
    kind: k,
    slug: input.slug,
    status,
  };
  const doc = {
    ...frontmatter,
    kind: k,
    slug: input.slug,
    status,
    body: input.body ?? '',
    frontmatter,
  } as unknown as ContentDoc;

  const service = await getCmsService();
  const actor: ContentActor = { id: session.user.id, email: session.user.email, kind: 'human' };
  const result = await service.save(doc, actor, { summary: input.summary ?? null });

  if (result.ok) {
    await logAdminEvent({
      action: result.published ? 'publish' : 'admin_change',
      category: KIND_META[k].category,
      targetType: KIND_META[k].targetType,
      targetId: input.slug,
      detail: {
        action: result.published ? 'publish' : 'save',
        version: result.version,
        status,
        summary: input.summary ?? null,
        by: session.user.email,
      },
    });
    revalidateAllContent();
  }

  return result;
}

/** Publica un documento existente. Requiere `admin.content.write`. */
export async function cmsPublishContent(
  kind: string,
  slug: string,
  summary?: string | null
): Promise<SaveResult> {
  const session = await requireAdminRole('admin.content.write');
  const k = toKind(kind);
  if (!k) return { ok: false, error: 'Tipo de contenido inválido.' };

  const service = await getCmsService();
  const actor: ContentActor = { id: session.user.id, email: session.user.email, kind: 'human' };
  const result = await service.publish(k, slug, actor, summary ?? undefined);

  if (result.ok) {
    await logAdminEvent({
      action: 'publish',
      category: KIND_META[k].category,
      targetType: KIND_META[k].targetType,
      targetId: slug,
      detail: { action: 'publish', version: result.version, by: session.user.email },
    });
    revalidateAllContent();
  }
  return result;
}

/** Cambia el estado de un documento (draft/review/published/archived). */
export async function cmsSetStatus(
  kind: string,
  slug: string,
  status: EditorialStatus,
  summary?: string | null
): Promise<SaveResult> {
  const session = await requireAdminRole('admin.content.write');
  const k = toKind(kind);
  if (!k) return { ok: false, error: 'Tipo de contenido inválido.' };

  const service = await getCmsService();
  const actor: ContentActor = { id: session.user.id, email: session.user.email, kind: 'human' };
  const result = await service.setStatus(k, slug, status, actor, { summary: summary ?? null });

  if (result.ok) {
    await logAdminEvent({
      action: status === 'published' ? 'publish' : 'admin_change',
      category: KIND_META[k].category,
      targetType: KIND_META[k].targetType,
      targetId: slug,
      detail: { action: 'set_status', status, version: result.version, by: session.user.email },
    });
    revalidateAllContent();
  }
  return result;
}

/** Elimina físicamente un documento (se recomienda archivar). */
export async function cmsDeleteContent(
  kind: string,
  slug: string
): Promise<{ ok: boolean; removed?: boolean; error?: string }> {
  const session = await requireAdminRole('admin.content.write');
  const k = toKind(kind);
  if (!k) return { ok: false, error: 'Tipo de contenido inválido.' };

  const service = await getCmsService();
  const result = service.remove(k, slug);

  if (result.ok) {
    await logAdminEvent({
      action: 'admin_change',
      category: KIND_META[k].category,
      targetType: KIND_META[k].targetType,
      targetId: slug,
      detail: { action: 'delete', by: session.user.email },
    });
    revalidateAllContent();
  }
  return result;
}
