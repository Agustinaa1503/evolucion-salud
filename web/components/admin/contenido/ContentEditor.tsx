'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Save,
  Send,
  TriangleAlert,
} from 'lucide-react';
import { cmsSaveContent } from '@/lib/content/content-actions';
import { workflowStatusLabel, WORKFLOW_STATUSES } from '@/lib/content/workflow';
import { PRODUCT_FORMATS } from '@/lib/products/types';
import type { FileContentKind } from '@/lib/content/parser';
import type { ContentDoc, EditorialStatus } from '@/lib/content/types';

type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'comma' | 'checkbox';

type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  hint?: string;
  span?: 'full';
};

export type TaxonomyOptions = {
  levels: { value: string; label: string }[];
  audiences: string[];
  categories: string[];
};

const PRODUCT_LEVEL_LABELS: Record<string, string> = {
  'lead-magnet': 'Lead magnet (gratuito)',
  entrada: 'Entrada',
  media: 'Media',
  alta: 'Alta',
  b2b: 'B2B (profesionales)',
  recurrente: 'Recurrente (membresía)',
  extra: 'Extra',
};

function commonFields(): Field[] {
  return [
    { name: 'title', label: 'Título', type: 'text', required: true, span: 'full' },
    { name: 'description', label: 'Descripción breve', type: 'textarea', span: 'full' },
    { name: 'slug', label: 'Slug (URL)', type: 'text', required: true, hint: 'Minúsculas, números y guiones. No se repite.', span: 'full' },
    { name: 'icon', label: 'Icono', type: 'text', hint: 'Nombre del icono (lucide).' },
    { name: 'gradient', label: 'Gradiente', type: 'text', hint: 'Clases Tailwind, p. ej. from-brand-500 to-leaf-600.' },
    { name: 'image', label: 'Imagen (URL)', type: 'text', span: 'full' },
    { name: 'order', label: 'Orden', type: 'number', hint: '0 = primero.' },
  ];
}

function taxonomyFields(): Field[] {
  return [
    { name: 'categories', label: 'Categorías (comas)', type: 'comma', hint: 'Usar slugs del catálogo de categorías.' },
    { name: 'tags', label: 'Tags (comas)', type: 'comma' },
    { name: 'level', label: 'Nivel', type: 'select' },
    { name: 'audience', label: 'Audiencias (comas)', type: 'comma' },
  ];
}

function kindFields(kind: FileContentKind, taxonomy: TaxonomyOptions): Field[] {
  switch (kind) {
    case 'blog':
      return [
        { name: 'excerpt', label: 'Extracto (resumen)', type: 'textarea', required: true, span: 'full' },
        { name: 'date', label: 'Fecha de publicación', type: 'date', required: true },
        { name: 'category', label: 'Categoría (legacy)', type: 'text', required: true },
        { name: 'readTime', label: 'Tiempo de lectura', type: 'text', required: true },
      ];
    case 'podcast':
      return [
        { name: 'description', label: 'Descripción', type: 'textarea', required: true, span: 'full' },
        { name: 'duration', label: 'Duración', type: 'text', hint: 'Formato mm:ss o hh:mm:ss.' },
        { name: 'series', label: 'Serie', type: 'select', options: ['mindfulness', 'meditaciones-pine'] },
        { name: 'embedUrl', label: 'Embed URL', type: 'text', span: 'full' },
        { name: 'spotifyUrl', label: 'Spotify URL', type: 'text', span: 'full' },
        { name: 'youtubeUrl', label: 'YouTube URL', type: 'text', span: 'full' },
      ];
    case 'product':
      return [
        { name: 'subtitle', label: 'Subtítulo', type: 'text', required: true, span: 'full' },
        { name: 'shortDescription', label: 'Descripción corta (tarjetas)', type: 'textarea', span: 'full' },
        { name: 'price', label: 'Precio (USD)', type: 'number', required: true },
        { name: 'compareAt', label: 'Precio tachado (comparar con)', type: 'number' },
        { name: 'currency', label: 'Moneda', type: 'select', options: ['USD', 'ARS'] },
        { name: 'priceArs', label: 'Precio ARS (override display)', type: 'number' },
        { name: 'taxRate', label: 'Tasa impuestos (%)', type: 'number' },
        { name: 'sku', label: 'SKU (auto-derivado si vacío)', type: 'text' },
        { name: 'format', label: 'Formato', type: 'select', options: PRODUCT_FORMATS },
        { name: 'author', label: 'Autor/a', type: 'text' },
        { name: 'duration', label: 'Duración', type: 'text', hint: 'Ej: "2 horas", "30 min".' },
        { name: 'level', label: 'Nivel de producto', type: 'select', options: Object.keys(PRODUCT_LEVEL_LABELS) },
        { name: 'productType', label: 'Tipo comercial', type: 'select', options: ['simple', 'bundle', 'membership'] },
        { name: 'badge', label: 'Insignia', type: 'text' },
        { name: 'banner', label: 'Banner (URL imagen)', type: 'text', span: 'full' },
        { name: 'gallery', label: 'Galería (URLs, comas)', type: 'comma' },
        { name: 'related', label: 'Productos relacionados (slugs, comas)', type: 'comma' },
        { name: 'components', label: 'Componentes (slugs, comas)', type: 'comma', hint: 'Solo para bundles/membresías.' },
        { name: 'features', label: 'Características (comas)', type: 'comma' },
        { name: 'includes', label: 'Incluye (comas)', type: 'comma' },
        { name: 'recommended', label: 'Recomendado', type: 'checkbox' },
      ];
    case 'newsletter':
      return [
        { name: 'description', label: 'Descripción', type: 'textarea', required: true, span: 'full' },
        { name: 'date', label: 'Fecha', type: 'date' },
      ];
  }
}

function toFormValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function fromFormValue(value: string, type: FieldType): unknown {
  if (type === 'comma') {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (type === 'number') {
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }
  if (type === 'checkbox') return value === 'true';
  if (type === 'text' || type === 'textarea') return value;
  return value;
}

const inputClasses =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-brand-400 dark:focus:ring-brand-900';

/**
 * Editor de contenido del CMS: formulario por tipo (blog/podcast/product/
 * newsletter) con validación en vivo de la pipeline, guardado vía server
 * action y feedback de errores/advertencias.
 */
export default function ContentEditor({
  kind,
  initial,
  taxonomy,
}: {
  kind: FileContentKind;
  initial: ContentDoc | null;
  taxonomy: TaxonomyOptions;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<Record<string, string>>(() => {
    const base = initial?.frontmatter ?? {};
    const out: Record<string, string> = { body: initial?.body ?? '' };
    for (const f of [
      ...commonFields(),
      ...taxonomyFields(),
      ...kindFields(kind, taxonomy),
    ]) {
      out[f.name] = toFormValue(base[f.name]);
    }
    out.status = (initial?.status ?? 'draft') as string;
    out.summary = '';
    return out;
  });
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [issues, setIssues] = useState<
    { severity: string; step: string; message: string }[]
  >([]);

  const fields: Field[] = useMemo(
    () => [
      ...commonFields(),
      ...taxonomyFields(),
      ...kindFields(kind, taxonomy),
    ],
    [kind, taxonomy]
  );

  const set = (name: string, value: string) =>
    setForm((f) => ({ ...f, [name]: value }));

  const submit = (publish: boolean) => {
    setMessage(null);
    setIssues([]);
    setSaved(false);
    startTransition(async () => {
      const frontmatter: Record<string, unknown> = { ...(initial?.frontmatter ?? {}) };
      for (const f of fields) {
        if (f.name === 'slug' && initial) continue;
        const raw = form[f.name];
        const value = fromFormValue(raw ?? '', f.type);
        if (value === undefined || value === '') delete frontmatter[f.name];
        else frontmatter[f.name] = value;
      }
      const status = publish
        ? ('published' as EditorialStatus)
        : ((form.status as EditorialStatus) ?? 'draft');

      const res = await cmsSaveContent({
        kind,
        slug: form.slug.trim(),
        frontmatter,
        body: form.body ?? '',
        status,
        summary: form.summary?.trim() || null,
      });

      if (res.ok) {
        setSaved(true);
        setMessage(
          res.published
            ? 'Publicado. La web se recompiló con el documento nuevo.'
            : `Guardado (v${res.version}). La web se recompiló; el documento queda en ${workflowStatusLabel(status)}.`
        );
        setForm((f) => ({ ...f, summary: '' }));
        router.refresh();
      } else {
        setMessage(res.error ?? 'No se pudo guardar.');
        setIssues(res.validation?.issues ?? []);
      }
    });
  };

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  const renderField = (f: Field) => {
    const value = form[f.name] ?? '';
    const common = `col-span-1 ${f.span === 'full' ? 'sm:col-span-2' : ''}`;
    return (
      <label key={f.name} className={`block ${common}`}>
        <span className="mb-1.5 flex items-baseline gap-1 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {f.label}
          {f.required ? <span className="text-red-500">*</span> : null}
        </span>
        {f.type === 'textarea' ? (
          <textarea
            rows={3}
            value={value}
            onChange={(e) => set(f.name, e.target.value)}
            className={inputClasses}
          />
        ) : f.type === 'select' ? (
          <select
            value={value}
            onChange={(e) => set(f.name, e.target.value)}
            className={inputClasses}
          >
            <option value="">—</option>
            {(f.options ?? taxonomy.levels.map((l) => l.value)).map((o) => (
              <option key={o} value={o}>
                {f.options
                  ? PRODUCT_LEVEL_LABELS[o] ?? o
                  : taxonomy.levels.find((l) => l.value === o)?.label ?? o}
              </option>
            ))}
          </select>
        ) : f.type === 'checkbox' ? (
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => set(f.name, e.target.checked ? 'true' : 'false')}
            className="mt-1.5 h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
        ) : (
          <input
            type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
            value={value}
            onChange={(e) => set(f.name, e.target.value)}
            disabled={f.name === 'slug' && !!initial}
            className={inputClasses}
          />
        )}
        {f.hint ? <span className="mt-1 block text-[11px] text-slate-400">{f.hint}</span> : null}
      </label>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {message ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              errors.length > 0
                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
                : saved
                  ? 'border-leaf-200 bg-leaf-50 text-leaf-700 dark:border-leaf-800 dark:bg-leaf-950 dark:text-leaf-300'
                  : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {message}
          </div>
        ) : null}

        {errors.length > 0 ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <p className="flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-300">
              <TriangleAlert className="h-4 w-4" aria-hidden="true" /> El documento no pasa la validación
            </p>
            <ul className="mt-2 space-y-1">
              {errors.map((i, idx) => (
                <li key={idx} className="text-xs text-red-600 dark:text-red-400">
                  {i.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {warnings.length > 0 ? (
          <div className="rounded-xl border border-sun-300 bg-sun-50 p-4 dark:border-sun-800 dark:bg-sun-950">
            <p className="flex items-center gap-2 text-sm font-bold text-sun-800 dark:text-sun-300">
              <TriangleAlert className="h-4 w-4" aria-hidden="true" /> Advertencias (no bloquean)
            </p>
            <ul className="mt-2 space-y-1">
              {warnings.map((i, idx) => (
                <li key={idx} className="text-xs text-sun-800 dark:text-sun-300">
                  {i.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Contenido</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{fields.map(renderField)}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Cuerpo (Markdown)</h3>
            <span className="text-[11px] text-slate-400">
              {kind === 'blog' ? 'Cada ## genera una sección del artículo.' : 'Texto libre en Markdown.'}
            </span>
          </div>
          <textarea
            rows={18}
            value={form.body ?? ''}
            onChange={(e) => set('body', e.target.value)}
            className={`${inputClasses} mt-3 font-mono text-[13px] leading-relaxed`}
            spellCheck={false}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Publicación</h3>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Estado
            </span>
            <select
              value={form.status ?? 'draft'}
              onChange={(e) => set('status', e.target.value)}
              className={inputClasses}
            >
              {WORKFLOW_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {workflowStatusLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Nota editorial (historial)
            </span>
            <textarea
              rows={3}
              value={form.summary ?? ''}
              onChange={(e) => set('summary', e.target.value)}
              placeholder="Qué cambió en esta versión…"
              className={inputClasses}
            />
          </label>
          <div className="mt-5 space-y-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => submit(false)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-400"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              Guardar borrador
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => submit(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-leaf-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-leaf-700 disabled:opacity-50 dark:bg-leaf-500 dark:hover:bg-leaf-400"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              Guardar y publicar
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/contenido')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver al listado
            </button>
          </div>
          {saved ? (
            <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-leaf-600 dark:text-leaf-400">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Cambios aplicados
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
