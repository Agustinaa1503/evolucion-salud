import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, Package, UploadCloud } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { hasPermission } from '@/lib/admin/rbac';
import { getAuthSession } from '@/lib/auth/session';
import { formatDate } from '@/lib/admin/format';
import { PageHeader, Card, Badge, EmptyState, ButtonLink } from '@/components/admin/ui';
import AssetUploader from '@/components/admin/AssetUploader';
import { getProductBySlug } from '@/lib/products/catalog';
import { getProductAssets } from '@/lib/products/assets';
import { mergeAssetWithDb, type AssetMergeState } from '@/lib/products/asset-meta';
import { assetTypeLabel, formatLabel } from '@/lib/products/types';
import { productSku, priceLabel } from '@/lib/products/pricing';

export const metadata: Metadata = { title: 'Producto | BackOffice' };
export const dynamic = 'force-dynamic';

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminRole('admin.resources.read');
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const session = await getAuthSession();
  const canWrite = hasPermission(session.profile?.rol, 'admin.resources.write');

  const dbRows = await getProductAssets(slug);
  const bySlug = new Map(dbRows.map((r) => [r.asset_slug, r]));
  const mdAssets = product.assets ?? [];

  const merged: AssetMergeState[] = mdAssets.map((a) =>
    mergeAssetWithDb(a, bySlug.get(a.slug) ?? null)
  );

  const missingInDb = mdAssets.filter((a) => !bySlug.has(a.slug));
  const orphansInDb = dbRows.filter((r) => !mdAssets.some((a) => a.slug === r.asset_slug));

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.title}
        description={`${product.subtitle} · ${formatLabel[product.format ?? 'recurso']}`}
        badge={
          <span className="flex gap-2">
            <Badge tone="brand">{priceLabel(product)}</Badge>
            <Badge tone="slate">{productSku(product)}</Badge>
          </span>
        }
        actions={<ButtonLink href="/admin/productos">← Productos</ButtonLink>}
      />

      {(missingInDb.length > 0 || orphansInDb.length > 0) && (
        <div className="rounded-2xl border border-sun-300 bg-sun-50 px-5 py-4 text-sm text-sun-800 dark:border-sun-800 dark:bg-sun-950 dark:text-sun-300">
          <p className="font-bold">Sincronización pendiente</p>
          <p className="mt-1">
            {missingInDb.length > 0
              ? `${missingInDb.length} asset(s) declarados en el Markdown todavía no están en product_assets. `
              : ''}
            {orphansInDb.length > 0
              ? `${orphansInDb.length} fila(s) en la BD ya no están declaradas en el Markdown. `
              : ''}
            Ejecute <code className="rounded bg-sun-100 px-1.5 py-0.5 font-mono text-xs dark:bg-sun-900">npm run db:sync-products</code> para
            sincronizar.
          </p>
        </div>
      )}

      <Card
        title="Assets descargables"
        subtitle={`${merged.length} archivo(s) declarado(s). Los archivos se entregan por URL firmada (SUBFASE 12.5).`}
        padded={false}
      >
        {merged.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={UploadCloud}
              title="Este producto no declara assets"
              description="Agregue el bloque `assets:` en el front matter del Markdown y ejecute npm run db:sync-products."
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {merged.map((asset) => (
              <li key={asset.assetSlug} className="p-4">
                <AssetUploader productSlug={slug} asset={asset} canWrite={canWrite} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Detalle del producto" subtitle="Fuente de verdad: Contenido/product/*.md" padded={false}>
        <div className="grid gap-0 md:grid-cols-2">
          <div className="p-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <dt className="text-slate-500 dark:text-slate-400">Slug</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-100">{product.slug}</dd>
              <dt className="text-slate-500 dark:text-slate-400">Formato</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-100">{formatLabel[product.format ?? 'recurso']}</dd>
              <dt className="text-slate-500 dark:text-slate-400">Tipo comercial</dt>
              <dd className="font-semibold capitalize text-slate-800 dark:text-slate-100">{product.productType}</dd>
              <dt className="text-slate-500 dark:text-slate-400">Nivel</dt>
              <dd className="font-semibold capitalize text-slate-800 dark:text-slate-100">{product.level}</dd>
            </dl>
          </div>
          <div className="p-5 md:border-l md:border-slate-100 dark:md:border-slate-800">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <dt className="text-slate-500 dark:text-slate-400">Autor/a</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-100">{product.author ?? '—'}</dd>
              <dt className="text-slate-500 dark:text-slate-400">Duración</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-100">{product.duration ?? '—'}</dd>
              <dt className="text-slate-500 dark:text-slate-400">Moneda</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-100">{product.currency ?? 'USD'}</dd>
              <dt className="text-slate-500 dark:text-slate-400">SKU</dt>
              <dd className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">{productSku(product)}</dd>
              <dt className="text-slate-500 dark:text-slate-400">Tipos de asset</dt>
              <dd className="flex flex-wrap gap-1">
                {Array.from(new Set(merged.map((a) => assetTypeLabel[a.type]))).map((t) => (
                  <Badge key={t} tone="slate">{t}</Badge>
                ))}
              </dd>
            </dl>
          </div>
        </div>
        <div className="border-t border-slate-100 p-5 text-xs text-slate-400 dark:border-slate-800">
          <Package className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
          Última actualización en la BD: {formatDate(dbRows[0]?.updated_at ?? null)} · El catálogo se regenera con{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] dark:bg-slate-800">npm run db:sync-content</code>
          <ArrowLeft className="ml-2 mr-1 inline h-3 w-3" aria-hidden="true" />
          Ver en tienda: <a href={`/tienda/${product.slug}`} className="text-brand-600 hover:underline dark:text-brand-400">/tienda/{product.slug}</a>
        </div>
      </Card>
    </div>
  );
}
