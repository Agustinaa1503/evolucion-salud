/**
 * Tests SUBFASE 12.5 — Licencias y biblioteca digital.
 * Lógica pura: mapeo de items de orden → licencias, token de acceso, slug de
 * archivo y delimitación de entrada. La lógica contra Supabase (service_role)
 * se valida en `scripts/smoke-licenses.mjs`.
 */
import { describe, expect, it } from 'vitest';
import {
  createAccessToken,
  fileSlug,
  orderItemsToLicenses,
} from '@/lib/shop/licenses';

const resolver = (slug: string) => {
  const catalog: Record<string, { title: string; price: number }> = {
    'guia-basica': { title: 'Guía Básica', price: 19 },
    'guia-premium': { title: 'Guía Premium', price: 49 },
    'meditacion-gratis': { title: 'Meditación gratis', price: 0 },
  };
  return catalog[slug];
};

describe('orderItemsToLicenses', () => {
  it('resuelve los productos válidos de una orden', () => {
    const items = [
      { slug: 'guia-basica', qty: 2, price: 19 },
      { slug: 'guia-premium', qty: 1, price: 49 },
    ];
    const licences = orderItemsToLicenses(items, resolver);
    expect(licences).toHaveLength(2);
    expect(licences[0]).toMatchObject({ product_slug: 'guia-basica', product_title: 'Guía Básica' });
    expect(licences[1].product_slug).toBe('guia-premium');
  });

  it('ignora productos sin precio (no licenciables)', () => {
    const licences = orderItemsToLicenses(
      [{ slug: 'meditacion-gratis', qty: 1, price: 0 }],
      resolver
    );
    expect(licences).toHaveLength(0);
  });

  it('deduplica slugs repetidos dentro de la misma orden', () => {
    const items = [
      { slug: 'guia-basica', qty: 1, price: 19 },
      { slug: 'guia-basica', qty: 1, price: 19 },
      { slug: 'guia-premium', qty: 1, price: 49 },
    ];
    const licences = orderItemsToLicenses(items, resolver);
    expect(licences).toHaveLength(2);
    expect(licences[0].qty).toBe(1);
  });

  it('ignora slugs desconocidos o entradas malformadas', () => {
    const items = [
      { slug: '', qty: 1 },
      null,
      { qty: 1 },
      'texto',
      { slug: 'no-existe', qty: 1 },
    ];
    const licences = orderItemsToLicenses(items, resolver);
    expect(licences).toHaveLength(0);
  });

  it('devuelve vacío si los items no son un array', () => {
    expect(orderItemsToLicenses('nada', resolver)).toHaveLength(0);
    expect(orderItemsToLicenses(null, resolver)).toHaveLength(0);
    expect(orderItemsToLicenses(undefined, resolver)).toHaveLength(0);
  });

  it('usa el resolvedor por defecto (catálogo real) cuando no se pasa', () => {
    const licences = orderItemsToLicenses([{ slug: 'zzzz', qty: 1, price: 1 }]);
    expect(licences).toHaveLength(0);
  });
});

describe('createAccessToken', () => {
  it('genera tokens hex únicos de 32 caracteres', () => {
    const a = createAccessToken();
    const b = createAccessToken();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(a).not.toBe(b);
  });
});

describe('fileSlug', () => {
  it('deriva un slug estable del nombre de archivo', () => {
    expect(fileSlug('guia-basica.pdf')).toMatch(/^[0-9a-f]{16}$/);
    expect(fileSlug('guia-basica.pdf')).toBe(fileSlug('guia-basica.pdf'));
    expect(fileSlug('guia-basica.pdf')).not.toBe(fileSlug('otro.pdf'));
  });
});
