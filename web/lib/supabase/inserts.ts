import { getSupabaseClient } from './client';
import type { Json } from './types';
import { saveDemoRecord, randomCode } from '@/lib/demo-store';

/**
 * Capa de persistencia de los formularios públicos.
 *
 * Cuando hay credenciales de Supabase configuradas escribe en la base real;
 * si no, cae en el modo demo (localStorage) para que la web nunca se rompa.
 * El rol anon SOLO puede insertar (RLS), de modo que estas funciones son
 * seguras para ejecutarse en el navegador.
 */

export type SaveResult = {
  ok: boolean;
  demo: boolean;
  error?: string;
};

export type QuestionnaireSaveInput = {
  participantType: string;
  answers: Record<string, number | string>;
  percepcionAvg: number;
  corporalAvg: number;
  ambiomaScore: number;
};

const PARTICIPANT_SLUGS: Record<string, string> = {
  'Paciente programado/a para cirugía': 'paciente',
  'Referente familiar o cuidador/a principal': 'familiar',
  'Profesional de la salud': 'profesional',
};

export function participantSlug(label: string): string {
  return PARTICIPANT_SLUGS[label] ?? label.toLowerCase().replace(/[^a-z]+/g, '-');
}

export async function saveNewsletter(
  email: string,
  name?: string,
  source = 'web-newsletter'
): Promise<SaveResult> {
  const sb = getSupabaseClient();
  if (!sb) {
    saveDemoRecord('newsletter', { email, name, source });
    return { ok: true, demo: true };
  }
  const { error } = await sb
    .from('newsletter_subscribers')
    .insert({ email, name: name ?? null, source });
  if (error) {
    // Email ya suscrito (código 23505) no es un error para el usuario.
    if (error.code === '23505') return { ok: true, demo: false };
    return { ok: false, demo: false, error: error.message };
  }
  return { ok: true, demo: false };
}

export async function saveLeadMagnet(
  email: string,
  name: string,
  slug: string
): Promise<SaveResult & { accessCode?: string }> {
  const accessCode = randomCode('PINE');
  const sb = getSupabaseClient();
  if (!sb) {
    saveDemoRecord('lead', { name, email, leadMagnet: slug, accessCode });
    return { ok: true, demo: true, accessCode };
  }
  const { error } = await sb
    .from('lead_magnet_downloads')
    .insert({ email, name: name || null, lead_magnet_slug: slug, access_code: accessCode });
  if (error) return { ok: false, demo: false, error: error.message, accessCode };
  return { ok: true, demo: false, accessCode };
}

export async function saveQuestionnaire(
  input: QuestionnaireSaveInput
): Promise<SaveResult & { accessCode?: string }> {
  const accessCode = randomCode('PINE');
  const sb = getSupabaseClient();
  if (!sb) {
    saveDemoRecord('questionnaire', { ...input, accessCode });
    return { ok: true, demo: true, accessCode };
  }
  const { error } = await sb.from('questionnaire_responses').insert({
    email: null,
    participant_type: input.participantType,
    answers: input.answers,
    percepcion_avg: input.percepcionAvg,
    corporal_avg: input.corporalAvg,
    ambioma_score: input.ambiomaScore,
    access_code: accessCode,
  });
  if (error) return { ok: false, demo: false, error: error.message, accessCode };
  return { ok: true, demo: false, accessCode };
}

export async function saveContactMessage(input: {
  name: string;
  email: string;
  topic: string;
  message: string;
}): Promise<SaveResult> {
  const sb = getSupabaseClient();
  if (!sb) {
    saveDemoRecord('contact', input);
    return { ok: true, demo: true };
  }
  const { error } = await sb.from('contact_messages').insert({
    name: input.name,
    email: input.email,
    topic: input.topic,
    message: input.message,
  });
  if (error) return { ok: false, demo: false, error: error.message };
  return { ok: true, demo: false };
}

export async function saveCourseQuiz(
  courseSlug: string,
  answers: Record<string, string | string[] | number | null>
): Promise<SaveResult> {
  const sb = getSupabaseClient();
  if (!sb) {
    saveDemoRecord('curso_respuesta', { courseSlug, answers });
    return { ok: true, demo: true };
  }
  const { error } = await sb.from('curso_respuestas').insert({
    course_slug: courseSlug,
    answers: answers as Json,
    source: 'web',
  });
  if (error) return { ok: false, demo: false, error: error.message };
  return { ok: true, demo: false };
}

export async function saveOrder(input: {
  email: string;
  customerName: string;
  items: { slug: string; qty: number; price: number }[];
  subtotal: number;
  paymentMethod: 'mercadopago' | 'hotmart' | 'card' | 'demo';
}): Promise<SaveResult> {
  const sb = getSupabaseClient();
  if (!sb) {
    saveDemoRecord('order', { ...input, orderId: `ES-${Date.now().toString(36).toUpperCase()}` });
    return { ok: true, demo: true };
  }
  const { error } = await sb.from('orders').insert({
    email: input.email,
    customer_name: input.customerName,
    items: input.items,
    subtotal: input.subtotal,
    payment_method: input.paymentMethod,
    status: 'pending',
  });
  if (error) return { ok: false, demo: false, error: error.message };
  return { ok: true, demo: false };
}
