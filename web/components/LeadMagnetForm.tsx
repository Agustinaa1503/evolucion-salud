'use client';

import { useState } from 'react';
import { Check, Download, Mail } from 'lucide-react';
import { saveLeadMagnet } from '@/lib/supabase/inserts';

export default function LeadMagnetForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    await saveLeadMagnet(email.trim(), name.trim(), 'checklist-matriz-pine');
    setStatus('done');
  }

  if (status === 'done') {
    return (
      <div className="rounded-2xl border border-leaf-200 bg-leaf-50 p-6 text-sm text-leaf-900">
        <div className="flex items-start gap-3">
          <Check
            className="mt-0.5 h-6 w-6 shrink-0 text-leaf-600"
            aria-hidden="true"
          />
          <div>
            <p className="text-base font-bold">¡Listo, {name || 'ahí'}!</p>
            <p className="mt-1">
              Tu Checklist Matriz PINE te espera. También te la enviamos por
              email junto con el primer paso de tu proceso personal.
            </p>
          </div>
        </div>
        <a
          href="/descargables/checklist-matriz-pine.html"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-5 w-full"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Descargar la checklist (imprimible)
        </a>
        <p className="mt-3 text-xs text-leaf-700/70">
          El acceso está ligado a tu correo (bloqueo de segundo uso): cada
          persona hace su propio proceso.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="lead-name" className="label">
          Tu nombre
        </label>
        <input
          id="lead-name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          className="input"
        />
      </div>
      <div>
        <label htmlFor="lead-email" className="label">
          Tu email <span className="text-brand-600">*</span>
        </label>
        <input
          id="lead-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="input"
        />
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary w-full"
      >
        <Mail className="h-4 w-4" aria-hidden="true" />
        {status === 'loading' ? 'Preparando tu descarga…' : 'Quiero la checklist gratis'}
      </button>
      <p className="text-center text-xs text-slate-500">
        Respetamos tu privacidad: tu email se usa solo para enviarte
        contenido educativo y las herramientas de tu proceso.
      </p>
    </form>
  );
}
