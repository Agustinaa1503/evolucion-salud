/**
 * Dominio producto (SUBFASE 12.3).
 *
 * Tipos y configuración de presentación del catálogo de productos. El dominio
 * NO conoce el CMS, los pagos ni las licencias: solo define la forma de los
 * datos (los tipos viven en el motor de contenido) y etiquetas de presentación.
 *
 * Este módulo es seguro para client components (no lee filesystem).
 */
import type {
  Product,
  ProductAsset,
  ProductAssetType,
  ProductCurrency,
  ProductFormat,
  ProductLevel,
  ProductType,
} from '@/lib/content/types';

export type {
  Product,
  ProductAsset,
  ProductAssetType,
  ProductCurrency,
  ProductFormat,
  ProductLevel,
  ProductType,
};

/** Etiquetas legibles por formato (configuración de presentación). */
export const formatLabel: Record<ProductFormat, string> = {
  curso: 'Curso',
  ebook: 'Ebook',
  pdf: 'PDF',
  guia: 'Guía',
  checklist: 'Checklist',
  plantilla: 'Plantilla',
  audio: 'Audio',
  meditacion: 'Meditación',
  podcast: 'Podcast Premium',
  recurso: 'Recurso descargable',
  workshop: 'Workshop',
  'clase-en-vivo': 'Clase en vivo',
};

/** Etiquetas legibles por tipo de asset. */
export const assetTypeLabel: Record<ProductAssetType, string> = {
  pdf: 'PDF',
  audio: 'Audio',
  video: 'Video',
  zip: 'Archivo comprimido',
  plantilla: 'Plantilla',
  otro: 'Otro',
};

export const PRODUCT_FORMATS: ProductFormat[] = [
  'curso',
  'ebook',
  'pdf',
  'guia',
  'checklist',
  'plantilla',
  'audio',
  'meditacion',
  'podcast',
  'recurso',
  'workshop',
  'clase-en-vivo',
];
