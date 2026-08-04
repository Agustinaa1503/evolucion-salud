import type { Metadata } from 'next';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { products, levelLabel, type ProductLevel } from '@/lib/data/products';
import { formatLabel } from '@/lib/products/types';
import { priceLabel, productSku } from '@/lib/products/pricing';
import { PageHeader, Card, Badge, Th, Td, EmptyState, ButtonLink } from '@/components/admin/ui';
import AdminUrlFilters from '@/components/admin/AdminUrlFilters';
import AdminPagination from '@/components/admin/AdminPagination';
import ExportCsvButton from '@/components/admin/ExportCsvButton';

export const metadata: Metadata = { title: 'Productos | BackOffice' };
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

export default async function AdminProductosPage({
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
        title="Productos"
        description="Productos digitales de la tienda (escalerade valor PINE)."
        badge={<Badge tone="leaf">{rows.length} productos</Badge>}
        actions={
          rows.length > 0 ? (
            <ExportCsvButton
              filename="productos"
              headers={['Título', 'Slug', 'Formato', 'Nivel', 'Precio', 'SKU']}
              rows={rows.map((p) => [p.title, p.slug, p.format ?? '', levelLabel[p.level], priceLabel(p), productSku(p)])}
            />
          ) : undefined
        }
      />

      <Card padded={false}>
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <AdminUrlFilters
            searchPlaceholder="Buscar producto…"
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
            <EmptyState icon={Package} title="No se encontraron productos" description="Pruebe a quitar los filtros." actionHref="/admin/productos" actionLabel="Ver todos" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60">
                <tr>
                  <Th>Producto</Th>
                  <Th>Formato</Th>
                  <Th>Nivel</Th>
                  <Th>Precio</Th>
                  <Th>SKU</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.map((p) => (
                  <tr key={p.slug} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                    <Td>
                      <Link href={`/admin/productos/${p.slug}`} className="block max-w-[400px]">
                        <span className="block truncate text-sm font-semibold text-slate-800 hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-400">{p.title}</span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{p.subtitle}</span>
                      </Link>
                    </Td>
                    <Td>
                      <Badge tone="slate">{p.format ? formatLabel[p.format] : '—'}</Badge>
                    </Td>
                    <Td>
                      <Badge tone={levelTones[p.level] ?? 'slate'}>{levelLabel[p.level]}</Badge>
                    </Td>
                    <Td>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {priceLabel(p)}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{productSku(p)}</span>
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
