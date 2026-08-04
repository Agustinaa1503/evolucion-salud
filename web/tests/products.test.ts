/**
 * Tests SUBFASE 12.3.1 — Modelo extendido de productos:
 * schema zod, adaptadores (round-trip), pricing puro y catálogo client-safe.
 */
import { describe, expect, it } from 'vitest';
import { docToProduct, productToDoc } from '@/lib/content/adapters';
import { parseContentString } from '@/lib/content/parser';
import { serializeContent } from '@/lib/content/serializer';
import { validateFrontmatter } from '@/lib/content/schemas';
import type { Product } from '@/lib/content/types';
import {
  getProductBySlug,
  getPublicProducts,
  productsByFormat,
  productsByLevel,
  productsByProductType,
  relatedProducts,
} from '@/lib/products/catalog';
import {
  deriveSku,
  effectivePrice,
  isFree,
  priceInArs,
  priceLabel,
  priceUsd,
  priceWithTaxUsd,
  productCurrency,
  productSku,
  taxRatePct,
  usdToArsAmount,
} from '@/lib/products/pricing';
import { formatLabel } from '@/lib/products/types';

const sampleRaw = `---
kind: product
slug: guia-ejemplo
title: Guía Ejemplo
subtitle: Subtítulo de prueba
description: Una descripción.
price: 19
currency: ARS
priceArs: 5800
taxRate: 21
sku: EVS-GUIA-X
format: guia
shortDescription: Resumen corto.
author: Lic. Claudia Espinoza
duration: "60 min"
banner: https://images.example.com/banner.jpg
gallery:
  - https://images.example.com/g1.jpg
related:
  - guia-premium
assets:
  - slug: pdf-1
    title: Guía (PDF)
    fileName: guia.pdf
    mime: application/pdf
    sizeBytes: 2450000
    type: pdf
level: entrada
productType: simple
status: published
`;

