/**
 * Compatibilidad viejo modelo (lib/data/legacy TS) ↔ Markdown (Contenido/).
 *
 * La fuente de verdad editorial son los archivos `Contenido/*.md`. Este test
 * verifica que el contenido compilado desde Markdown sigue siendo idéntico al
 * de los datos TS legados (campo a campo), de modo que la migración no
 * cambie URLs, slugs, SEO ni contenido publicado. Los campos agregados en la
 * subfase (productType, components) se excluyen de la comparación porque el
 * modelo antiguo no los tenía.
 */
import { describe, expect, it } from 'vitest';
import {
  docToBlogPost,
  docToEpisode,
  docToNewsletterEdition,
  docToProduct,
} from '@/lib/content/adapters';
import { getAllContent } from '@/lib/content/registry';
import { blogPosts } from '@/lib/data/legacy/blog';
import { podcast } from '@/lib/data/legacy/podcast';
import { products } from '@/lib/data/legacy/products';
import { newsletterEditions } from '@/lib/data/legacy/newsletter';

describe('compatibilidad TS legado ↔ Contenido/*.md', () => {
  it('blog: cada post del Markdown es idéntico al TS legado', () => {
    const md = getAllContent('blog').map(docToBlogPost);
    expect(md).toHaveLength(blogPosts.length);
    for (let i = 0; i < blogPosts.length; i++) {
      expect(md[i].slug).toBe(blogPosts[i].slug);
      expect(md[i].title).toBe(blogPosts[i].title);
      expect(md[i].excerpt).toBe(blogPosts[i].excerpt);
      expect(md[i].date).toBe(blogPosts[i].date);
      expect(md[i].category).toBe(blogPosts[i].category);
      expect(md[i].readTime).toBe(blogPosts[i].readTime);
      expect(md[i].categories ?? []).toEqual(blogPosts[i].categories ?? []);
      expect(md[i].tags ?? []).toEqual(blogPosts[i].tags ?? []);
      expect(md[i].level ?? null).toBe(blogPosts[i].level ?? null);
      expect(md[i].audience ?? []).toEqual(blogPosts[i].audience ?? []);
      expect(md[i].icon).toBe(blogPosts[i].icon);
      expect(md[i].gradient).toBe(blogPosts[i].gradient);
      expect(md[i].image).toBe(blogPosts[i].image);
      expect(md[i].sections).toEqual(blogPosts[i].sections);
    }
  });

  it('podcast: cada episodio del Markdown es idéntico al TS legado', () => {
    const md = getAllContent('podcast').map(docToEpisode);
    expect(md).toHaveLength(podcast.episodes.length);
    for (let i = 0; i < podcast.episodes.length; i++) {
      const e = podcast.episodes[i];
      expect(md[i].slug).toBe(e.slug);
      expect(md[i].title).toBe(e.title);
      expect(md[i].description).toBe(e.description);
      expect(md[i].duration).toBe(e.duration);
      expect(md[i].embedUrl ?? null).toBe(e.embedUrl ?? null);
      expect(md[i].spotifyUrl ?? '').toBe(e.spotifyUrl ?? '');
      expect(md[i].youtubeUrl ?? '').toBe(e.youtubeUrl ?? '');
      expect(md[i].categories ?? []).toEqual(e.categories ?? []);
      expect(md[i].tags ?? []).toEqual(e.tags ?? []);
      expect(md[i].level ?? null).toBe(e.level ?? null);
      expect(md[i].audience ?? []).toEqual(e.audience ?? []);
      expect(md[i].icon).toBe(e.icon);
      expect(md[i].image).toBe(e.image);
      expect(md[i].gradient).toBe(e.gradient);
    }
  });

  it('product: cada producto del Markdown es idéntico al TS legado (campos nuevos excluidos)', () => {
    const md = getAllContent('product').map(docToProduct);
    expect(md).toHaveLength(products.length);
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      expect(md[i].slug).toBe(p.slug);
      expect(md[i].title).toBe(p.title);
      expect(md[i].subtitle).toBe(p.subtitle);
      expect(md[i].description).toBe(p.description);
      expect(md[i].price).toBe(p.price);
      expect(md[i].compareAt ?? null).toBe(p.compareAt ?? null);
      expect(md[i].interval ?? null).toBe(p.interval ?? null);
      expect(md[i].level).toBe(p.level);
      expect(md[i].badge ?? null).toBe(p.badge ?? null);
      expect(md[i].categories ?? []).toEqual(p.categories ?? []);
      expect(md[i].tags ?? []).toEqual(p.tags ?? []);
      expect(md[i].audience ?? []).toEqual(p.audience ?? []);
      expect(md[i].features).toEqual(p.features);
      expect(md[i].includes).toEqual(p.includes);
      expect(md[i].icon).toBe(p.icon);
      expect(md[i].gradient).toBe(p.gradient);
      expect(md[i].image).toBe(p.image);
      expect(md[i].recommended ?? false).toBe(p.recommended ?? false);
    }
  });

  it('newsletter: cada edición del Markdown es idéntica al TS legado', () => {
    const md = getAllContent('newsletter').map(docToNewsletterEdition);
    expect(md).toHaveLength(newsletterEditions.length);
    for (let i = 0; i < newsletterEditions.length; i++) {
      const n = newsletterEditions[i];
      expect(md[i].slug).toBe(n.slug);
      expect(md[i].title).toBe(n.title);
      expect(md[i].description).toBe(n.description);
      expect(md[i].date ?? null).toBe(n.date ?? null);
      expect(md[i].categories ?? []).toEqual(n.categories ?? []);
      expect(md[i].tags ?? []).toEqual(n.tags ?? []);
      expect(md[i].level ?? null).toBe(n.level ?? null);
      expect(md[i].audience ?? []).toEqual(n.audience ?? []);
      expect(md[i].icon ?? null).toBe(n.icon ?? null);
      expect(md[i].gradient ?? null).toBe(n.gradient ?? null);
    }
  });
});
