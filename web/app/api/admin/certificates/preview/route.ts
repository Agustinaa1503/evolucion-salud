import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/session';
import { canAccessAdmin, hasPermission } from '@/lib/admin/rbac';
import { buildCertificatePdf } from '@/lib/certificates/pdf';
import { getCourse } from '@/lib/courses/registry';

/**
 * Genera un PDF de vista previa del certificado sin guardarlo en BD
 * ni emitir numeración oficial. Datos de alumno simulados + signers reales.
 */
export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session.user || !canAccessAdmin(session.profile?.rol) || session.profile?.estado !== 'activo') {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!hasPermission(session.profile?.rol, 'admin.certificates.read')) {
    return NextResponse.json({ error: 'Sin permiso.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  let courseTitle = 'Curso de ejemplo';
  let signers = undefined;

  if (slug) {
    const course = getCourse(slug);
    if (course) {
      courseTitle = course.title;
      signers = course.certificateConfig?.signers;
    }
  }

  const pdfBytes = await buildCertificatePdf({
    fullName: 'Alumno de Demostración',
    courseTitle,
    certificateNumber: 'ES-2026-DEMO-00000',
    issuedAt: new Date().toISOString(),
    verificationUrl: 'https://evolucionsalud.com/verificar/demo-preview',
    signers,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="vista-previa-certificado.pdf"',
      'Cache-Control': 'no-store',
    },
  });
}
