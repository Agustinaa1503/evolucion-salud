/**
 * Generación del certificado PDF de Evolución Salud (FASE 5).
 *
 * Usa pdf-lib (puro JS, corre en el servidor de Next.js sin navegador) y
 * qrcode para dibujar el código QR con el enlace de verificación pública.
 *
 * El PDF se sube a Storage (bucket privado `certificates`) y se entrega al
 * alumno mediante una URL firmada.
 */

import { PDFDocument, PDFFont, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import type { CertificateSigner } from '@/lib/courses/types';

/** Colores de marca (ver AGENT.md). */
const BRAND = { r: 118 / 255, g: 45 / 255, b: 143 / 255 }; // #762d8f
const CLAY = { r: 216 / 255, g: 130 / 255, b: 66 / 255 }; // #d88242
const LEAF = { r: 56 / 255, g: 128 / 255, b: 90 / 255 }; // #38805a
const INK = { r: 30 / 255, g: 27 / 255, b: 38 / 255 }; // texto principal
const MUTED = { r: 105 / 255, g: 105 / 255, b: 115 / 255 }; // texto secundario

/** A4 apaisado en puntos. */
const PAGE_W = 841.89;
const PAGE_H = 595.28;

/** Firmas oficiales por defecto (equipo de Evolución Salud). */
export const DEFAULT_SIGNERS: CertificateSigner[] = [
  { name: 'Lic. Claudia Espinoza', title: 'Licenciada en Psicología', license: 'Mat. CPA 001' },
  { name: 'Lic. Carina Lescano', title: 'Licenciada en Psicología', license: 'Mat. CPA 002' },
  { name: 'Lic. Orietta Sferco', title: 'Licenciada en Psicología', license: 'Mat. CPA 003' },
];

export type CertificateData = {
  /** Nombre completo del alumno tal como figura en el PDF. */
  fullName: string;
  /** Título del curso completado. */
  courseTitle: string;
  /** Número del certificado (ES-YYYY-NNNNN). */
  certificateNumber: string;
  /** Fecha de emisión en ISO 8601. */
  issuedAt: string;
  /** URL pública de verificación (/verificar/<id>). */
  verificationUrl: string;
  /** Firmas profesionales del certificado (si no se provee, usa DEFAULT_SIGNERS). */
  signers?: CertificateSigner[];
};

const rgbOf = (c: { r: number; g: number; b: number }) => rgb(c.r, c.g, c.b);

/** Formatea la fecha de emisión en español legible (por defecto es-AR). */
export function formatCertificateDate(iso: string, locale = 'es-AR'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function centerText(
  page: Awaited<ReturnType<PDFDocument['addPage']>>,
  font: PDFFont,
  size: number,
  text: string,
  y: number,
  color = rgbOf(INK)
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (PAGE_W - width) / 2, y, size, font, color });
}

/** Dibuja una franja decorativa de la marca. */
function drawAccentBar(page: Awaited<ReturnType<PDFDocument['addPage']>>, y: number) {
  page.drawRectangle({ x: 44, y, width: PAGE_W - 88, height: 6, color: rgbOf(CLAY) });
  page.drawRectangle({ x: 44, y: y - 8, width: PAGE_W - 88, height: 2, color: rgbOf(BRAND) });
}

/**
 * Dibuja las firmas profesionales en el pie del certificado.
 * Distribuye las columnas uniformemente en el área disponible a la izquierda del QR.
 */
