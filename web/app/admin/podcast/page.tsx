import type { Metadata } from 'next';
import Link from 'next/link';
import { Mic } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { podcast } from '@/lib/data/podcast';
import { PageHeader, Card, Badge, Th, Td, EmptyState, ButtonLink } from '@/components/admin/ui';
import AdminUrlFilters from '@/components/admin/AdminUrlFilters';
import AdminPagination from '@/components/admin/AdminPagination';
import ExportCsvButton from '@/components/admin/ExportCsvButton';

export const metadata: Metadata = { title: 'Podcast | BackOffice' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function AdminPodcastPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdminRole('admin.podcast.read');
  const params = await searchParams;
  const q = params.q?.trim().toLowerCase();

  const episodes = podcast.episodes ?? [];
  let rows = episodes;
  if (q) {
    rows = rows.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || (e.tags ?? []).some((t) => t.toLowerCase().includes(q)));
  }

  const page = Math.max(1, Number(params.page) || 1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Podcast"
        description={podcast.description}
        badge={<Badge tone="leaf">{rows.length} episodios</Badge>}
        actions={
          rows.length > 0 ? (
            <ExportCsvButton
              filename="podcast"
              headers={['Título', 'Slug', 'Duración']}
              rows={rows.map((e) => [e.title, e.slug, e.duration])}
            />
          ) : undefined
        }
      />

      <Card padded={false}>
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <AdminUrlFilters searchPlaceholder="Buscar episodio…" />
        </div>

        {paged.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={Mic} title="No se encontraron episodios" description="Pruebe a quitar los filtros." actionHref="/admin/podcast" actionLabel="Ver todos" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60">
                <tr>
                  <Th>Episodio</Th>
                  <Th>Categorías</Th>
                  <Th>Duración</Th>
                  <Th>Plataformas</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.map((e) => (
                  <tr key={e.slug} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                    <Td>
                      <span className="block max-w-[420px] truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{e.title}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{e.description}</span>
                    </Td>
                    <Td>
                      <div className="flex max-w-[200px] flex-wrap gap-1">
                        {(e.categories ?? []).slice(0, 2).map((c) => (
                          <Badge key={c} tone="brand">{c}</Badge>
                        ))}
                      </div>
                    </Td>
                    <Td>
                      <span className="text-sm text-slate-600 dark:text-slate-300">{e.duration}</span>
                    </Td>
                    <Td>
                      <div className="flex gap-1">
                        {e.spotifyUrl ? <Badge tone="leaf">Spotify</Badge> : null}
                        {e.youtubeUrl ? <Badge tone="clay">YouTube</Badge> : null}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPagination page={safePage} totalPages={totalPages} total={rows.length} pageSize={PAGE_SIZE} />
      </Card>

      <ButtonLink href="/admin/dashboard">← Volver al Dashboard</ButtonLink>
    </div>
  );
}
