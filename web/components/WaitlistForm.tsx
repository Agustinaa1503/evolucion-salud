'use client';

import { useState } from 'react';
import { BellRing, Check, Mail, User } from 'lucide-react';
import { validateWaitlistInput } from '@/lib/waitlist/validation';

type Status = { state: 'idle' | 'loading' | 'done' | 'error'; message?: string };

/**
 * Formulario de lista de espera de un curso (FASE 7).
 * Persiste en `course_waitlist` vía `/api/waitlist`, dedupe por email+curso,
 * y además incorpora a la persona a la newsletter (embudo de captación).
 */
export default function WaitlistForm({
  courseSlug,
  courseTitle,
  compact = false,
}: {
  courseSlug: string;
  courseTitle: string;
  compact?: boolean;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<Status>({ state: 'idle' });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validation = validateWaitlistInput({ email, courseSlug, name });
    if (!validation.ok) {
      setStatus({ state: 'error', message: validation.error });
      return;
    }
    setStatus({ state: 'loading' });
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, courseSlug }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus({
          state: 'error',
          message: data.error ?? 'No se pudo registrar. Intente de nuevo.',
        });
        return;
      }
      setStatus({ state: 'done' });
    } catch {
      setStatus({ state: 'error', message: 'No se pudo registrar. Intente de nuevo.' });
    }
  }

  if (status.state === 'done') {
    return (
      <div
        className={`flex items-start gap-3 rounded-xl border border-leaf-200 bg-leaf-50 p-4 text-sm text-leaf-900 ${
          compact ? '' : 'max-w-xl'
        }`}
      >
        <Check className="mt-0.5 h-5 w-5 shrink-0 text-leaf-600" aria-hidden="true" />
        <div>
          <p className="font-semibold">
            ¡Listo! Quedaste en la lista de espera de {courseTitle}.
          </p>
          <p className="mt-1">
            Te avisaremos apenas esté disponible, junto con novedades del
            lanzamiento.
          </p>
        </div>
      </div>
    );
  }

  const inputId = `waitlist-email-${courseSlug}`;
  const nameId = `waitlist-name-${courseSlug}`;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className={compact ? 'flex flex-col gap-3 sm:flex-row' : 'flex flex-col gap-3 sm:flex-row'}>
        <div className="flex-1">
          <label htmlFor={nameId} className="sr-only">
            Nombre (opcional)
          </label>
          <div className="relative">
            <User
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id={nameId}
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre (opcional)"
              className="input w-full pl-9"
            />
          </div>
        </div>
        <div className="flex-1">
          <label htmlFor={inputId} className="sr-only">
            Tu email
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id={inputId}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="input w-full pl-9"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={status.state === 'loading'}
          className="btn-primary shrink-0"
        >
          <BellRing className="h-4 w-4" aria-hidden="true" />
          {status.state === 'loading' ? 'Enviando…' : 'Avisarme'}
        </button>
      </div>
      {status.state === 'error' ? (
        <p className="mt-2 text-sm font-medium text-red-400" role="alert">
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
