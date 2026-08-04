/**
 * Parser del motor de contenido: convierte un archivo Markdown de `Contenido/`
 * en un `ContentDoc` tipado, con validación estricta del Front Matter (zod).
 * Un documento inválido lanza un error con el archivo afectado y detiene la
 * compilación.
 */
import fs from 'fs';
import matter from 'gray-matter';
import { validateFrontmatter } from './schemas';
import type { BlogSection, ContentDoc, ContentKind } from './types';

/** Kind que NO proviene de archivos `Contenido/` (cursos viven en `Cursos/`). */
export type FileContentKind = Exclude<ContentKind, 'course'>;

/**
 * Parsea un contenido desde un string. Es la función pura que usan el
 * serializer (detección de cambios), los tests y el CMS.
 */
export function parseContentString(
  kind: FileContentKind,
  raw: string
): ContentDoc {
  const { data, content } = matter(raw);
  // gray-matter cachea por contenido (matter.cache[file.content]) y devuelve
  // el MISMO objeto `data` en parses repetidos de la misma cadena. Se clona
  // para que cada documento sea dueño de sus propios valores: mutar el doc
  // (o su frontmatter) nunca debe envenenar el caché ni otros documentos.
  const rawData = structuredClone(
    (data ?? {}) as Record<string, unknown>
  );
  const frontmatter = validateFrontmatter(kind, rawData, '<string>');

  if (frontmatter.kind !== kind) {
    throw new Error(
      `[Contenido inválido] kind esperado '${kind}', encontrado '${String(frontmatter.kind)}'`
    );
  }

  return {
    ...frontmatter,
    body: content.trim(),
    // El front matter original preserva el orden de los campos del archivo
    // (clave para la estabilidad de Git y para no reordenar ediciones a mano).
    frontmatter: rawData,
  } as ContentDoc;
}

/** Parsea un archivo Markdown validando su Front Matter (errores con la ruta). */
export function parseContentFile(
  filePath: string,
  kind: FileContentKind
): ContentDoc {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  // Mismo clonado defensivo que en parseContentString (caché de gray-matter).
  const rawData = structuredClone(
    (data ?? {}) as Record<string, unknown>
  );
  const frontmatter = validateFrontmatter(kind, rawData, filePath);

  if (frontmatter.kind !== kind) {
    throw new Error(
      `[Contenido inválido] ${filePath} — kind esperado '${kind}', encontrado '${String(frontmatter.kind)}'`
    );
  }

  return {
    ...frontmatter,
    body: content.trim(),
    frontmatter: rawData,
  } as ContentDoc;
}

/**
 * Convierte el cuerpo de un post de blog (Markdown) en secciones
 * `{ heading, paragraphs }`. Cada sección arranca con un encabezado `## `;
 * los párrafos se separan por líneas en blanco.
 */
export function parseBlogSections(body: string): BlogSection[] {
  const trimmed = body.trim();
  if (!trimmed) return [];
  const blocks = trimmed.split(/^## /m);
  const sections: BlogSection[] = [];
  for (const block of blocks.slice(1)) {
    const [headingLine, ...rest] = block.split('\n');
    const paragraphs = rest
      .join('\n')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    sections.push({ heading: headingLine.trim(), paragraphs });
  }
  return sections;
}

/** Convierte secciones de blog en Markdown (inverso de `parseBlogSections`). */
export function serializeBlogBody(sections: BlogSection[]): string {
  return sections
    .map(
      (s) =>
        `## ${s.heading?.trim() ?? ''}\n\n${s.paragraphs.map((p) => p.trim()).join('\n\n')}`
    )
    .join('\n\n')
    .trim();
}
