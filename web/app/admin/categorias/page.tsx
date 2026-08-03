import type { Metadata } from 'next';
import { Tags } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { getCategoryGroupsWithCounts } from '@/lib/taxonomy/content';
import { getCategory } from '@/lib/taxonomy/categories';
import { PageHeader, Card, Badge, EmptyState, ButtonLink } from '@/components/admin/ui';
import AdminUrlFilters from '@/components/admin/AdminUrlFilters';

export const metadata: Metadata = { title: 'Categorías | BackOffice' };
export const dynamic = 'force-dynamic';

export default async function AdminCategoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminRole('admin.taxonomy.read');
  const params = await searchParams;
  const q = params.q?.trim().toLowerCase();

  const groups = getCategoryGroupsWithCounts();
  let filtered = groups;
  if (q) {
    filtered = groups
      .map((g) => ({
        ...g,
        items: g.items.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || (getCategory(c.slug)?.description ?? '').toLowerCase().includes(q)),
      }))
      .filter((g) => g.items.length > 0);
  }

  const totalCategories = groups.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorías"
        description="Catálogo fijo de la taxonomía unificada (37 categorías en 8 grupos). Las categorías se definen en lib/taxonomy/categories.ts y clasifican cursos, blog, podcast y recursos."
        badge={<Badge tone="leaf">{totalCategories} categorías</Badge>}
      />

      <Card padded={false}>
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <AdminUrlFilters searchPlaceholder="Buscar categoría…" />
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={Tags} title="No se encontraron categorías" description="Pruebe a quitar el filtro." actionHref="/admin/categorias" actionLabel="Ver todas" />
          </div>
        ) : (
          <div className="grid gap-6 p-5 lg:grid-cols-2">
            {filtered.map((group) => (
              <div key={group.group}>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {group.group}
                </h3>
                <ul className="space-y-2">
                  {group.items.map((c) => (
                    <li
                      key={c.slug}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{c.name}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{getCategory(c.slug)?.description}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge tone="slate">{c.slug}</Badge>
                        <Badge tone="brand">{c.count} ítems</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ButtonLink href="/admin/dashboard">← Volver al Dashboard</ButtonLink>
    </div>
  );
}
