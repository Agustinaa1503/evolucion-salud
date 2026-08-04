/**
 * Capa de abstracción del almacén de contenido (Subfase 12.2 — CMS).
 *
 * El CMS **nunca escribe archivos directamente**: toda persistencia pasa por el
 * `ContentRepository`. Hoy la implementación activa es `MarkdownRepository` (la
 * fuente editorial sigue siendo el Markdown de `Contenido/`). `SupabaseRepository`
 * y `GitRepository` quedan preparadas para fases futuras (12.3+) **sin caminos
 * paralelos**: el servicio, la validación y el workflow son comunes a cualquier
 * repositorio, de modo que migrar la persistencia no cambia la lógica del CMS.
 *
 * Configuración: env `CONTENT_REPOSITORY` (`markdown` | `supabase` | `git`).
 * Default: `markdown`. Solo server/build: lee el filesystem.
 */
import fs from 'fs';
import path from 'path';
import { compileContent, writeMarkdownToContenido } from './compile';
import {
  CONTENIDO_DIR,
  clearContentCache,
  getAllContent,
  getContentBySlug,
} from './registry';
import type { FileContentKind } from './parser';
import type { ContentDoc } from './types';

export type RepositoryKind = 'markdown' | 'supabase' | 'git';

/** Contrato que debe cumplir cualquier almacén de contenido. */
export interface ContentRepository {
  readonly kind: RepositoryKind;
  /** Lista todos los documentos de un tipo (incluye no publicados). */
  list(kind: FileContentKind): ContentDoc[];
  /** Devuelve un documento por slug (o undefined). */
  get(kind: FileContentKind, slug: string): ContentDoc | undefined;
  /** Indica si el documento existe. */
  exists(kind: FileContentKind, slug: string): boolean;
  /** Persiste un documento. Devuelve si hubo un cambio real. */
  save(doc: ContentDoc): { saved: boolean };
  /** Elimina físicamente un documento. Devuelve si existía. */
  remove(kind: FileContentKind, slug: string): boolean;
  /** Recompila la copia pública compilada (generated/). */
  compile(): void;
}

export class RepositoryNotImplementedError extends Error {
  readonly repositoryKind: RepositoryKind;

  constructor(kind: RepositoryKind) {
    super(
      `[content] El repositorio '${kind}' aún no está implementado (previsto para una fase posterior).`
    );
    this.name = 'RepositoryNotImplementedError';
    this.repositoryKind = kind;
  }
}

/** Implementación activa: los archivos Markdown de `Contenido/`. */
export class MarkdownRepository implements ContentRepository {
  readonly kind: RepositoryKind = 'markdown';

  list(kind: FileContentKind): ContentDoc[] {
    return getAllContent(kind);
  }

  get(kind: FileContentKind, slug: string): ContentDoc | undefined {
    return getContentBySlug(kind, slug);
  }

  exists(kind: FileContentKind, slug: string): boolean {
    return this.get(kind, slug) !== undefined;
  }

  save(doc: ContentDoc): { saved: boolean } {
    const saved = writeMarkdownToContenido(doc);
    if (saved) clearContentCache();
    return { saved };
  }

  remove(kind: FileContentKind, slug: string): boolean {
    const filePath = path.join(CONTENIDO_DIR, kind, `${slug}.md`);
    if (!fs.existsSync(filePath)) return false;
    fs.unlinkSync(filePath);
    clearContentCache();
    return true;
  }

  compile(): void {
    compileContent();
  }
}

/** Plantilla para los repositorios futuros: falla con mensaje claro. */
class NotImplementedRepository implements ContentRepository {
  readonly kind: RepositoryKind;

  constructor(kind: RepositoryKind) {
    this.kind = kind;
  }

  list(_kind: FileContentKind): ContentDoc[] {
    throw new RepositoryNotImplementedError(this.kind);
  }

  get(_kind: FileContentKind, _slug: string): ContentDoc | undefined {
    throw new RepositoryNotImplementedError(this.kind);
  }

  exists(_kind: FileContentKind, _slug: string): boolean {
    throw new RepositoryNotImplementedError(this.kind);
  }

  save(_doc: ContentDoc): { saved: boolean } {
    throw new RepositoryNotImplementedError(this.kind);
  }

  remove(_kind: FileContentKind, _slug: string): boolean {
    throw new RepositoryNotImplementedError(this.kind);
  }

  compile(): void {
    throw new RepositoryNotImplementedError(this.kind);
  }
}

/** Preparado para fases futuras (persistencia en Supabase). */
export class SupabaseRepository extends NotImplementedRepository {
  constructor() {
    super('supabase');
  }
}

/** Preparado para fases futuras (persistencia en Git). */
export class GitRepository extends NotImplementedRepository {
  constructor() {
    super('git');
  }
}

let singleton: ContentRepository | null = null;

/** Devuelve el repositorio configurado (singleton por proceso). */
export function getContentRepository(): ContentRepository {
  if (singleton) return singleton;
  const configured = (process.env.CONTENT_REPOSITORY ?? 'markdown') as RepositoryKind;
  if (configured === 'markdown') {
    singleton = new MarkdownRepository();
  } else if (configured === 'supabase') {
    singleton = new SupabaseRepository();
  } else if (configured === 'git') {
    singleton = new GitRepository();
  } else {
    throw new Error(
      `[content] CONTENT_REPOSITORY inválido: '${String(process.env.CONTENT_REPOSITORY)}'. ` +
        `Valores válidos: markdown | supabase | git.`
    );
  }
  return singleton;
}

/** Reemplaza el repositorio (uso interno / tests). Pasar `null` resetea. */
export function setContentRepository(repo: ContentRepository | null): void {
  singleton = repo;
}
