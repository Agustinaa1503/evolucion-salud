import { describe, expect, it } from 'vitest';
import { buildCertificatePdf, formatCertificateDate, DEFAULT_SIGNERS } from '@/lib/certificates/pdf';
import type { CertificateSigner } from '@/lib/courses/types';

const baseData = {
  fullName: 'María del Rosario López',
  courseTitle: 'PINE en 15 minutos',
  certificateNumber: 'ES-2026-00001',
  issuedAt: '2026-08-01T12:00:00.000Z',
  verificationUrl: 'https://evolucionsalud.com/verificar/abc-123',
};

const customSigners: CertificateSigner[] = [
  { name: 'Dr. Juan Pérez', title: 'Director Académico', license: 'Mat. MP 12345' },
];

const multipleSigners: CertificateSigner[] = [
  { name: 'Lic. Ana García', title: 'Psicóloga Clínica', license: 'Mat. CPA 100' },
  { name: 'Lic. Carlos Ruiz', title: 'Médico Clínico', license: 'Mat. MP 200' },
];

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

describe('DEFAULT_SIGNERS', () => {
  it('contiene 3 firmantes oficiales del equipo', () => {
    expect(DEFAULT_SIGNERS).toHaveLength(3);
    expect(DEFAULT_SIGNERS[0].name).toContain('Espinoza');
    expect(DEFAULT_SIGNERS[1].name).toContain('Lescano');
    expect(DEFAULT_SIGNERS[2].name).toContain('Sferco');
  });

  it('cada firmante tiene nombre, título y matrícula', () => {
    for (const s of DEFAULT_SIGNERS) {
      expect(s.name).toBeTruthy();
      expect(s.title).toBeTruthy();
      expect(s.license).toBeTruthy();
    }
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

  it('genera PDF válido con signers personalizados (1 firmante)', async () => {
    const bytes = await buildCertificatePdf({ ...baseData, signers: customSigners });
    const header = Buffer.from(bytes.slice(0, 5)).toString('ascii');
    expect(header).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(2000);
  });

  it('genera PDF válido con múltiples signers (2 firmantes)', async () => {
    const bytes = await buildCertificatePdf({ ...baseData, signers: multipleSigners });
    const header = Buffer.from(bytes.slice(0, 5)).toString('ascii');
    expect(header).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(2000);
  });

  it('usa DEFAULT_SIGNERS cuando no se provee signers', async () => {
    const defaultBytes = await buildCertificatePdf(baseData);
    const explicitDefaultBytes = await buildCertificatePdf({ ...baseData, signers: DEFAULT_SIGNERS });
    expect(Buffer.compare(Buffer.from(defaultBytes), Buffer.from(explicitDefaultBytes))).toBe(0);
  });

  it('genera PDF distinto con signers personalizados vs por defecto', async () => {
    const defaultBytes = await buildCertificatePdf(baseData);
    const customBytes = await buildCertificatePdf({ ...baseData, signers: customSigners });
    expect(Buffer.compare(Buffer.from(defaultBytes), Buffer.from(customBytes))).not.toBe(0);
  });

  it('genera PDF distinto con 1 signer vs 3 signers', async () => {
    const singleBytes = await buildCertificatePdf({ ...baseData, signers: customSigners });
    const multiBytes = await buildCertificatePdf({ ...baseData, signers: multipleSigners });
    expect(Buffer.compare(Buffer.from(singleBytes), Buffer.from(multiBytes))).not.toBe(0);
  });
});
