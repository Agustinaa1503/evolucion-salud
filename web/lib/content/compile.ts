/**
 * Compilación del contenido (Subfase 12.2 — CMS).
 *
 * Extrae de `scripts/sync-content.mts` la generación de la copia compilada que
 * consume la web (`web/lib/data/generated/`, particionada por tipo, sin
 * filesystem → segura para client components). Lo usa tanto el script CLI como
 * el CMS (tras cada guardado) para que el sitio público se actualice.
 *
 * Reglas:
 *  - La fuente de verdad editorial son los archivos Markdown de `Contenido/`.
 *  - Solo se compila contenido `published` (`getPublicContent`): los borradores,
 *    revisiones y archivados jamás aparecen en la web pública.
 *  - `writeMarkdownToContenido` es la única puerta de escritura de archivos de
 *    contenido (junto con `MarkdownRepository`); escribe de forma atómica y no
 *    reescribe archivos semánticamente iguales (preserva formato manual).
 *
 * Solo server/build: lee el filesystem. Nunca importar desde client components.
 */
import fs from 'fs';
import path from 'path';
import { getAllContent, getPublicContent, CONTENIDO_DIR, clearContentCache } from './registry';
import { contentChanged, serializeContent } from './serializer';
import {
  docToBlogPost,
  docToEpisode,
  docToNewsletterEdition,
  docToProduct,
} from './adapters';
import type { FileContentKind } from './parser';
import type {
  BlogPost,
  ContentDoc,
  Episode,
  NewsletterEdition,
  Product,
} from './types';

const GENERATED_DIR = path.resolve(process.cwd(), 'lib/data/generated');

const HEADER = [
  '// AUTO-GENERADO por `npm run db:sync-content` — NO EDITAR A MANO.',
  '// Fuente de verdad editorial: los archivos Markdown de `Contenido/`.',
  '// Ver web/lib/content/compile.ts para el flujo de trabajo.',
  '',
].join('\n');

const KINDS: FileContentKind[] = ['blog', 'podcast', 'product', 'newsletter'];

/* -------------------------------------------------------------------------- */
/* Escritura de Markdown                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Escribe un documento en `Contenido/<kind>/<slug>.md` de forma atómica.
 * Devuelve `true` si se escribió (cambio real) o `false` si el archivo ya era
 * semánticamente idéntico (no se toca, se preserva el formato manual).
 */
export function writeMarkdownToContenido(doc: ContentDoc): boolean {
  const filePath = path.join(CONTENIDO_DIR, doc.kind, `${doc.slug}.md`);
  const serialized = serializeContent(doc);
  if (fs.existsSync(filePath) && !contentChanged(fs.readFileSync(filePath, 'utf8'), doc)) {
    return false;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, serialized, 'utf8');
  fs.renameSync(tmp, filePath);
  return true;
}

/* -------------------------------------------------------------------------- */
/* Generación de generated/ (copia pública compilada)                          */
/* -------------------------------------------------------------------------- */

function arrayToTs(name: string, type: string, arr: unknown[]): string {
  const body = JSON.stringify(arr, null, 2);
  return `export const ${name}: ${type}[] = ${body};\n`;
}

/** Datos públicos compilados por tipo (solo `published`). */
export function publicData(): {
  blog: BlogPost[];
  episodes: Episode[];
  products: Product[];
  newsletter: NewsletterEdition[];
} {
  return {
    blog: getPublicContent('blog').map(docToBlogPost),
    episodes: getPublicContent('podcast').map(docToEpisode),
    products: getPublicContent('product').map(docToProduct),
    newsletter: getPublicContent('newsletter').map(docToNewsletterEdition),
  };
}

/** Regenera los archivos `lib/data/generated/{blog,podcast,products,newsletter,index}.ts`. */
export function generateGeneratedTs(): {
  blog: number;
  episodes: number;
  products: number;
  newsletter: number;
} {
  const { blog, episodes, products, newsletter } = publicData();

  fs.mkdirSync(GENERATED_DIR, { recursive: true });

  const blogSrc =
    HEADER +
    `import type { BlogPost } from '@/lib/content/types';\n\n` +
    arrayToTs('blogPosts', 'BlogPost', blog) +
    '\n' +
    `export const getBlogPost = (slug: string): BlogPost | undefined =>\n  blogPosts.find((p) => p.slug === slug);\n\n` +
    `export const featuredPosts: BlogPost[] = blogPosts.slice(0, 3);\n`;
  fs.writeFileSync(path.join(GENERATED_DIR, 'blog.ts'), blogSrc, 'utf8');

  const podcastSrc =
    HEADER +
    `import type { Episode } from '@/lib/content/types';\n\n` +
    arrayToTs('episodes', 'Episode', episodes) +
    '\n';
  fs.writeFileSync(path.join(GENERATED_DIR, 'podcast.ts'), podcastSrc, 'utf8');

  const productsSrc =
    HEADER +
    `import type { Product } from '@/lib/content/types';\n\n` +
    arrayToTs('products', 'Product', products) +
    '\n' +
    `export const getProduct = (slug: string): Product | undefined =>\n  products.find((p) => p.slug === slug);\n\n` +
    `export const featuredProducts: Product[] = products\n  .filter((p) => p.level !== 'lead-magnet')\n  .slice(0, 3);\n`;
  fs.writeFileSync(path.join(GENERATED_DIR, 'products.ts'), productsSrc, 'utf8');

  const newsletterSrc =
    HEADER +
    `import type { NewsletterEdition } from '@/lib/content/types';\n\n` +
    arrayToTs('newsletterEditions', 'NewsletterEdition', newsletter) +
    '\n';
  fs.writeFileSync(path.join(GENERATED_DIR, 'newsletter.ts'), newsletterSrc, 'utf8');

  fs.writeFileSync(
    path.join(GENERATED_DIR, 'index.ts'),
    HEADER + `export * from './blog';\nexport * from './podcast';\nexport * from './products';\nexport * from './newsletter';\n`,
    'utf8'
  );

  return { blog: blog.length, episodes: episodes.length, products: products.length, newsletter: newsletter.length };
}

/**
 * Compila el contenido: limpia la caché del registry y regenera `generated/`.
 * Es la llamada que ejecuta el CMS tras guardar un documento.
 */
export function compileContent(): ReturnType<typeof generateGeneratedTs> {
  clearContentCache();
  return generateGeneratedTs();
}

/**
 * Reescritura única de todos los documentos de `Contenido/` en orden canónico
 * de Front Matter (Subfase 12.2). Semánticamente idéntico: solo reordena claves
 * y normaliza el YAML. Devuelve el total y cuántos archivos cambiaron bytes.
 */
export function canonicalizeContenido(): { total: number; written: number } {
  let total = 0;
  let written = 0;
  for (const kind of KINDS) {
    for (const doc of getAllContent(kind)) {
      total += 1;
      const filePath = path.join(CONTENIDO_DIR, kind, `${doc.slug}.md`);
      const serialized = serializeContent(doc);
      if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8') !== serialized) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, serialized, 'utf8');
        written += 1;
      }
    }
  }
  return { total, written };
}
