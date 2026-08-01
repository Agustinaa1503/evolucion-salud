/**
 * Capa de envío de emails (FASE 7).
 *
 * Usa Resend (https://resend.com) a través de su API REST con `fetch`,
 * sin dependencias nuevas. Si `RESEND_API_KEY` no está configurada, las
 * funciones son no-op (no tiran error) para que la web funcione en local
 * y en demo. La infraestructura completa de email es la FASE 13; acá se
 * usan los emails de la lista de espera como primer consumidor.
 *
 * Variables de entorno:
 *   RESEND_API_KEY      — clave de la API de Resend (si falta, no se envía nada)
 *   EMAIL_FROM          — remitente, por defecto "Evolución Salud <no-reply@evolucionsalud.com>"
 *   WAITLIST_NOTIFY_TO  — destino del aviso al equipo, por defecto profesionales@evolucionsalud.com
 */

const RESEND_URL = 'https://api.resend.com/emails';

export const isEmailConfigured = Boolean(process.env.RESEND_API_KEY);

const fromAddress =
  process.env.EMAIL_FROM ?? 'Evolución Salud <no-reply@evolucionsalud.com>';
const adminTo =
  process.env.WAITLIST_NOTIFY_TO ?? 'profesionales@evolucionsalud.com';

export type EmailResult = {
  sent: boolean;
  skipped?: boolean;
  error?: string;
};

type ResendPayload = {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

async function sendEmail(payload: ResendPayload): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, skipped: true };

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { sent: false, error: `Resend ${res.status}: ${detail}` };
    }
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : 'Error al enviar el email',
    };
  }
}

function wrapHtml(title: string, bodyHtml: string): string {
  return `
  <div style="font-family:Manrope,Arial,sans-serif;color:#1e293b;max-width:560px;margin:0 auto;">
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${bodyHtml}</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 12px;" />
    <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;">
      Material psicoeducativo de Evolución Salud. No reemplaza la atención
      médica. <a href="https://evolucionsalud.com" style="color:#762d8f;">evolucionsalud.com</a>
    </p>
  </div>`;
}

/** Confirma a la persona que se anotó en la lista de espera de un curso. */
export async function sendWaitlistConfirmation(input: {
  email: string;
  name?: string;
  courseTitle: string;
}): Promise<EmailResult> {
  const greeting = input.name ? `Hola ${input.name}:` : 'Hola:';
  return sendEmail({
    from: fromAddress,
    to: input.email,
    subject: 'Estás en la lista de espera de ' + input.courseTitle,
    html: wrapHtml(
      input.courseTitle,
      `${greeting}<br/><br/>Quedaste anotado/a en la lista de espera de <strong>${input.courseTitle}</strong>. Te avisaremos apenas esté disponible, junto con novedades del lanzamiento.<br/><br/>Mientras tanto, podés seguir explorando el contenido gratuito de Evolución Salud.`
    ),
    text: `Estás en la lista de espera de ${input.courseTitle}. Te avisaremos apenas esté disponible.`,
  });
}

/** Avisa al equipo que alguien se anotó en una lista de espera. */
export async function sendWaitlistAdminNotification(input: {
  email: string;
  name?: string;
  courseTitle: string;
  courseSlug: string;
}): Promise<EmailResult> {
  return sendEmail({
    from: fromAddress,
    to: adminTo,
    subject: 'Nueva inscripción en lista de espera',
    html: wrapHtml(
      input.courseTitle,
      `Se anotó una persona en la lista de espera de <strong>${input.courseTitle}</strong>.<br/><br/>Email: <strong>${input.email}</strong><br/>Nombre: ${input.name ?? '—'}<br/>Curso: ${input.courseTitle} (<code>${input.courseSlug}</code>)`
    ),
    text: `Nueva inscripción en lista de espera: ${input.email} → ${input.courseTitle} (${input.courseSlug})`,
  });
}
