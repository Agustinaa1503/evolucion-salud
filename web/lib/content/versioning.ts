/**
 * Versionado del contenido (Subfase 12.2 — CMS).
 *
 * Cada guardado/publicación de un documento genera una entrada de historial
 * (`ContentVersionEntry`). La implementación por defecto en la web usa la tabla
 * `content_versions` vía RPC definer (ver `supabase-versioner.ts`); este módulo
 * solo define los tipos y el `noopVersioner` para entornos sin Supabase, de modo
 * que guardar contenido jamás falle por falta de infraestructura.
 */
import type { FileContentKind } from './parser';
import type { WorkflowStatus } from './workflow';

export type ContentVersionEntry = {
  content_type: FileContentKind;
  content_slug: string;
  version: number;
  status_after: WorkflowStatus;
  summary?: string | null;
  frontmatter: Record<string, unknown>;
  body: string;
  editorId?: string | null;
  editorKind?: 'human' | 'agent';
};

export type ContentVersionRow = {
  id: string;
  content_type: string;
  content_slug: string;
  version: number;
  status_after: string;
  editor_email: string | null;
  editor_kind: string;
  summary: string | null;
  frontmatter: Record<string, unknown>;
  body: string;
  created_at: string;
};

export interface ContentVersioner {
  /** Registra una versión (no debe lanzar: se degrada a no-op). */
  log(entry: ContentVersionEntry): Promise<boolean>;
  /** Devuelve el historial de un documento (versiones más recientes primero). */
  list(content_type: FileContentKind, content_slug: string): Promise<ContentVersionRow[]>;
}

/** Versioner neutro: nunca persiste ni falla (útil en tests y sin Supabase). */
export const noopVersioner: ContentVersioner = {
  async log() {
    return true;
  },
  async list() {
    return [];
  },
};
