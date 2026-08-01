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

/** Colores de marca (ver AGENT.md). */
const BRAND = { r: 118 / 255, g: 45 / 255, b: 143 / 255 }; // #762d8f
const CLAY = { r: 216 / 255, g: 130 / 255, b: 66 / 255 }; // #d88242
const LEAF = { r: 56 / 255, g: 128 / 255, b: 90 / 255 }; // #38805a
const INK = { r: 30 / 255, g: 27 / 255, b: 38 / 255 }; // texto principal
const MUTED = { r: 105 / 255, g: 105 / 255, b: 115 / 255 }; // texto secundario

/** A4 apaisado en puntos. */
const PAGE_W = 841.89;
const PAGE_H = 595.28;

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
  centerText(page, fontBold, 24, 'CERTIFICADO DE PARTICIPACIÓN', PAGE_H - 216, rgbOf(INK));

  // Cuerpo.
  centerText(page, font, 15, 'Se certifica que', PAGE_H - 258, rgbOf(MUTED));

  const name = data.fullName || 'Participante';
  centerText(page, fontBold, 30, name, PAGE_H - 296, rgbOf(BRAND));

  centerText(page, font, 15, 'ha completado satisfactoriamente el curso', PAGE_H - 326, rgbOf(MUTED));

  centerText(page, fontBold, 22, data.courseTitle, PAGE_H - 356, rgbOf(INK));

  // Línea de detalle.
  const detail = `Emitido el ${formatCertificateDate(data.issuedAt)} · Certificado N.° ${data.certificateNumber}`;
  centerText(page, font, 11, detail, PAGE_H - 384, rgbOf(MUTED));

  // Firma (equipo docente).
  page.drawRectangle({
    x: PAGE_W / 2 - 110,
    y: PAGE_H - 450,
    width: 220,
    height: 0.75,
    color: rgbOf(MUTED),
  });
  centerText(page, font, 11, 'Equipo Evolución Salud', PAGE_H - 468, rgbOf(INK));
  centerText(page, font, 9, 'Lic. Claudia Espinoza · Lic. Carina Lescano · Lic. Orietta Sferco', PAGE_H - 484, rgbOf(MUTED));

  // Disclaimer psicoeducativo (mínimo, abajo a la izquierda).
  page.drawText(
    'Material psicoeducativo. No reemplaza la atención médica ni psicológica profesional.',
    { x: 48, y: 44, size: 7.5, font: fontLight, color: rgbOf(MUTED) }
  );

  const bytes = await doc.save();
  return bytes;
}
