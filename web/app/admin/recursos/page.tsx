import type { Metadata } from 'next';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { products, levelLabel, type ProductLevel } from '@/lib/data/products';
import { PageHeader, Card, Badge, Th, Td, EmptyState, ButtonLink } from '@/components/admin/ui';
import AdminUrlFilters from '@/components/admin/AdminUrlFilters';
import AdminPagination from '@/components/admin/AdminPagination';
import ExportCsvButton from '@/components/admin/ExportCsvButton';

export const metadata: Metadata = { title: 'Recursos | BackOffice' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

const levelTones: Record<string, 'slate' | 'leaf' | 'brand' | 'clay' | 'sun'> = {
  'lead-magnet': 'leaf',
  entrada: 'brand',
  media: 'clay',
  alta: 'sun',
  b2b: 'brand',
  recurrente: 'brand',
  extra: 'slate',
};

export default async function AdminRecursosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; level?: string; page?: string }>;
}) {
  await requireAdminRole('admin.resources.read');
  const params = await searchParams;
  const q = params.q?.trim().toLowerCase();
  const level = params.level;

  let rows = products;
  if (q) {
    rows = rows.filter((p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.tags ?? []).some((t) => t.toLowerCase().includes(q)));
  }
  if (level) rows = rows.filter((p) => p.level === level);

  const page = Math.max(1, Number(params.page) || 1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recursos"
        description="Productos digitales descargables (escalera de valor)."
        badge={<Badge tone="leaf">{rows.length} recursos</Badge>}
        actions={
          rows.length > 0 ? (
            <ExportCsvButton
              filename="recursos"
              headers={['Título', 'Slug', 'Nivel', 'Precio (USD)', 'Intervalo']}
              rows={rows.map((p) => [p.title, p.slug, levelLabel[p.level], p.price, p.interval ?? ''])}
            />
          ) : undefined
        }
      />

      <Card padded={false}>
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <AdminUrlFilters
            searchPlaceholder="Buscar recurso…"
            selects={[
              {
                name: 'level',
                label: 'Nivel',
                options: (Object.keys(levelLabel) as ProductLevel[]).map((l) => ({ value: l, label: levelLabel[l] })),
              },
            ]}
          />
        </div>

        {paged.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={Package} title="No se encontraron recursos" description="Pruebe a quitar los filtros." actionHref="/admin/recursos" actionLabel="Ver todos" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60">
                <tr>
                  <Th>Recurso</Th>
                  <Th>Nivel</Th>
                  <Th>Precio</Th>
                  <Th>Tags</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.map((p) => (
                  <tr key={p.slug} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                    <Td>
                      <Link href={`/tienda/${p.slug}`} className="block max-w-[400px]">
                        <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{p.title}</span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{p.subtitle}</span>
                      </Link>
                    </Td>
                    <Td>
                      <Badge tone={levelTones[p.level] ?? 'slate'}>{levelLabel[p.level]}</Badge>
                    </Td>
                    <Td>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {p.price === 0 ? 'Gratis' : `USD ${p.price}`}
                      </span>
                      {p.interval ? <span className="text-xs text-slate-400">/{p.interval}</span> : null}
                    </Td>
                    <Td>
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        {(p.tags ?? []).slice(0, 3).map((t) => (
                          <Badge key={t} tone="slate">{t}</Badge>
                        ))}
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
