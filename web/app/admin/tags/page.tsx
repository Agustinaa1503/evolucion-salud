import type { Metadata } from 'next';
import Link from 'next/link';
import { Tag } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { getAllTags } from '@/lib/taxonomy/content';
import { PageHeader, Card, Badge, EmptyState, ButtonLink, Th, Td } from '@/components/admin/ui';
import AdminUrlFilters from '@/components/admin/AdminUrlFilters';
import ExportCsvButton from '@/components/admin/ExportCsvButton';

export const metadata: Metadata = { title: 'Tags | BackOffice' };
export const dynamic = 'force-dynamic';

export default async function AdminTagsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminRole('admin.taxonomy.read');
  const params = await searchParams;
  const q = params.q?.trim().toLowerCase();

  const tags = getAllTags();
  let rows = tags;
  if (q) {
    rows = rows.filter((t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q));
  }
  rows = rows.sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tags"
        description="Etiquetas libres derivadas del contenido (con conteos de uso). Se generan desde el contenido y se sincronizan a Supabase."
        badge={<Badge tone="leaf">{tags.length} tags</Badge>}
        actions={
          rows.length > 0 ? (
            <ExportCsvButton filename="tags" headers={['Tag', 'Slug', 'Uso']} rows={rows.map((t) => [t.name, t.slug, t.count])} />
          ) : undefined
        }
      />

      <Card padded={false}>
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <AdminUrlFilters searchPlaceholder="Buscar tag…" />
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={Tag} title="No se encontraron tags" description="Pruebe a quitar el filtro." actionHref="/admin/tags" actionLabel="Ver todos" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60">
                <tr>
                  <Th>Tag</Th>
                  <Th>Slug</Th>
                  <Th>Uso</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((t) => (
                  <tr key={t.slug} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                    <Td>
                      <Link href={`/tags/${t.slug}`} className="text-sm font-semibold text-slate-800 hover:underline dark:text-slate-100">
                        {t.name}
                      </Link>
                    </Td>
                    <Td>
                      <code className="text-xs text-slate-500 dark:text-slate-400">{t.slug}</code>
                    </Td>
                    <Td>
                      <Badge tone="brand">{t.count}</Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ButtonLink href="/admin/dashboard">← Volver al Dashboard</ButtonLink>
    </div>
  );
}
