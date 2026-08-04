import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Mic, Package, Mail, Plus } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { ContentService } from '@/lib/content/service';
import { getContentRepository } from '@/lib/content/repository';
import { workflowStatusLabel } from '@/lib/content/workflow';
import { PageHeader, Card, Badge, EmptyState, Th, Td } from '@/components/admin/ui';
import AdminPagination from '@/components/admin/AdminPagination';
import AdminUrlFilters from '@/components/admin/AdminUrlFilters';
import ContentTypeTabs from '@/components/admin/contenido/ContentTypeTabs';
import ContentRowActions from '@/components/admin/contenido/ContentRowActions';
import {
  CONTENT_KINDS,
  CONTENT_KIND_LABELS,
  CONTENT_KIND_DESCRIPTIONS,
  CONTENT_KIND_PLURAL,
} from '@/components/admin/contenido/meta';
import type { FileContentKind } from '@/lib/content/parser';

export const metadata: Metadata = { title: 'Contenido | BackOffice' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

const KIND_ICONS = { blog: FileText, podcast: Mic, product: Package, newsletter: Mail } as const;

function parseKind(value?: string): FileContentKind {
  return (CONTENT_KINDS as string[]).includes(value ?? '')
    ? (value as FileContentKind)
    : 'blog';
}

export default async function AdminContenidoPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; q?: string; status?: string; page?: string }>;
}) {
  await requireAdminRole('admin.content.read');
  const params = await searchParams;
  const kind = parseKind(params.kind);

  const service = new ContentService(getContentRepository());
  const all = service.list(kind);
  const counts = Object.fromEntries(
    CONTENT_KINDS.map((k) => [k, service.list(k).length])
  );

  const q = params.q?.trim().toLowerCase();
  const status = params.status;

  let docs = all;
  if (q) {
    docs = docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.slug.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        (d.tags ?? []).some((t) => t.toLowerCase().includes(q))
    );
  }
  if (status) docs = docs.filter((d) => d.status === status);

  docs = [...docs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const page = Math.max(1, Number(params.page) || 1);
  const totalPages = Math.max(1, Math.ceil(docs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = docs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contenido"
        description="Gestión editorial de blog, podcast, recursos y newsletter. La fuente de verdad son los archivos Markdown de Contenido/; cada guardado valida, versiona, registra en el historial y recompila la web."
        badge={<Badge tone="brand">{CONTENT_KIND_LABELS[kind]}</Badge>}
        actions={
          <Link
            href={`/admin/contenido/nuevo?kind=${kind}`}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo {CONTENT_KIND_PLURAL[kind].replace(/s$/u, '')}
          </Link>
        }
      />

      <ContentTypeTabs counts={counts} active={kind} />

      <Card padded={false}>
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <AdminUrlFilters
            searchPlaceholder="Buscar por título, slug o tag…"
            selects={[
              {
                name: 'status',
                label: 'Estado',
                options: [
                  { value: 'draft', label: 'Borrador' },
                  { value: 'review', label: 'En revisión' },
                  { value: 'published', label: 'Publicado' },
                  { value: 'archived', label: 'Archivado' },
                ],
              },
            ]}
          />
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={KIND_ICONS[kind]}
              title={`No hay ${CONTENT_KIND_PLURAL[kind]}`}
              description={
                q || status
                  ? 'Pruebe a quitar los filtros.'
                  : `Cree el primer ${CONTENT_KIND_PLURAL[kind].replace(/s$/u, '')} con el botón «Nuevo».`
              }
              actionHref={`/admin/contenido/nuevo?kind=${kind}`}
              actionLabel="Crear contenido"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60">
                <tr>
                  <Th>Título</Th>
                  <Th>Estado</Th>
                  <Th>Versión</Th>
                  <Th>Tags</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((d) => (
                  <tr
                    key={d.slug}
                    className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/40"
                  >
                    <Td>
                      <Link
                        href={`/admin/contenido/${kind}/${d.slug}`}
                        className="block min-w-0 max-w-md"
                      >
                        <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {d.title}
                        </span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                          /{kind}/{d.slug}
                        </span>
                      </Link>
                    </Td>
                    <Td>
                      <Badge
                        tone={
                          d.status === 'published'
                            ? 'leaf'
                            : d.status === 'review'
                              ? 'clay'
                              : d.status === 'archived'
                                ? 'slate'
                                : 'slate'
                        }
                      >
                        {workflowStatusLabel(d.status)}
                      </Badge>
                    </Td>
                    <Td>
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        v{d.version ?? 1}
                      </span>
                    </Td>
                    <Td>
                      <span className="flex max-w-56 flex-wrap gap-1">
                        {(d.tags ?? []).slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {t}
                          </span>
                        ))}
                      </span>
                    </Td>
                    <Td>
                      <ContentRowActions
                        kind={kind}
                        slug={d.slug}
                        status={d.status}
                      />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPagination page={safePage} totalPages={totalPages} total={docs.length} pageSize={PAGE_SIZE} />
      </Card>

      <p className="text-xs text-slate-400">
        {CONTENT_KIND_DESCRIPTIONS[kind]} Cambios de estado: Borrador → En revisión → Publicado → Archivado.
        Publicar exige validación correcta (categorías, nivel, audiencia y slugs existentes).
      </p>
    </div>
  );
}
