import type { Metadata } from 'next';
import { CreditCard, DollarSign, FileLock, Package } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { adminDb, countWhere } from '@/lib/admin/data';
import { hasPermission } from '@/lib/admin/rbac';
import { formatDate, timeAgo, formatCompact, formatNumber, paginate, parsePage } from '@/lib/admin/format';
import { PageHeader, Card, StatCard, Badge, Th, Td, EmptyState } from '@/components/admin/ui';
import AdminUrlFilters from '@/components/admin/AdminUrlFilters';
import AdminPagination from '@/components/admin/AdminPagination';
import ExportCsvButton from '@/components/admin/ExportCsvButton';
import AdminLicenseRevoke from '@/components/admin/AdminLicenseRevoke';
import { getProduct } from '@/lib/data/products';

export const metadata: Metadata = { title: 'Pedidos | BackOffice' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

const ORDER_STATUS: Record<string, { label: string; tone: 'brand' | 'leaf' | 'clay' | 'sun' | 'slate' }> = {
  paid: { label: 'Pagado', tone: 'leaf' },
  pending: { label: 'Pendiente', tone: 'clay' },
  failed: { label: 'Fallido', tone: 'slate' },
};

type OrderRow = {
  id: string;
  email: string;
  customer_name: string | null;
  items: unknown;
  subtotal: number;
  status: string;
  mp_status: string | null;
  currency: string;
  paid_at: string | null;
  created_at: string;
};

type LicenseRow = {
  id: string;
  order_id: string;
  product_slug: string;
  product_title: string;
  status: string;
  granted_at: string;
  last_downloaded_at: string | null;
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const session = await requireAdminRole('admin.orders.read');
  const canWrite = hasPermission(session.profile?.rol, 'admin.orders.write');
  const params = await searchParams;
  const status = params.status;
  const q = params.q?.trim();

  const sb = adminDb();

  const [total, paidCount, activeLicenses] = await Promise.all([
    countWhere(sb, 'orders'),
    countWhere(sb, 'orders', 'status', 'paid'),
    countWhere(sb, 'licenses', 'status', 'active'),
  ]);

  const { data: revenueData } = sb
    ? await sb.from('orders').select('subtotal').eq('status', 'paid')
    : { data: null };
  const revenue = (revenueData ?? []).reduce((acc, o) => acc + Number(o.subtotal ?? 0), 0);

  let query = sb
    ? sb.from('orders').select('*', { count: 'exact' })
    : null;
  if (query) {
    if (status) query = query.eq('status', status);
    if (q) query = query.or(`email.ilike.%${q}%,customer_name.ilike.%${q}%`);
    query = query.order('created_at', { ascending: false });
  }
  const { data: orders, count } = (await query) ?? { data: [], count: 0 };

  const orderRows = (orders ?? []) as OrderRow[];
  const orderIds = orderRows.map((o) => o.id);

  const { data: licenseRows } =
    orderIds.length > 0 && sb
      ? await sb.from('licenses').select('*').in('order_id', orderIds).order('granted_at')
      : { data: null };
  const licenses = (licenseRows ?? []) as LicenseRow[];
  const licensesByOrder = new Map<string, LicenseRow[]>();
  for (const lic of licenses) {
    const list = licensesByOrder.get(lic.order_id) ?? [];
    list.push(lic);
    licensesByOrder.set(lic.order_id, list);
  }

  const page = parsePage(params.page);
  const paged = paginate(orderRows, page, PAGE_SIZE);
  const pageRows = paged.items;

  const productTitles = (items: unknown): string[] =>
    (Array.isArray(items) ? items : [])
      .map((it) => {
        const slug = (it as { slug?: string })?.slug ?? '';
        const product = getProduct(slug);
        return product ? product.title : slug;
      })
      .filter(Boolean);

  const exportRows = pageRows.map((o) => [
    formatDate(o.created_at),
    o.email,
    o.customer_name ?? '',
    productTitles(o.items).join(' + '),
    `USD ${formatNumber(Number(o.subtotal))}`,
    o.status,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        description="Órdenes, pagos y licencias. La entrega de productos es automática al acreditarse el pago."
        badge={<Badge tone="brand">{formatCompact(count ?? 0)} pedidos</Badge>}
        actions={
          sb && pageRows.length > 0 ? (
            <ExportCsvButton
              filename="pedidos"
              headers={['Fecha', 'Email', 'Cliente', 'Productos', 'Total', 'Estado']}
              rows={exportRows}
            />
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Ingresos (USD)" value={`$${formatNumber(revenue)}`} icon={DollarSign} tone="leaf" />
        <StatCard label="Pedidos pagados" value={formatCompact(paidCount)} icon={CreditCard} tone="brand" />
        <StatCard label="Licencias activas" value={formatCompact(activeLicenses)} icon={FileLock} tone="sun" />
        <StatCard label="Pedidos totales" value={formatCompact(total)} icon={Package} tone="clay" />
      </div>

      <Card padded={false}>
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <AdminUrlFilters
            searchPlaceholder="Buscar por email o cliente…"
            selects={[
              {
                name: 'status',
                label: 'Estado',
                options: [
                  { value: 'paid', label: 'Pagado' },
                  { value: 'pending', label: 'Pendiente' },
                  { value: 'failed', label: 'Fallido' },
                ],
              },
            ]}
          />
        </div>

        {pageRows.length === 0 ? (
          <EmptyState
            title="Sin pedidos"
            description="Todavía no hay órdenes con estos filtros."
            actionHref="/admin/dashboard"
            actionLabel="Volver al dashboard"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
                <tr>
                  <Th>Fecha</Th>
                  <Th>Cliente</Th>
                  <Th>Productos</Th>
                  <Th>Total</Th>
                  <Th>Estado</Th>
                  <Th>Licencias</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pageRows.map((o) => {
                  const meta = ORDER_STATUS[o.status] ?? ORDER_STATUS.failed;
                  const orderLicenses = licensesByOrder.get(o.id) ?? [];
                  return (
                    <tr key={o.id} className="align-top hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                      <Td className="whitespace-nowrap">
                        <p className="font-semibold text-slate-800">{formatDate(o.created_at)}</p>
                        <p className="text-xs text-slate-400">{timeAgo(o.created_at)}</p>
                      </Td>
                      <Td>
                        <p className="font-semibold text-slate-800">{o.email}</p>
                        {o.customer_name ? (
                          <p className="text-xs text-slate-500">{o.customer_name}</p>
                        ) : null}
                        <p className="mt-0.5 font-mono text-[10px] text-slate-400">{o.id.slice(0, 8)}</p>
                      </Td>
                      <Td className="max-w-[220px]">
                        <p className="text-slate-700">{productTitles(o.items).join(', ') || '—'}</p>
                        {o.mp_status ? (
                          <p className="mt-0.5 text-xs text-slate-400">MP: {o.mp_status}</p>
                        ) : null}
                      </Td>
                      <Td className="whitespace-nowrap font-semibold text-slate-800">
                        USD {formatNumber(Number(o.subtotal))}
                      </Td>
                      <Td>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </Td>
                      <Td className="min-w-[180px]">
                        {orderLicenses.length === 0 ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <ul className="space-y-2">
                            {orderLicenses.map((lic) => (
                              <li key={lic.id} className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-slate-700">{lic.product_title}</span>
                                <Badge tone={lic.status === 'active' ? 'leaf' : 'slate'}>
                                  {lic.status === 'active' ? 'activa' : 'revocada'}
                                </Badge>
                                {lic.status === 'active' ? (
                                  <AdminLicenseRevoke licenseId={lic.id} productTitle={lic.product_title} canWrite={canWrite} />
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {paged.totalPages > 1 && (
        <div className="flex justify-center">
          <AdminPagination page={page} totalPages={paged.totalPages} total={paged.total} pageSize={PAGE_SIZE} />
        </div>
      )}
    </div>
  );
}