function drawSigners(
  page: Awaited<ReturnType<PDFDocument['addPage']>>,
  font: PDFFont,
  fontBold: PDFFont,
  signers: CertificateSigner[],
  baseY: number,
) {
  const startX = 60;
  const endX = PAGE_W - 56 - 128 - 30;
  const areaWidth = endX - startX;
  const n = signers.length;
  const colWidth = areaWidth / n;
  const lineHalf = Math.min(90, colWidth * 0.42);

  for (let i = 0; i < n; i++) {
    const cx = startX + colWidth * i + colWidth / 2;
    const signer = signers[i];

    // Línea de firma
    page.drawRectangle({
      x: cx - lineHalf,
      y: baseY,
      width: lineHalf * 2,
      height: 0.75,
      color: rgbOf(MUTED),
    });

    // Nombre (negrita)
    const nameSize = n > 2 ? 9 : 11;
    const nameWidth = fontBold.widthOfTextAtSize(signer.name, nameSize);
    page.drawText(signer.name, {
      x: cx - nameWidth / 2,
      y: baseY - 16,
      size: nameSize,
      font: fontBold,
      color: rgbOf(INK),
    });

    let lineY = baseY - 30;

    // Título / Especialidad
    if (signer.title) {
      const titleSize = n > 2 ? 7.5 : 8.5;
      const titleWidth = font.widthOfTextAtSize(signer.title, titleSize);
      page.drawText(signer.title, {
        x: cx - titleWidth / 2,
        y: lineY,
        size: titleSize,
        font,
        color: rgbOf(MUTED),
      });
      lineY -= 13;
    }

    // Matrícula
    if (signer.license) {
      const licSize = n > 2 ? 7.5 : 8.5;
      const licWidth = font.widthOfTextAtSize(signer.license, licSize);
      page.drawText(signer.license, {
        x: cx - licWidth / 2,
        y: lineY,
        size: licSize,
        font,
        color: rgbOf(MUTED),
      });
    }
  }
}

/**
 * Construye el PDF del certificado y devuelve sus bytes.
 * Lanza un error si algo falla (el llamador decide cómo manejarlo).
 */
export async function buildCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontLight = await doc.embedFont(StandardFonts.Helvetica);

  // Fondo blanco y doble marco de marca.
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: rgb(1, 1, 1) });
  page.drawRectangle({
    x: 20,
    y: 20,
    width: PAGE_W - 40,
    height: PAGE_H - 40,
    borderColor: rgbOf(BRAND),
    borderWidth: 3,
  });
  page.drawRectangle({
    x: 28,
    y: 28,
    width: PAGE_W - 56,
    height: PAGE_H - 56,
    borderColor: rgbOf(CLAY),
    borderWidth: 1,
  });

  // QR de verificación (esquina inferior derecha, dentro del marco).
  const qrPng = await QRCode.toBuffer(data.verificationUrl, {
    type: 'png',
    width: 240,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#762d8f', light: '#ffffff' },
  });
  const qrImage = await doc.embedPng(qrPng);
  const qrSize = 128;
  page.drawImage(qrImage, {
    x: PAGE_W - 56 - qrSize,
    y: 64,
    width: qrSize,
    height: qrSize,
  });
  // texto debajo del QR
  page.drawText('Verifique este certificado', {
    x: PAGE_W - 56 - qrSize + 2,
    y: 52,
    size: 7,
    font,
    color: rgbOf(MUTED),
  });

  // Franja decorativa superior.
  drawAccentBar(page, PAGE_H - 96);

  // Título de la institución.
  centerText(page, fontBold, 34, 'Evolución Salud', PAGE_H - 150, rgbOf(BRAND));
  centerText(page, font, 12, 'PsicoInmunoNeuroEndocrinología · Córdoba, Argentina', PAGE_H - 170, rgbOf(MUTED));

  // Tipo de documento.
  centerText(page, fontBold, 24, 'CERTIFICADO', PAGE_H - 216, rgbOf(INK));

  // Cuerpo.
  centerText(page, font, 15, 'Se certifica que', PAGE_H - 258, rgbOf(MUTED));

  const name = data.fullName || 'Participante';
  centerText(page, fontBold, 30, name, PAGE_H - 296, rgbOf(BRAND));

  centerText(page, font, 15, 'ha completado satisfactoriamente el curso', PAGE_H - 326, rgbOf(MUTED));

  centerText(page, fontBold, 22, data.courseTitle, PAGE_H - 356, rgbOf(INK));

  // Línea de detalle.
  const detail = `Emitido el ${formatCertificateDate(data.issuedAt)} · Certificado N.° ${data.certificateNumber}`;
  centerText(page, font, 11, detail, PAGE_H - 384, rgbOf(MUTED));

  // Firmas profesionales (columnas dinámicas).
  const signers = data.signers && data.signers.length > 0 ? data.signers : DEFAULT_SIGNERS;
  drawSigners(page, font, fontBold, signers, PAGE_H - 430);

  // Disclaimer psicoeducativo (mínimo, abajo a la izquierda).
  page.drawText(
    'Material psicoeducativo. No reemplaza la atención médica ni psicológica profesional.',
    { x: 48, y: 44, size: 7.5, font: fontLight, color: rgbOf(MUTED) }
  );

  const bytes = await doc.save();
  return bytes;
}
