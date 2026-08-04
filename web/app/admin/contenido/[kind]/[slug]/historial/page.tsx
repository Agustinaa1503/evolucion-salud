import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileClock, Inbox } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { ContentService } from '@/lib/content/service';
import { getContentRepository } from '@/lib/content/repository';
import { createSupabaseVersioner } from '@/lib/content/supabase-versioner';
import { PageHeader, Card, Badge, EmptyState } from '@/components/admin/ui';
import VersionHistory from '@/components/admin/contenido/VersionHistory';
import {
  CONTENT_KINDS,
  CONTENT_KIND_LABELS,
} from '@/components/admin/contenido/meta';
import type { FileContentKind } from '@/lib/content/parser';

export const metadata: Metadata = { title: 'Historial de versiones | BackOffice' };
export const dynamic = 'force-dynamic';

function parseKind(value: string): FileContentKind | null {
  return (CONTENT_KINDS as string[]).includes(value) ? (value as FileContentKind) : null;
}

export default async function AdminContenidoHistorialPage({
  params,
}: {
  params: Promise<{ kind: string; slug: string }>;
}) {
  await requireAdminRole('admin.content.read');
  const { kind: kindParam, slug } = await params;
  const kind = parseKind(kindParam);
  if (!kind) notFound();

  const service = new ContentService(getContentRepository());
  const doc = service.get(kind, slug);
  if (!doc) notFound();

  const versioner = await createSupabaseVersioner();
  const versions = await versioner.list(kind, slug);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Historial de versiones`}
        description={`/${kind}/${slug} · ${doc.title}. Cada guardado/publicación registra una entrada con editor, estado y nota editorial.`}
        badge={<Badge tone="brand">{CONTENT_KIND_LABELS[kind]}</Badge>}
        actions={
          <Link
            href={`/admin/contenido/${kind}/${slug}`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al documento
          </Link>
        }
      />

      <Card padded={false}>
        {versions.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Inbox}
              title="Sin historial registrado"
              description="No se encontraron versiones para este documento. Las entradas se registran al guardar/publicar desde el CMS (requiere Supabase)."
              actionHref={`/admin/contenido/${kind}/${slug}`}
              actionLabel="Editar documento"
            />
          </div>
        ) : (
          <VersionHistory kind={kind} slug={slug} versions={versions} />
        )}
      </Card>

      <p className="flex items-center gap-2 text-xs text-slate-400">
        <FileClock className="h-3.5 w-3.5" aria-hidden="true" />
        El historial vive en Supabase (tabla content_versions) y se conserva aunque se elimine el documento.
      </p>
    </div>
  );
}
