'use client';

import { useState } from 'react';
import { Check, Mail } from 'lucide-react';
import { saveNewsletter } from '@/lib/supabase/inserts';

export default function NewsletterForm({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    await saveNewsletter(email.trim());
    setStatus('done');
  }

  if (status === 'done') {
    return (
      <div
        className={`flex items-start gap-3 rounded-xl border border-leaf-200 bg-leaf-50 p-4 text-sm text-leaf-900 ${
          compact ? '' : 'mx-auto max-w-xl'
        }`}
      >
        <Check
          className="mt-0.5 h-5 w-5 shrink-0 text-leaf-600"
          aria-hidden="true"
        />
        <div>
          <p className="font-semibold">
            ¡Listo! Te sumaste a la newsletter semanal de Evolución Salud.
          </p>
          <p className="mt-1">
            Contenido educativo, sin spam. Puedes darte de baja cuando quieras.
          </p>
        </div>
      </div>
    );
  }

  const inputId = `newsletter-email-${compact ? 'compact' : 'full'}`;

  return (
    <form
      onSubmit={handleSubmit}
      className={
        compact
          ? 'flex flex-col gap-3 sm:flex-row'
          : 'mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row'
      }
    >
      <label htmlFor={inputId} className="sr-only">
        Tu email
      </label>
      <input
        id={inputId}
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        className="input flex-1"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary shrink-0"
      >
        <Mail className="h-4 w-4" aria-hidden="true" />
        {status === 'loading' ? 'Enviando…' : 'Suscribirme'}
      </button>
    </form>
  );
}