describe('schema + adapters (campos nuevos)', () => {
  it('parsea y adapta un producto con todos los campos nuevos', () => {
    const doc = parseContentString('product', sampleRaw);
    const product = docToProduct(doc);
    expect(product.currency).toBe('ARS');
    expect(product.priceArs).toBe(5800);
    expect(product.taxRate).toBe(21);
    expect(product.sku).toBe('EVS-GUIA-X');
    expect(product.format).toBe('guia');
    expect(product.shortDescription).toBe('Resumen corto.');
    expect(product.author).toBe('Lic. Claudia Espinoza');
    expect(product.duration).toBe('60 min');
    expect(product.banner).toBe('https://images.example.com/banner.jpg');
    expect(product.gallery).toEqual(['https://images.example.com/g1.jpg']);
    expect(product.related).toEqual(['guia-premium']);
    expect(product.assets).toHaveLength(1);
    expect(product.assets?.[0]).toMatchObject({
      slug: 'pdf-1',
      title: 'Guía (PDF)',
      fileName: 'guia.pdf',
      mime: 'application/pdf',
      sizeBytes: 2450000,
      type: 'pdf',
      version: 1,
      sortOrder: 0,
    });
  });

  it('aplica defaults cuando el campo no está presente', () => {
    const doc = parseContentString(
      'product',
      `---
kind: product
slug: simple
title: Simple
subtitle: Sub
price: 10
level: entrada
status: published
`
    );
    const product = docToProduct(doc);
    expect(product.currency).toBe('USD');
    expect(product.taxRate).toBe(0);
    expect(product.sku).toBeUndefined();
    expect(product.format).toBeUndefined();
    expect(product.assets).toBeUndefined();
    expect(product.gallery).toEqual([]);
    expect(product.related).toEqual([]);
  });

  it('round-trip estable: serializar → parsear preserva el front matter', () => {
    const doc = parseContentString('product', sampleRaw);
    const md = serializeContent(doc);
    const again = parseContentString('product', md);
    expect(again.frontmatter).toEqual(doc.frontmatter);
    expect(docToProduct(again)).toEqual(docToProduct(doc));
  });

  it('el orden canónico del front matter incluye los campos nuevos', () => {
    const md = serializeContent(parseContentString('product', sampleRaw));
    const keys = md
      .split('\n---\n')[0]
      .replace('---\n', '')
      .split('\n')
      .map((l) => l.split(':')[0])
      .filter((k) => /^[a-zA-Z]+$/.test(k));
    expect(keys.indexOf('shortDescription')).toBeGreaterThan(keys.indexOf('description'));
    expect(keys.indexOf('price')).toBeGreaterThan(keys.indexOf('shortDescription'));
    expect(keys.indexOf('format')).toBeGreaterThan(keys.indexOf('interval'));
    expect(keys.indexOf('assets')).toBeGreaterThan(keys.indexOf('includes'));
  });

  it('rechaza format inválido, priceArs negativo y taxRate fuera de rango', () => {
    expect(() =>
      validateFrontmatter('product', { kind: 'product', price: 1, format: 'malo' }, 'a.md')
    ).toThrow(/format/);
    expect(() =>
      validateFrontmatter('product', { kind: 'product', price: 1, priceArs: -5 }, 'b.md')
    ).toThrow(/priceArs/);
    expect(() =>
      validateFrontmatter('product', { kind: 'product', price: 1, taxRate: 150 }, 'c.md')
    ).toThrow(/taxRate/);
  });

  it('productToDoc escribe los campos nuevos (round-trip con la migración)', () => {
    const withFields: Product = {
      slug: 'ejemplo',
      title: 'Ejemplo',
      subtitle: 'Sub',
      description: 'Desc',
      price: 19,
      currency: 'ARS',
      priceArs: 5800,
      taxRate: 21,
      sku: 'EVS-X',
      format: 'audio',
      shortDescription: 'Corto',
      author: 'Equipo',
      duration: '30 min',
      gallery: ['https://x/g.jpg'],
      related: ['otro'],
      assets: [
        { slug: 'a', title: 'Audio', fileName: 'a.mp3', mime: 'audio/mpeg', sizeBytes: 100, type: 'audio', version: 1, sortOrder: 0 },
      ],
      level: 'entrada',
      productType: 'simple',
      features: [],
      includes: [],
      icon: 'music',
      gradient: 'from-brand-500 to-leaf-600',
      image: 'https://x/i.jpg',
    };
    const doc = productToDoc(withFields, 0);
    const back = docToProduct(parseContentString('product', serializeContent(doc)));
    expect(back.currency).toBe('ARS');
    expect(back.priceArs).toBe(5800);
    expect(back.taxRate).toBe(21);
    expect(back.format).toBe('audio');
    expect(back.assets?.[0].type).toBe('audio');
    expect(back.related).toEqual(['otro']);
    expect(back.gallery).toEqual(['https://x/g.jpg']);
  });
});

