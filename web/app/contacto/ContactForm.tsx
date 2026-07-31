'use client';

import { useState } from 'react';
import { Check, Send } from 'lucide-react';
import { saveContactMessage } from '@/lib/supabase/inserts';

const topics = [
  'Cursos y capacitaciones',
  'Guías y productos digitales',
  'Talleres para instituciones',
  'Prensa y alianzas',
  'Otro',
];

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState(topics[0]);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!message.trim() || !email.trim()) return;
    setStatus('loading');
    await saveContactMessage({ name, email, topic, message });
    setStatus('done');
  }

  if (status === 'done') {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-leaf-200 bg-leaf-50 p-5 text-sm text-leaf-900">
        <Check className="mt-0.5 h-5 w-5 shrink-0 text-leaf-600" aria-hidden="true" />
        <div>
          <p className="font-semibold">¡Gracias, {name || 'ahí'}! Mensaje enviado.</p>
          <p className="mt-1">
            Te vamos a responder a la brevedad por email. Si es urgente,
            escríbenos por WhatsApp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="label">
            Nombre
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="label">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>
      </div>
      <div>
        <label htmlFor="contact-topic" className="label">
          Tema
        </label>
        <select
          id="contact-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="input"
        >
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="contact-message" className="label">
          Mensaje
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Cuéntanos en qué podemos ayudarte…"
          className="input resize-y"
        />
      </div>
      <button type="submit" disabled={status === 'loading'} className="btn-primary w-full sm:w-auto">
        <Send className="h-4 w-4" aria-hidden="true" />
        {status === 'loading' ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  );
}
