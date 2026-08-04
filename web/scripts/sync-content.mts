/**
 * Sincroniza el contenido de Evolución Salud entre su fuente editorial y la
 * web (Subfases 12.1 / 12.2 — motor de contenido unificado + CMS).
 *
 * La fuente de verdad editorial son los archivos Markdown de `Contenido/`.
 * La web consume una copia compilada en `web/lib/data/generated/` (particionada
 * por tipo, sin filesystem, segura para client components). La lógica de
 * compilación vive en `web/lib/content/compile.ts`; este script es solo la CLI:
 *
 *   --from-ts       (1ª migración): transpila los datos TS legados de
 *                   `web/lib/data/legacy/` → `Contenido/<kind>/<slug>.md`
 *                   (validando con zod y sin reescribir archivos sin cambios).
 *
 *   --canonicalize  reescribe todos los `.md` de `Contenido/` en el orden
 *                   canónico de Front Matter (una vez por subfase, idempotente).
 *
 *   (siempre)       lee `Contenido/*.md` con el motor → regenera la copia
 *                   compilada `web/lib/data/generated/` SOLO con contenido
 *                   `published` (borradores/revisión/archivados no salen).
 *
 * Flujo de trabajo editorial: editar el `.md` → `npm run db:sync-content`
 * → rebuild. El script falla (exit != 0) si un Front Matter es inválido o si
 * el contenido migrado difiere del modelo TS legado (compatibilidad).
 *
 * Uso:
 *   npm run db:sync-content              # MD → generated/ (solo publicado)
 *   npm run db:sync-content -- --from-ts       # (re)genera MD desde los TS legados
 *   npm run db:sync-content -- --canonicalize  # reordena Front Matter canónico
 */
import {
  blogPostToDoc,
  docToBlogPost,
  docToEpisode,
  docToNewsletterEdition,
  docToProduct,
  episodeToDoc,
  newsletterToDoc,
  productToDoc,
} from '../lib/content/adapters';
import { parseContentString } from '../lib/content/parser';
import { getAllContent } from '../lib/content/registry';
import { serializeContent } from '../lib/content/serializer';
import {
  canonicalizeContenido,
  generateGeneratedTs,
  writeMarkdownToContenido,
} from '../lib/content/compile';
import { blogPosts } from '../lib/data/legacy/blog';
import { podcast } from '../lib/data/legacy/podcast';
import { products } from '../lib/data/legacy/products';
import { newsletterEditions } from '../lib/data/legacy/newsletter';
import type { BlogPost, Episode, NewsletterEdition, Product } from '../lib/content/types';

const FROM_TS = process.argv.includes('--from-ts');
const CANONICALIZE = process.argv.includes('--canonicalize');

/* -------------------------------------------------------------------------- */
/* Migración desde TS legado (solo 1ª vez, --from-ts)                          */
/* -------------------------------------------------------------------------- */

function migrateFromTs(): void {
  const toDos: Array<{ doc: Parameters<typeof serializeContent>[0] }> = [];

  blogPosts.forEach((post, i) => {
    const doc = blogPostToDoc(post, i);
    parseContentString('blog', serializeContent(doc)); // valida el round-trip
    toDos.push({ doc });
  });
  podcast.episodes.forEach((ep, i) => {
    const doc = episodeToDoc(ep, i);
    parseContentString('podcast', serializeContent(doc));
    toDos.push({ doc });
  });
  products.forEach((p, i) => {
    const doc = productToDoc(p, i);
    parseContentString('product', serializeContent(doc));
    toDos.push({ doc });
  });
  newsletterEditions.forEach((n, i) => {
    const doc = newsletterToDoc(n, i);
    parseContentString('newsletter', serializeContent(doc));
    toDos.push({ doc });
  });

  let written = 0;
  for (const { doc } of toDos) {
    if (writeMarkdownToContenido(doc)) written += 1;
  }
  console.log(
    `[sync-content] --from-ts: ${toDos.length} documentos procesados, ${written} escritos.`
  );
}

/* -------------------------------------------------------------------------- */
/* Verificación de compatibilidad (viejo TS vs Markdown)                       */
/* -------------------------------------------------------------------------- */