describe('pricing (puro)', () => {
  const base: Product = {
    slug: 'p',
    title: 'P',
    subtitle: 'S',
    description: 'D',
    price: 100,
    level: 'entrada',
    productType: 'simple',
    features: [],
    includes: [],
    icon: 'x',
    gradient: 'g',
    image: 'i',
  };

  it('moneda, precio y gratis', () => {
    expect(productCurrency(base)).toBe('USD');
    expect(isFree(base)).toBe(false);
    expect(isFree({ ...base, price: 0 })).toBe(true);
    expect(priceUsd(base)).toBe(100);
  });

  it('impuestos en porcentaje', () => {
    expect(taxRatePct(base)).toBe(0);
    expect(taxRatePct({ ...base, taxRate: 21 })).toBe(21);
    expect(priceWithTaxUsd({ ...base, taxRate: 21 })).toBe(121);
    expect(priceWithTaxUsd(base)).toBe(100);
  });

  it('conversión y override de ARS', () => {
    expect(usdToArsAmount(100, 950)).toBe(95000);
    expect(usdToArsAmount(100, 0)).toBe(0);
    expect(priceInArs(base, 950)).toBe(95000);
    expect(priceInArs({ ...base, priceArs: 120000 }, 950)).toBe(120000);
  });

  it('effectivePrice: USD por defecto, ARS con tasa, ARS cae a USD sin datos', () => {
    expect(effectivePrice(base)).toEqual({ amount: 100, currency: 'USD' });
    expect(effectivePrice(base, { currency: 'ARS', arsRate: 950 })).toEqual({
      amount: 95000,
      currency: 'ARS',
    });
    // ARS pedido sin override ni tasa → cae a USD (evita "ARS 0")
    expect(effectivePrice(base, { currency: 'ARS' })).toEqual({
      amount: 100,
      currency: 'USD',
    });
    // Override de ARS en un producto USD se respeta en display ARS
    expect(effectivePrice({ ...base, priceArs: 500 }, { currency: 'ARS' })).toEqual({
      amount: 500,
      currency: 'ARS',
    });
  });

  it('sku derivado y definido', () => {
    expect(deriveSku('guia-basica-dia-despues-del-diagnostico')).toBe(
      'EVS-GUIA-BASICA-DIA-DESPUES-DEL-DIAGNOSTICO'
    );
    expect(productSku(base)).toBe('EVS-P');
    expect(productSku({ ...base, sku: 'SKU-CUSTOM' })).toBe('SKU-CUSTOM');
  });

  it('priceLabel en sus variantes', () => {
    expect(priceLabel(base)).toBe('USD 100.00');
    expect(priceLabel({ ...base, price: 0 })).toBe('Gratis');
    expect(priceLabel({ ...base, interval: 'monthly' })).toBe('USD 100.00 / mes');
    const ars = priceLabel({ ...base, currency: 'ARS', priceArs: 5800 });
    expect(ars).toContain('5.800');
    expect(priceLabel({ ...base, currency: 'ARS', priceArs: 5800, interval: 'monthly' })).toContain('/ mes');
  });

  it('formatLabel cubre los formatos soportados', () => {
    expect(formatLabel.guia).toBe('Guía');
    expect(formatLabel['clase-en-vivo']).toBe('Clase en vivo');
    expect(formatLabel.meditacion).toBe('Meditación');
  });
});

describe('catálogo (client-safe)', () => {
  it('expone los productos públicos y resuelve por slug', () => {
    expect(getPublicProducts().length).toBeGreaterThanOrEqual(8);
    expect(getProductBySlug('guia-basica-dia-despues-del-diagnostico')?.title).toContain('Guía Básica');
    expect(getProductBySlug('no-existe')).toBeUndefined();
  });

  it('filtra por formato, nivel y tipo comercial', () => {
    expect(productsByLevel('entrada').map((p) => p.slug)).toContain(
      'guia-basica-dia-despues-del-diagnostico'
    );
    expect(productsByProductType('bundle').map((p) => p.slug)).toContain('bundle-pine-completo');
    expect(productsByProductType('membership').map((p) => p.slug)).toContain(
      'membresia-biblioteca-pine'
    );
    // Sin `format` definido todavía en el catálogo, devuelve vacío (no falla)
    expect(productsByFormat('guia')).toEqual([]);
  });

  it('relatedProducts usa la curaduría y cae a afinidad sin repetir el producto', () => {
    const premium = getProductBySlug('guia-premium-completa');
    expect(premium).toBeDefined();
    if (premium) {
      const related = relatedProducts(premium);
      expect(related.every((p) => p.slug !== premium.slug)).toBe(true);
      expect(related.length).toBeGreaterThan(0);
    }
    // Sin `related` explícito, fallback por afinidad (mismo nivel/categoría)
    const basica = getProductBySlug('guia-basica-dia-despues-del-diagnostico');
    if (basica) {
      const related = relatedProducts(basica, 2);
      expect(related.length).toBeLessThanOrEqual(2);
      expect(related.every((p) => p.slug !== basica.slug)).toBe(true);
    }
  });
});
