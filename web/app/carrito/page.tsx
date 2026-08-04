'use client';

import Link from 'next/link';
import { ArrowRight, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import CardCover from '@/components/CardCover';
import { formatPrice } from '@/lib/utils';

export default function CarritoPage() {
  const { lines, count, subtotal, setQty, remove, clear, hydrated } = useCart();

  if (!hydrated) {
    return (
      <div className="container-page py-24 text-center text-slate-500">
        Cargando tu carrito…
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-leaf-600 text-white shadow-lift">
          <ShoppingCart className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Tu carrito está vacío
        </h1>
        <p className="mt-3 max-w-md text-slate-600">
          Explora la tienda y empieza por el recurso que mejor se adapte a tu
          momento.
        </p>
        <Link href="/tienda" className="btn-primary mt-8">
          Ver la tienda
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-14">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        Tu carrito <span className="text-slate-400">({count})</span>
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {lines.map(({ product, qty }) => (
            <div
              key={product.slug}
              className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-card transition hover:shadow-lift sm:flex-row sm:items-center"
            >
              <Link
                href={`/tienda/${product.slug}`}
                className="shrink-0"
                aria-label={product.title}
              >
                <CardCover
                  gradient={product.gradient}
                  icon={product.icon}
                  image={product.image}
                  className="h-24 w-full rounded-xl sm:w-28"
                />
              </Link>
              <div className="flex-1">
                <Link
                  href={`/tienda/${product.slug}`}
                  className="font-extrabold text-slate-900 hover:text-brand-700"
                >
                  {product.title}
                </Link>
                <p className="mt-0.5 text-sm text-slate-500">{product.subtitle}</p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {formatPrice(product.price, product.interval)}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQty(product.slug, qty - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                    aria-label={`Quitar uno de ${product.title}`}
                  >
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-slate-900">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(product.slug, qty + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                    aria-label={`Agregar uno a ${product.title}`}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(product.slug)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-rose-600 transition hover:text-rose-700"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Quitar
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={clear}
            className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
          >
            Vaciar carrito
          </button>
        </div>

        <div className="h-fit rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card lg:sticky lg:top-24">
          <h2 className="text-lg font-extrabold text-slate-900">Resumen</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <dt>Subtotal</dt>
              <dd className="font-semibold text-slate-900">
                USD {subtotal.toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>Productos digitales</dt>
              <dd>Entrega por email</dd>
            </div>
          </dl>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex justify-between text-base font-extrabold text-slate-900">
              <span>Total</span>
              <span>USD {subtotal.toFixed(2)}</span>
            </div>
          </div>
          <Link href="/checkout" className="btn-primary mt-5 w-full">
            Finalizar compra
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="mt-3 text-center text-xs text-slate-500">
            Demo local. En producción el pago se procesa con MercadoPago.
          </p>
        </div>
      </div>
    </div>
  );
}
