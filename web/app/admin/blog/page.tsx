import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Clock } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { blogPosts } from '@/lib/data/blog';
import { formatDate } from '@/lib/admin/format';
import { PageHeader, Card, Badge, Th, Td, EmptyState, ButtonLink } from '@/components/admin/ui';
import AdminUrlFilters from '@/components/admin/AdminUrlFilters';
import AdminPagination from '@/components/admin/AdminPagination';
import ExportCsvButton from '@/components/admin/ExportCsvButton';

export const metadata: Metadata = { title: 'Blog | BackOffice' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  await requireAdminRole('admin.blog.read');
  const params = await searchParams;
  const q = params.q?.trim().toLowerCase();
  const category = params.category;

  const categories = Array.from(new Set(blogPosts.map((p) => p.category))).sort();

  let posts = blogPosts;
  if (q) {
    posts = posts.filter(
      (p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
    );
  }
  if (category) posts = posts.filter((p) => p.category === category);

  const page = Math.max(1, Number(params.page) || 1);
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = posts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog"
        description="Artículos divulgativos publicados en el sitio."
        badge={<Badge tone="leaf">{posts.length} artículos</Badge>}
        actions={
          posts.length > 0 ? (
            <ExportCsvButton
              filename="blog"
              headers={['Título', 'Slug', 'Categoría', 'Fecha', 'Lectura']}
              rows={posts.map((p) => [p.title, p.slug, p.category, p.date, p.readTime])}
            />
          ) : undefined
        }
      />

      <Card padded={false}>
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <AdminUrlFilters
            searchPlaceholder="Buscar artículo…"
            selects={[{ name: 'category', label: 'Categoría', options: categories.map((c) => ({ value: c, label: c })) }]}
          />
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={FileText} title="No se encontraron artículos" description="Pruebe a quitar los filtros." actionHref="/admin/blog" actionLabel="Ver todos" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60">
                <tr>
                  <Th>Artículo</Th>
                  <Th>Categoría</Th>
                  <Th>Tags</Th>
                  <Th>Fecha</Th>
                  <Th>Lectura</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((p) => (
                  <tr key={p.slug} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                    <Td>
                      <Link href={`/blog/${p.slug}`} className="block max-w-[420px]">
                        <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{p.title}</span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{p.excerpt}</span>
                      </Link>
                    </Td>
                    <Td>
                      <Badge tone="brand">{p.category}</Badge>
                    </Td>
                    <Td>
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        {(p.tags ?? []).slice(0, 3).map((t) => (
                          <Badge key={t} tone="slate">{t}</Badge>
                        ))}
                        {(p.tags ?? []).length > 3 ? <Badge tone="slate">+{(p.tags ?? []).length - 3}</Badge> : null}
                      </div>
                    </Td>
                    <Td>
                      <span className="text-sm text-slate-600 dark:text-slate-300">{formatDate(p.date)}</span>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {p.readTime}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPagination page={safePage} totalPages={totalPages} total={posts.length} pageSize={PAGE_SIZE} />
      </Card>

      <ButtonLink href="/admin/dashboard">← Volver al Dashboard</ButtonLink>
    </div>
  );
}
