/**
 * Tests SUBFASE 12.3.2 — Assets privados: lógica pura de metadatos
 * (ruta en Storage, validación de subida, estado de upload, versionado y
 * fusión MD + BD).
 */
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_ASSET_MIMES,
  MAX_ASSET_BYTES,
  applyUploadMetadata,
  assetStoragePath,
  guessAssetTypeFromMime,
  isAssetUploaded,
  mergeAssetWithDb,
  nextAssetVersion,
  validateAssetUpload,
} from '@/lib/products/asset-meta';
import type { ProductAsset } from '@/lib/content/types';

const sampleAsset: ProductAsset = {
  slug: 'guia-basica-pdf',
  title: 'Guía Básica (PDF)',
  fileName: 'guia-basica.pdf',
  mime: 'application/pdf',
  sizeBytes: 2450000,
  type: 'pdf',
  version: 1,
  sortOrder: 1,
};

describe('ruta y estado en Storage', () => {
  it('arma la ruta producto/asset sin prefijo de bucket', () => {
    expect(assetStoragePath('guia-basica', 'guia-basica-pdf')).toBe(
      'guia-basica/guia-basica-pdf'
    );
  });

  it('distingue subido / pendiente por uploaded_at', () => {
    expect(isAssetUploaded(null)).toBe(false);
    expect(isAssetUploaded(undefined as never)).toBe(false);
    expect(isAssetUploaded('2026-08-04T00:00:00Z')).toBe(true);
  });

  it('incrementa la versión de forma segura', () => {
    expect(nextAssetVersion(1)).toBe(2);
    expect(nextAssetVersion(5)).toBe(6);
    expect(nextAssetVersion(Number.NaN)).toBe(2);
  });
});

describe('validación de subida', () => {
  it('rechaza sin nombre, archivo vacío o tamaño excesivo', () => {
    expect(validateAssetUpload({ fileName: '', sizeBytes: 10, mime: 'application/pdf' }).ok).toBe(false);
    expect(validateAssetUpload({ fileName: 'x.pdf', sizeBytes: 0, mime: 'application/pdf' }).ok).toBe(false);
    expect(validateAssetUpload({ fileName: 'x.pdf', sizeBytes: MAX_ASSET_BYTES + 1, mime: 'application/pdf' }).ok).toBe(false);
  });

  it('rechaza MIME no permitido', () => {
    const res = validateAssetUpload({
      fileName: 'malware.exe',
      sizeBytes: 100,
      mime: 'application/x-msdownload',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain('no está permitido');
  });

  it('acepta PDF, audio y ZIP y sugiere el tipo', () => {
    const pdf = validateAssetUpload({ fileName: 'a.pdf', sizeBytes: 100, mime: 'application/pdf' });
    expect(pdf.ok).toBe(true);
    if (pdf.ok) expect(pdf.type).toBe('pdf');

    const audio = validateAssetUpload({ fileName: 'a.mp3', sizeBytes: 100, mime: 'audio/mpeg' });
    expect(audio.ok).toBe(true);
    if (audio.ok) expect(audio.type).toBe('audio');

    const zip = validateAssetUpload({ fileName: 'a.zip', sizeBytes: 100, mime: 'application/zip' });
    expect(zip.ok).toBe(true);
    if (zip.ok) expect(zip.type).toBe('zip');
  });

  it('el tipo declarado tiene prioridad sobre el sugerido', () => {
    const res = validateAssetUpload({ fileName: 'a.mp3', sizeBytes: 100, mime: 'audio/mpeg', type: 'otro' });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.type).toBe('otro');
  });

  it('permite los MIME del bucket (migración 00015)', () => {
    expect(ALLOWED_ASSET_MIMES).toContain('application/pdf');
    expect(ALLOWED_ASSET_MIMES).toContain('audio/mpeg');
    expect(ALLOWED_ASSET_MIMES).toContain('application/zip');
    expect(ALLOWED_ASSET_MIMES).not.toContain('text/html');
  });

  it('sugiere tipo desde el MIME', () => {
    expect(guessAssetTypeFromMime('application/pdf')).toBe('pdf');
    expect(guessAssetTypeFromMime('audio/mpeg')).toBe('audio');
    expect(guessAssetTypeFromMime('video/mp4')).toBe('video');
    expect(guessAssetTypeFromMime('application/zip')).toBe('zip');
    expect(guessAssetTypeFromMime('application/octet-stream')).toBe('otro');
  });
});

describe('aplicación de metadatos del archivo subido', () => {
  it('sobrescribe nombre/MIME/tamaño/tipo conservando slug y orden', () => {
    const updated = applyUploadMetadata(sampleAsset, {
      fileName: 'guia-final.pdf',
      mime: 'application/pdf',
      sizeBytes: 3100000,
      type: 'pdf',
    });
    expect(updated.slug).toBe('guia-basica-pdf');
    expect(updated.sortOrder).toBe(1);
    expect(updated.fileName).toBe('guia-final.pdf');
    expect(updated.sizeBytes).toBe(3100000);
  });
});

describe('fusión Markdown + BD (estado del uploader)', () => {
  it('sin fila en la BD queda pendiente con versión del Markdown', () => {
    const state = mergeAssetWithDb(sampleAsset, null);
    expect(state.uploaded).toBe(false);
    expect(state.storagePath).toBeNull();
    expect(state.version).toBe(1);
    expect(state.assetSlug).toBe('guia-basica-pdf');
    expect(state.title).toBe('Guía Básica (PDF)');
  });

  it('con fila en la BD refleja uploaded/storage_path/versión', () => {
    const state = mergeAssetWithDb(sampleAsset, {
      uploaded_at: '2026-08-04T00:00:00Z',
      storage_path: 'guia-basica/guia-basica-pdf',
      version: 3,
    });
    expect(state.uploaded).toBe(true);
    expect(state.storagePath).toBe('guia-basica/guia-basica-pdf');
    expect(state.version).toBe(3);
  });

  it('el Markdown manda en el nombre aunque la BD tenga otro archivo', () => {
    const state = mergeAssetWithDb(sampleAsset, {
      uploaded_at: '2026-08-04T00:00:00Z',
      storage_path: 'guia-basica/guia-basica-pdf',
      version: 2,
    });
    expect(state.fileName).toBe('guia-basica.pdf');
  });
});
