'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { adminUpdateSettings } from '@/lib/admin/actions';
import { SETTINGS_FIELDS, type SettingsGroup } from '@/lib/admin/settings';

/**
 * Formulario de un grupo de configuración del BackOffice. Guarda solo campos
 * conocidos del esquema vía server action (valida permiso admin.settings.write).
 */
export default function AdminSettingsForm({
  group,
  label,
  initial,
}: {
  group: SettingsGroup;
  label: string;
  initial: Record<string, string>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const fields = SETTINGS_FIELDS[group];
  const dirty = fields.some((f) => values[f.key] !== initial[f.key]);

  const save = async () => {
    setBusy(true);
    setMessage(null);
    const res = await adminUpdateSettings(group, values);
    setBusy(false);
    setMessage({ ok: res.ok, text: res.ok ? (res.message ?? 'Guardado.') : (res.error ?? 'Error') });
    if (res.ok) router.refresh();
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{label}</h3>
        {dirty ? <span className="text-xs font-semibold text-clay-600 dark:text-clay-400">Cambios sin guardar</span> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="block sm:col-span-1">
            <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{f.label}</span>
            {f.type === 'textarea' ? (
              <textarea
                value={values[f.key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                rows={3}
                className={inputClass}
              />
            ) : (
              <input
                type={f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'text'}
                value={values[f.key] ?? ''}
                placeholder={f.placeholder}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className={inputClass}
              />
            )}
          </label>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={busy || !dirty}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-400"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
        {message ? (
          <p className={`text-xs font-semibold ${message.ok ? 'text-leaf-600 dark:text-leaf-400' : 'text-red-600 dark:text-red-400'}`}>
            {message.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}