function checkCompat(): void {
  const problems: string[] = [];

  const cmpBlog = (a: BlogPost, b: BlogPost): boolean => {
    if (a.slug !== b.slug || a.title !== b.title || a.excerpt !== b.excerpt || a.date !== b.date)
      return false;
    if (a.category !== b.category || a.readTime !== b.readTime) return false;
    if (JSON.stringify(a.categories ?? []) !== JSON.stringify(b.categories ?? [])) return false;
    if (JSON.stringify(a.tags ?? []) !== JSON.stringify(b.tags ?? [])) return false;
    if ((a.level ?? null) !== (b.level ?? null)) return false;
    if (JSON.stringify(a.audience ?? []) !== JSON.stringify(b.audience ?? [])) return false;
    if (a.icon !== b.icon || a.gradient !== b.gradient || a.image !== b.image) return false;
    return JSON.stringify(a.sections) === JSON.stringify(b.sections);
  };

  const legacyBlog = blogPosts;
  const mdBlog = getAllContent('blog').map(docToBlogPost);
  if (legacyBlog.length !== mdBlog.length) {
    problems.push(`blog: cantidades distintas (TS ${legacyBlog.length} vs MD ${mdBlog.length})`);
  } else {
    legacyBlog.forEach((p, i) => {
      if (!cmpBlog(p, mdBlog[i])) problems.push(`blog: difiere el post '${p.slug}'`);
    });
  }

  const legacyEp = podcast.episodes;
  const mdEp = getAllContent('podcast').map(docToEpisode);
  if (legacyEp.length !== mdEp.length) {
    problems.push(`podcast: cantidades distintas (TS ${legacyEp.length} vs MD ${mdEp.length})`);
  } else {
    legacyEp.forEach((e, i) => {
      const m = mdEp[i];
      const same =
        e.slug === m.slug &&
        e.title === m.title &&
        e.description === m.description &&
        e.duration === m.duration &&
        (e.embedUrl ?? null) === (m.embedUrl ?? null) &&
        (e.spotifyUrl ?? '') === (m.spotifyUrl ?? '') &&
        (e.youtubeUrl ?? '') === (m.youtubeUrl ?? '') &&
        JSON.stringify(e.categories ?? []) === JSON.stringify(m.categories ?? []) &&
        JSON.stringify(e.tags ?? []) === JSON.stringify(m.tags ?? []) &&
        (e.level ?? null) === (m.level ?? null) &&
        JSON.stringify(e.audience ?? []) === JSON.stringify(m.audience ?? []) &&
        e.icon === m.icon &&
        e.image === m.image &&
        e.gradient === m.gradient;
      if (!same) problems.push(`podcast: difiere el episodio '${e.slug}'`);
    });
  }

  // Productos: se excluyen los campos agregados en la subfase (productType,
  // components) que el modelo antiguo no tenía.
  const legacyProd = products;
  const mdProd = getAllContent('product').map(docToProduct);
  if (legacyProd.length !== mdProd.length) {
    problems.push(`product: cantidades distintas (TS ${legacyProd.length} vs MD ${mdProd.length})`);
  } else {
    legacyProd.forEach((p, i) => {
      const m = mdProd[i];
      const same =
        p.slug === m.slug &&
        p.title === m.title &&
        p.subtitle === m.subtitle &&
        p.description === m.description &&
        p.price === m.price &&
        (p.compareAt ?? null) === (m.compareAt ?? null) &&
        (p.interval ?? null) === (m.interval ?? null) &&
        p.level === m.level &&
        (p.badge ?? null) === (m.badge ?? null) &&
        JSON.stringify(p.categories ?? []) === JSON.stringify(m.categories ?? []) &&
        JSON.stringify(p.tags ?? []) === JSON.stringify(m.tags ?? []) &&
        JSON.stringify(p.audience ?? []) === JSON.stringify(m.audience ?? []) &&
        JSON.stringify(p.features) === JSON.stringify(m.features) &&
        JSON.stringify(p.includes) === JSON.stringify(m.includes) &&
        p.icon === m.icon &&
        p.gradient === m.gradient &&
        p.image === m.image &&
        (p.recommended ?? false) === (m.recommended ?? false);
      if (!same) problems.push(`product: difiere el producto '${p.slug}'`);
    });
  }

  const legacyNews = newsletterEditions;
  const mdNews = getAllContent('newsletter').map(docToNewsletterEdition);
  if (legacyNews.length !== mdNews.length) {
    problems.push(`newsletter: cantidades distintas (TS ${legacyNews.length} vs MD ${mdNews.length})`);
  } else {
    legacyNews.forEach((n, i) => {
      const m = mdNews[i];
      const same =
        n.slug === m.slug &&
        n.title === m.title &&
        n.description === m.description &&
        (n.date ?? null) === (m.date ?? null) &&
        JSON.stringify(n.categories ?? []) === JSON.stringify(m.categories ?? []) &&
        JSON.stringify(n.tags ?? []) === JSON.stringify(m.tags ?? []) &&
        (n.level ?? null) === (m.level ?? null) &&
        JSON.stringify(n.audience ?? []) === JSON.stringify(m.audience ?? []) &&
        (n.icon ?? null) === (m.icon ?? null) &&
        (n.gradient ?? null) === (m.gradient ?? null);
      if (!same) problems.push(`newsletter: difiere la edición '${n.slug}'`);
    });
  }

  if (problems.length) {
    console.error('[sync-content] compatibilidad viejo TS vs Markdown:\n' + problems.map((p) => `  - ${p}`).join('\n'));
    process.exit(1);
  }
  console.log('[sync-content] compatibilidad TS legado ↔ Markdown: OK (sin diferencias).');
}

/* -------------------------------------------------------------------------- */

function main(): void {
  if (FROM_TS) migrateFromTs();
  if (CANONICALIZE) {
    const res = canonicalizeContenido();
    console.log(`[sync-content] --canonicalize: ${res.total} documentos, ${res.written} reescritos.`);
  }
  checkCompat();
  const counts = generateGeneratedTs();
  console.log(
    `[sync-content] generated/ OK (solo published): ${counts.blog} posts, ${counts.episodes} episodios, ` +
      `${counts.products} productos, ${counts.newsletter} ediciones de newsletter.`
  );
  console.log('[sync-content] listo.');
}

try {
  main();
} catch (err) {
  console.error('[sync-content] error:', err instanceof Error ? err.message : err);
  process.exit(1);
}
