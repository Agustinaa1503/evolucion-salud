/**
 * Servicio de contenido (Subfase 12.2 — CMS).
 *
 * Orquesta las operaciones del CMS sobre cualquier `ContentRepository`:
 * listar, obtener, validar, guardar, cambiar estado, publicar y eliminar. Es la
 * **misma ruta para humanos y agentes de IA**: no existen caminos paralelos.
 *
 * Reglas aplicadas aquí:
 *  - Nada se persiste si `validateDocument` tiene errores.
 *  - Toda transición de estado respeta `workflow.ts`.
 *  - Cada guardado incrementa la versión del documento y la registra en el
 *    versioner (historial).
 *  - Tras cada mutación se recompila la copia pública (generated/) con
 *    `getPublicContent` → los borradores jamás salen a la web.
 *
 * El servicio es agnóstico de persistencia: solo depende de `ContentRepository`
 * y `ContentVersioner` (injectables, testables).
 */
import type { ContentDoc, EditorialStatus } from './types';
import type { FileContentKind } from './parser';
import type { ContentRepository } from './repository';
import { noopVersioner, type ContentVersioner } from './versioning';
import {
  validateDocument,
  type ContentValidationResult,
} from './validate';
import { canTransition, isPublicStatus, workflowStatusLabel } from './workflow';

/** Quién realiza la operación: persona (BackOffice) o agente de IA. */
export type ContentActor = {
  id: string | null;
  email: string | null;
  kind: 'human' | 'agent';
};

export type SaveOptions = {
  /** Nota editorial del cambio (se guarda en el historial). */
  summary?: string | null;
};

export type SaveResult =
  | {
      ok: true;
      saved: boolean;
      version: number;
      doc: ContentDoc;
      published: boolean;
      validation: ContentValidationResult;
    }
  | {
      ok: false;
      error: string;
      validation?: ContentValidationResult;
    };

export type RemoveResult =
  | { ok: true; removed: boolean }
  | { ok: false; error: string };

export class ContentService {
  constructor(
    readonly repo: ContentRepository,
    readonly versioner: ContentVersioner = noopVersioner
  ) {}

  list(kind: FileContentKind): ContentDoc[] {
    return this.repo.list(kind);
  }

  get(kind: FileContentKind, slug: string): ContentDoc | undefined {
    return this.repo.get(kind, slug);
  }

  /** Solo documentos publicados (lo que ve la web). */
  getPublic(kind: FileContentKind): ContentDoc[] {
    return this.repo.list(kind).filter((d) => isPublicStatus(d.status));
  }

  validate(doc: ContentDoc, exceptSlug?: string): ContentValidationResult {
    return validateDocument(doc, { repo: this.repo, exceptSlug });
  }

  /**
   * Guarda un documento (crea o actualiza). Bump de versión, historial y
   * recompilación incluidos. Los errores de validación bloquean.
   */
  async save(
    doc: ContentDoc,
    actor: ContentActor,
    opts: SaveOptions = {}
  ): Promise<SaveResult> {
    const kind = doc.kind as FileContentKind;
    const current = this.repo.get(kind, doc.slug);
    const from: EditorialStatus = current?.status ?? 'draft';
    const to: EditorialStatus = doc.status ?? from;

    if (!canTransition(from, to)) {
      return {
        ok: false,
        error: `Transición de estado inválida: ${workflowStatusLabel(from)} → ${workflowStatusLabel(to)}.`,
      };
    }

    const validation = validateDocument(doc, { repo: this.repo, exceptSlug: doc.slug });
    if (!validation.ok) {
      const first = validation.issues.find((i) => i.severity === 'error');
      return {
        ok: false,
        error: first ? first.message : 'El documento no pasa la validación.',
        validation,
      };
    }

    const version = (current?.version ?? 0) + 1;
    const next: ContentDoc = { ...doc, version };
    const { saved } = this.repo.save(next);

    await this.versioner.log({
      content_type: kind,
      content_slug: next.slug,
      version,
      status_after: to,
      summary: opts.summary ?? null,
      frontmatter: next.frontmatter,
      body: next.body,
      editorId: actor.id,
      editorKind: actor.kind,
    });

    this.repo.compile();

    return {
      ok: true,
      saved,
      version,
      doc: next,
      published: isPublicStatus(to),
      validation,
    };
  }

  /** Cambia el estado de un documento sin tocar el contenido. */
  async setStatus(
    kind: FileContentKind,
    slug: string,
    to: EditorialStatus,
    actor: ContentActor,
    opts: SaveOptions = {}
  ): Promise<SaveResult> {
    const current = this.repo.get(kind, slug);
    if (!current) {
      return { ok: false, error: `No existe el documento ${kind}/${slug}.` };
    }
    return this.save({ ...current, status: to }, actor, opts);
  }

  /** Publica un documento (requiere validación OK; el servicio lo garantiza). */
  publish(
    kind: FileContentKind,
    slug: string,
    actor: ContentActor,
    summary?: string
  ): Promise<SaveResult> {
    return this.setStatus(kind, slug, 'published', actor, { summary });
  }

  /** Elimina físicamente un documento (se recomienda archivar en su lugar). */
  remove(kind: FileContentKind, slug: string): RemoveResult {
    const removed = this.repo.remove(kind, slug);
    if (removed) this.repo.compile();
    return { ok: true, removed };
  }
}
