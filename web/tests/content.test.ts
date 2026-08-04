/**
 * Tests del motor de contenido unificado (Subfase 12.1):
 * parser + serializer + validación zod + adaptadores (round-trip).
 */
import { describe, expect, it } from 'vitest';
import {
  blogPostToDoc,
  docToBlogPost,
  docToEpisode,
  docToProduct,
  episodeToDoc,
  productToDoc,
} from '@/lib/content/adapters';
import {
  parseBlogSections,
  parseContentString,
  serializeBlogBody,
} from '@/lib/content/parser';
import { contentChanged, serializeContent } from '@/lib/content/serializer';
import { validateFrontmatter } from '@/lib/content/schemas';
import type { Product } from '@/lib/content/types';
import { blogPosts } from '@/lib/data/legacy/blog';
import { podcast } from '@/lib/data/legacy/podcast';
import { products } from '@/lib/data/legacy/products';

const sampleDoc = () =>
  parseContentString('blog', `---
kind: blog
order: 0
slug: test-post
title: Post de prueba
excerpt: Un resumen.
date: "2026-08-01"
category: PINE
readTime: 5 min
categories:
  - pine
tags:
  - test
level: introductorio
audience:
  - publico-general
icon: heart
gradient: from-brand-500 to-leaf-600
image: https://images.example.com/a.jpg
status: published
locale: es
version: 1
createdAt: "2026-08-01"
---

## Sección uno

Primer párrafo.

Segundo párrafo.

## Sección dos

Único párrafo.
`);

describe('parser', () => {
  it('parsea un documento válido con metadatos + body', () => {
    const doc = sampleDoc();
    expect(doc.slug).toBe('test-post');
    expect(doc.title).toBe('Post de prueba');
    expect(doc.status).toBe('published');
    expect(doc.locale).toBe('es');
    expect(doc.categories).toEqual(['pine']);
    expect(doc.body).toContain('## Sección uno');
  });

  it('convierte el body en secciones { heading, paragraphs }', () => {
    const doc = sampleDoc();
    const sections = parseBlogSections(doc.body);
    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe('Sección uno');
    expect(sections[0].paragraphs).toHaveLength(2);
    expect(sections[1].paragraphs).toEqual(['Único párrafo.']);
  });

  it('serializeBlogBody es el inverso de parseBlogSections', () => {
    const doc = sampleDoc();
    const sections = parseBlogSections(doc.body);
    expect(parseBlogSections(serializeBlogBody(sections))).toEqual(sections);
  });

  it('rechaza un front matter inválido indicando el archivo', () => {
    expect(() =>
      validateFrontmatter('product', { kind: 'product', price: -1 }, 'archivo.md')
    ).toThrow(/archivo\.md/);
  });

  it('detiene el parseo si kind no coincide', () => {
    const raw = `---
kind: podcast
slug: x
---
body`;
    expect(() => parseContentString('blog', raw)).toThrow(/kind/);
  });
});

describe('serializer', () => {
  it('serializa y reparsea sin perder datos (round-trip)', () => {
    const doc = sampleDoc();
    const md = serializeContent(doc);
    const again = parseContentString('blog', md);
    expect(again.title).toBe(doc.title);
    expect(again.body).toBe(doc.body);
    expect(again.frontmatter).toEqual(doc.frontmatter);
  });

  it('detecta que un archivo equivalente no cambió', () => {
    const doc = sampleDoc();
    const md = serializeContent(doc);
    expect(contentChanged(md, doc)).toBe(false);
  });

  it('detecta cambios reales en el body o metadatos', () => {
    const doc = sampleDoc();
    const md = serializeContent(doc);
    const changed = { ...doc, body: `${doc.body}\n\n## Nueva sección\n\nTexto.` };
    expect(contentChanged(md, changed)).toBe(true);
    const metaChanged = {
      ...doc,
      title: 'Otro título',
      frontmatter: { ...doc.frontmatter, title: 'Otro título' },
    };
    expect(contentChanged(md, metaChanged)).toBe(true);
  });

  it('preserva el orden canónico del front matter en la salida', () => {
    const md = serializeContent(sampleDoc());
    const keys = md
      .split('\n---\n')[0]
      .replace('---\n', '')
      .split('\n')
      .map((l) => l.split(':')[0])
      .filter((k) => /^[a-zA-Z]+$/.test(k));
    expect(keys[0]).toBe('kind');
    expect(keys[1]).toBe('order');
    expect(keys[2]).toBe('slug');
  });
});

describe('adapters (round-trip viejo ↔ ContentDoc)', () => {
  it('blog: blogPostToDoc → docToBlogPost es identidad', () => {
    for (const post of blogPosts) {
      const doc = blogPostToDoc(post, 0);
      const back = docToBlogPost(parseContentString('blog', serializeContent(doc)));
      expect(back).toEqual(post);
    }
  });

  it('podcast: episodeToDoc → docToEpisode es identidad', () => {
    for (const ep of podcast.episodes) {
      const doc = episodeToDoc(ep, 0);
      const back = docToEpisode(parseContentString('podcast', serializeContent(doc)));
      expect(back).toEqual(ep);
    }
  });

  it('product: productToDoc → docToProduct es identidad (campos nuevos excluidos)', () => {
    const toLegacy = (product: Product) => {
      const {
        currency, priceArs, taxRate, sku, format, shortDescription, author,
        duration, banner, gallery, related, assets, productType, components,
        ...legacy
      } = product;
      void currency; void priceArs; void taxRate; void sku; void format;
      void shortDescription; void author; void duration; void banner;
      void gallery; void related; void assets;
      return legacy;
    };
    for (const p of products) {
      const doc = productToDoc(p, 0);
      const back = docToProduct(parseContentString('product', serializeContent(doc)));
      expect(toLegacy(back)).toEqual(p);
    }
  });
});
