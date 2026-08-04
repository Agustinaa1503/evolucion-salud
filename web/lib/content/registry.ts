/**
 * Registry del motor de contenido: lee los archivos Markdown de `Contenido/`
 * y expone los documentos tipados con caché por mtime (igual que el registry
 * de cursos). No conoce la lista de archivos: la carpeta se escanea por
 * extensión y cada archivo se parsea según su `kind`.
 */
import fs from 'fs';
import path from 'path';
import { parseContentFile, type FileContentKind } from './parser';
import type { ContentDoc } from './types';

const cache = new Map<string, { mtimeMs: number; doc: ContentDoc }>();

function fileMtime(filePath: string): number {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return -1;
  }
}

/** Ruta absoluta a la carpeta `Contenido/` del proyecto (padre de `web/`). */
export const CONTENIDO_DIR = path.resolve(process.cwd(), '../Contenido');

/** Lee (con caché por mtime) un documento Markdown de `Contenido/`. */
export function readContentFile(
  filePath: string,
  kind: FileContentKind
): ContentDoc {
  const mtime = fileMtime(filePath);
  const hit = cache.get(filePath);
  if (hit && hit.mtimeMs === mtime) return hit.doc;
  const doc = parseContentFile(filePath, kind);
  cache.set(filePath, { mtimeMs: mtime, doc });
  return doc;
}

/**
 * Devuelve todos los documentos de un tipo, ordenados por `order` asc.
 * Los archivos sin extensión `.md`/`.markdown` o cuyo `kind` no coincide con
 * la carpeta se omiten (cursos NO viven en `Contenido/`).
 */
export function getAllContent(kind: FileContentKind): ContentDoc[] {
  const dir = path.join(CONTENIDO_DIR, kind);
  if (!fs.existsSync(dir)) return [];
  const docs: ContentDoc[] = [];
  for (const entry of fs.readdirSync(dir)) {
    if (!entry.endsWith('.md') && !entry.endsWith('.markdown')) continue;
    const filePath = path.join(dir, entry);
    try {
      const doc = readContentFile(filePath, kind);
      if (doc.kind === kind) docs.push(doc);
    } catch (err) {
      // Un documento inválido debe detener la compilación (contrato 12.1).
      throw err instanceof Error
        ? new Error(`[Contenido inválido] ${filePath}\n${err.message}`)
        : err;
    }
  }
  return docs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** Devuelve un documento por slug dentro de un tipo (o undefined). */
export function getContentBySlug(
  kind: FileContentKind,
  slug: string
): ContentDoc | undefined {
  return getAllContent(kind).find((d) => d.slug === slug);
}

/**
 * Solo documentos publicados. Es lo que consume la web pública: la compilación
 * de `generated.ts` usa esta vista para que los borradores/revisión/archivados
 * jamás aparezcan en el sitio (Subfase 12.2 — CMS).
 */
export function getPublicContent(kind: FileContentKind): ContentDoc[] {
  return getAllContent(kind).filter((d) => d.status === 'published');
}

/** Limpia la caché (útil en tests y tras una escritura del CMS). */
export function clearContentCache(): void {
  cache.clear();
}
