/**
 * Versioner de contenido sobre Supabase (Subfase 12.2 — CMS).
 *
 * Implementa `ContentVersioner` con la tabla `content_versions`:
 *  - `log` usa la RPC `log_content_version` (security definer) con el cliente de
 *    sesión del administrador autenticado; el editor queda en `auth.uid()` salvo
 *    que `entry.editorId` lo indique explícitamente (agentes).
 *  - `list` lee el historial del documento (solo roles con `admin.content.read`
 *    por RLS).
 *
 * Solo server: depende de cookies/sesión.
 */
import { createServerSupabaseClient } from '@/lib/auth/session';
import type {
  ContentVersionEntry,
  ContentVersionRow,
  ContentVersioner,
} from './versioning';
import type { FileContentKind } from './parser';

export async function createSupabaseVersioner(): Promise<ContentVersioner> {
  const supabase = await createServerSupabaseClient();

  return {
    async log(entry: ContentVersionEntry): Promise<boolean> {
      try {
        const { error } = await supabase.rpc('log_content_version', {
          p_content_type: entry.content_type,
          p_content_slug: entry.content_slug,
          p_version: entry.version,
          p_status_after: entry.status_after,
          p_summary: entry.summary ?? undefined,
          p_frontmatter: entry.frontmatter as never,
          p_body: entry.body,
          p_editor_id: entry.editorId ?? undefined,
          p_editor_kind: entry.editorKind ?? 'human',
        });
        return !error;
      } catch {
        return false;
      }
    },

    async list(
      content_type: FileContentKind,
      content_slug: string
    ): Promise<ContentVersionRow[]> {
      try {
        const { data } = await supabase
          .from('content_versions')
          .select('*')
          .eq('content_type', content_type)
          .eq('content_slug', content_slug)
          .order('version', { ascending: false });
        return (data ?? []) as unknown as ContentVersionRow[];
      } catch {
        return [];
      }
    },
  };
}
