import { describe, expect, it } from 'vitest';
import { buildCertificatePdf, formatCertificateDate } from '@/lib/certificates/pdf';

const baseData = {
  fullName: 'María del Rosario López',
  courseTitle: 'PINE en 15 minutos',
  certificateNumber: 'ES-2026-00001',
  issuedAt: '2026-08-01T12:00:00.000Z',
  verificationUrl: 'https://evolucionsalud.com/verificar/abc-123',
};

describe('formatCertificateDate', () => {
  it('formatea una fecha ISO en español legible', () => {
    const out = formatCertificateDate(baseData.issuedAt);
    expect(out).toContain('2026');
    expect(out).toMatch(/\d{2}/);
    expect(out.length).toBeGreaterThan(4);
  });

  it('devuelve cadena vacía para fechas inválidas', () => {
    expect(formatCertificateDate('fecha-invalida')).toBe('');
  });
});

describe('buildCertificatePdf', () => {
  it('genera un PDF válido (cabecera %PDF-) con tamaño razonable', async () => {
    const bytes = await buildCertificatePdf(baseData);
    const header = Buffer.from(bytes.slice(0, 5)).toString('ascii');
    expect(header).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(2000);
  });

  it('genera el mismo resultado para datos distintos (contenido incluido)', async () => {
    const a = await buildCertificatePdf(baseData);
    const b = await buildCertificatePdf({
      ...baseData,
      fullName: 'Juan Carlos Pérez',
      courseTitle: 'Introducción a la PINE',
    });
    expect(Buffer.compare(Buffer.from(a), Buffer.from(b))).not.toBe(0);
  });

  it('no falla con nombre vacío (usa el valor por defecto)', async () => {
    const bytes = await buildCertificatePdf({ ...baseData, fullName: '' });
    expect(Buffer.from(bytes.slice(0, 5)).toString('ascii')).toBe('%PDF-');
  });
});
