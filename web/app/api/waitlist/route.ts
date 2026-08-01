import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import {
  validateWaitlistInput,
  type WaitlistInput,
} from '@/lib/waitlist/validation';
import {
  sendWaitlistConfirmation,
  sendWaitlistAdminNotification,
} from '@/lib/email';
import { getCourse } from '@/lib/courses/registry';

/**
 * Lista de espera de cursos (FASE 7).
 *
 * Persiste la inscripción en `course_waitlist` (dedupe por email+curso),
 * la suma de paso a la newsletter (embudo de captación) y dispara los
 * emails de confirmación y de aviso al equipo (si Resend está configurado).
 * Corre con service_role en el servidor; nunca expone la lista.
 */
export async function POST(request: Request) {
  let body: WaitlistInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
  }

  const validation = validateWaitlistInput(body);
  if (!validation.ok || !validation.email || !validation.courseSlug) {
    return NextResponse.json(
      { error: validation.error ?? 'Datos inválidos' },
      { status: 400 }
    );
  }

  const sb = getServerSupabaseClient();
  if (!sb) {
    // Sin credenciales de Supabase: modo demo, no rompe la web.
    return NextResponse.json({ ok: true, demo: true });
  }

  const email = validation.email;
  const name = validation.name;
  const courseSlug = validation.courseSlug;
  const course = getCourse(courseSlug);
  const courseTitle = course?.title ?? courseSlug;

  const { error } = await sb.from('course_waitlist').insert({
    email,
    name: name ?? null,
    course_slug: courseSlug,
    source: 'web',
  });

  if (error && error.code !== '23505') {
    return NextResponse.json(
      { error: 'No se pudo registrar la inscripción' },
      { status: 500 }
    );
  }

  // Embudo: la persona también entra a la newsletter (dedupe por email).
  const { error: nlError } = await sb.from('newsletter_subscribers').insert({
    email,
    name: name ?? null,
    source: `waitlist:${courseSlug}`,
  });
  if (nlError && nlError.code !== '23505') {
    // No es fatal para el usuario; solo se pierde la doble captura.
    console.warn('[waitlist] newsletter insert falló:', nlError.message);
  }

  // Emails (no-op si no hay RESEND_API_KEY; nunca rompen la respuesta).
  if (course) {
    const [confirm, admin] = await Promise.all([
      sendWaitlistConfirmation({ email, name, courseTitle }),
      sendWaitlistAdminNotification({ email, name, courseTitle, courseSlug }),
    ]);
    if (!confirm.sent && !confirm.skipped) {
      console.warn('[waitlist] email de confirmación:', confirm.error);
    }
    if (!admin.sent && !admin.skipped) {
      console.warn('[waitlist] aviso al equipo:', admin.error);
    }
  }

  return NextResponse.json({ ok: true, demo: false, already: Boolean(error) });
}
