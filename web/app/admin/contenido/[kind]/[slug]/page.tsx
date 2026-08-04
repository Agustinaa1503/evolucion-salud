import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileClock, ExternalLink } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { ContentService } from '@/lib/content/service';
import { getContentRepository } from '@/lib/content/repository';
import { workflowStatusLabel } from '@/lib/content/workflow';
import { getAllCategories } from '@/lib/taxonomy/categories';
import { getAllLevels, getAllAudiences } from '@/lib/taxonomy/levels-audiences';
import { PageHeader, Card, Badge } from '@/components/admin/ui';
import ContentEditor from '@/components/admin/contenido/ContentEditor';
import {
  CONTENT_KINDS,
  CONTENT_KIND_LABELS,
  CONTENT_KIND_DESCRIPTIONS,
} from '@/components/admin/contenido/meta';
import type { FileContentKind } from '@/lib/content/parser';

export const metadata: Metadata = { title: 'Editar contenido | BackOffice' };
export const dynamic = 'force-dynamic';

function parseKind(value: string): FileContentKind | null {
  return (CONTENT_KINDS as string[]).includes(value) ? (value as FileContentKind) : null;
}

export default async function AdminContenidoEditarPage({
  params,
}: {
  params: Promise<{ kind: string; slug: string }>;
}) {
  await requireAdminRole('admin.content.write');
  const { kind: kindParam, slug } = await params;
  const kind = parseKind(kindParam);
  if (!kind) notFound();

  const service = new ContentService(getContentRepository());
  const doc = service.get(kind, slug);
  if (!doc) notFound();

  const categories = getAllCategories().map((c) => c.slug);
  const levels = getAllLevels().map((l) => ({ value: l.slug, label: l.name }));
  const audiences = getAllAudiences().map((a) => a.slug);

  const publicPath =
    kind === 'product' ? `/tienda/${slug}` : kind === 'blog' || kind === 'podcast' || kind === 'newsletter' ? `/${kind}/${slug}` : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={doc.title}
        description={CONTENT_KIND_DESCRIPTIONS[kind]}
        badge={<Badge tone="brand">{CONTENT_KIND_LABELS[kind]}</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/contenido/${kind}/${slug}/historial`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <FileClock className="h-4 w-4" aria-hidden="true" />
              Historial de versiones
            </Link>
            {doc.status === 'published' && publicPath ? (
              <Link
                href={publicPath}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Ver en la web
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Badge
          tone={
            doc.status === 'published'
              ? 'leaf'
              : doc.status === 'review'
                ? 'clay'
                : 'slate'
          }
        >
          {workflowStatusLabel(doc.status)}
        </Badge>
        <span>v{doc.version ?? 1}</span>
        <span>·</span>
        <span>/{kind}/{doc.slug}</span>
        {doc.updatedAt ? (
          <>
            <span>·</span>
            <span>Actualizado: {doc.updatedAt}</span>
          </>
        ) : null}
      </div>

      <Card padded={false}>
        <div className="p-5">
          <ContentEditor kind={kind} initial={doc} taxonomy={{ levels, audiences, categories }} />
        </div>
      </Card>
    </div>
  );
}
