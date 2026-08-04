/**
 * Serializer del motor de contenido.
 *
 * Genera el archivo Markdown canónico de un `ContentDoc`. Diseñado para el
 * futuro CMS visual:
 *  - preserva el orden de los campos del Front Matter (el objeto `frontmatter`
 *    conserva el orden del archivo original al parsear);
 *  - formato consistente (js-yaml con opciones fijas), para no generar ruido
 *    en Git;
 *  - no reescribe archivos que no cambiaron (ver `contentChanged`): si un
 *    archivo fue editado a mano y su contenido semántico no cambió, no se
 *    toca y se conservan sus comentarios/formato originales.
 */
import yaml from 'js-yaml';
import { parseContentString, type FileContentKind } from './parser';
import type { ContentDoc } from './types';

const DUMP_OPTIONS: yaml.DumpOptions = {
  lineWidth: 120,
  noRefs: true,
  quotingType: '"',
  sortKeys: false,
};

/**
 * Orden canónico de las claves del Front Matter por tipo de contenido
 * (Subfase 12.2 — CMS). Los campos propios del kind primero y los transversales
 * al final (`status`, `locale`, `version`, `createdAt`, `updatedAt`, `seo`,
 * `translations`). El CMS siempre escribe en este orden → diffs de Git estables.
 * Las claves desconocidas o añadidas a mano se conservan al final, en su orden.
 */
const CANONICAL_ORDER: Record<FileContentKind, string[]> = {
  blog: [
    'kind', 'order', 'slug', 'title', 'excerpt', 'date', 'category', 'readTime',
    'categories', 'tags', 'level', 'audience', 'icon', 'gradient', 'image',
    'status', 'locale', 'version', 'versionSummary', 'createdAt', 'updatedAt',
    'seo', 'translations',
  ],
  podcast: [
    'kind', 'order', 'slug', 'title', 'description', 'duration', 'series',
    'embedUrl', 'spotifyUrl', 'youtubeUrl', 'categories', 'tags', 'level',
    'audience', 'icon', 'gradient', 'image',
    'status', 'locale', 'version', 'versionSummary', 'createdAt', 'updatedAt',
    'seo', 'translations',
  ],
  product: [
    'kind', 'order', 'slug', 'title', 'subtitle', 'description',
    'shortDescription', 'price', 'currency', 'priceArs', 'taxRate', 'sku',
    'compareAt', 'interval', 'format', 'author', 'duration', 'level',
    'productType', 'components', 'badge', 'recommended', 'categories', 'tags',
    'audience', 'features', 'includes', 'related', 'assets', 'banner',
    'gallery', 'icon', 'gradient', 'image',
    'status', 'locale', 'version', 'versionSummary', 'createdAt', 'updatedAt',
    'seo', 'translations',
  ],
  newsletter: [
    'kind', 'order', 'slug', 'title', 'description', 'date', 'categories',
    'tags', 'level', 'audience',
    'status', 'icon', 'gradient', 'locale', 'version', 'versionSummary',
    'createdAt', 'updatedAt', 'seo', 'translations',
  ],
};

/** Devuelve el front matter con las claves en orden canónico (sin mutar el original). */
export function orderFrontmatter(
  frontmatter: Record<string, unknown>,
  kind: FileContentKind
): Record<string, unknown> {
  const order = CANONICAL_ORDER[kind] ?? [];
  const ordered: Record<string, unknown> = {};
  for (const key of order) {
    if (key in frontmatter) ordered[key] = frontmatter[key];
  }
  for (const key of Object.keys(frontmatter)) {
    if (!order.includes(key)) ordered[key] = frontmatter[key];
  }
  return ordered;
}

/** Serializa un documento a Markdown canónico (`--- frontmatter ---` + body). */
export function serializeContent(doc: ContentDoc): string {
  const ordered = orderFrontmatter(doc.frontmatter, doc.kind as FileContentKind);
  const frontmatter = yaml.dump(ordered, DUMP_OPTIONS).trimEnd();
  const body = doc.body.trim();
  return `---\n${frontmatter}\n---\n\n${body}\n`;
}

/** Comparación profunda simple (objects/arrays/primitivos). */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  const aArr = Array.isArray(a);
  const bArr = Array.isArray(b);
  if (aArr !== bArr) return false;
  if (aArr && bArr) {
    const aa = a as unknown[];
    const bb = b as unknown[];
    if (aa.length !== bb.length) return false;
    return aa.every((v, i) => deepEqual(v, bb[i]));
  }
  const aKeys = Object.keys(a as Record<string, unknown>);
  const bKeys = Object.keys(b as Record<string, unknown>);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) =>
    Object.prototype.hasOwnProperty.call(b, k) &&
    deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])
  );
}

/**
 * ¿Cambió el contenido respecto a un archivo existente?
 *
 * Compara SEMÁNTICAMENTE (front matter parseado + body), no por bytes. Si el
 * documento es equivalente, devuelve `false` y el llamador no debe reescribir
 * el archivo (preserva comentarios y formato del archivo original).
 */
export function contentChanged(originalContent: string, doc: ContentDoc): boolean {
  let prev: ContentDoc;
  try {
    prev = parseContentString(doc.kind as FileContentKind, originalContent);
  } catch {
    return true;
  }
  return !deepEqual(prev.frontmatter, doc.frontmatter) || prev.body !== doc.body.trim();
}
