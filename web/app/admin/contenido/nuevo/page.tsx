import type { Metadata } from 'next';
import { requireAdminRole } from '@/lib/auth/session';
import { getAllCategories } from '@/lib/taxonomy/categories';
import { getAllLevels } from '@/lib/taxonomy/levels-audiences';
import { getAllAudiences } from '@/lib/taxonomy/levels-audiences';
import { PageHeader, Card, Badge } from '@/components/admin/ui';
import ContentEditor from '@/components/admin/contenido/ContentEditor';
import ContentTypeTabs from '@/components/admin/contenido/ContentTypeTabs';
import {
  CONTENT_KINDS,
  CONTENT_KIND_LABELS,
  CONTENT_KIND_PLURAL,
} from '@/components/admin/contenido/meta';
import type { FileContentKind } from '@/lib/content/parser';

export const metadata: Metadata = { title: 'Nuevo contenido | BackOffice' };
export const dynamic = 'force-dynamic';

function parseKind(value?: string): FileContentKind {
  return (CONTENT_KINDS as string[]).includes(value ?? '')
    ? (value as FileContentKind)
    : 'blog';
}

export default async function AdminContenidoNuevoPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  await requireAdminRole('admin.content.write');
  const params = await searchParams;
  const kind = parseKind(params.kind);

  const categories = getAllCategories().map((c) => c.slug);
  const levels = getAllLevels().map((l) => ({ value: l.slug, label: l.name }));
  const audiences = getAllAudiences().map((a) => a.slug);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Nuevo ${CONTENT_KIND_PLURAL[kind].replace(/s$/u, '')}`}
        description="Crea un documento nuevo de contenido. Los campos obligatorios se marcan con *; la validación se ejecuta en el servidor antes de guardar."
        badge={<Badge tone="brand">{CONTENT_KIND_LABELS[kind]}</Badge>}
      />
      <ContentTypeTabs counts={{ blog: 0, podcast: 0, product: 0, newsletter: 0 }} active={kind} />
      <Card padded={false}>
        <div className="p-5">
          <ContentEditor kind={kind} initial={null} taxonomy={{ levels, audiences, categories }} />
        </div>
      </Card>
    </div>
  );
}
