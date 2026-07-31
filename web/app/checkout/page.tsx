'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CreditCard,
  Lock,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import { saveOrder } from '@/lib/supabase/inserts';
import { formatARS, formatPrice, usdToArsDisplay } from '@/lib/utils';

const isMpPublicConfigured = Boolean(
  process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
);

export default function CheckoutPage() {
  const { lines, subtotal, clear, hydrated } = useCart();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');

  const arsTotal = usdToArsDisplay(subtotal);

  async function handlePay(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!isMpPublicConfigured) {
      setStatus('loading');
      const id = `ES-${Date.now().toString(36).toUpperCase()}`;
      await saveOrder({
        email,
        customerName: name,
        items: lines.map((l) => ({ slug: l.product.slug, qty: l.qty, price: l.product.price })),
        subtotal,
        paymentMethod: 'mercadopago',
      });
      setOrderId(id);
      clear();
      setStatus('done');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          items: lines.map((l) => ({ slug: l.product.slug, qty: l.qty })),
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (res.status === 503) {
          setError(
            'La pasarela de pago todavía no está configurada. Prueba de nuevo en unos días o escríbenos por WhatsApp.'
          );
        } else {
          setError(data?.error ?? 'No se pudo iniciar el pago. Inténtalo de nuevo.');
        }
        setStatus('idle');
        return;
      }

      const data = (await res.json()) as { initPoint: string };
      window.location.href = data.initPoint;
    } catch {
      setError('Hubo un problema de conexión. Inténtalo de nuevo.');
      setStatus('idle');
    }
  }

  if (!hydrated) {
    return (
      <div className="container-page py-24 text-center text-slate-500">
        Cargando checkout…
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-leaf-100 text-leaf-700">
          <BadgeCheck className="h-9 w-9" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold text-slate-900">
          ¡Pedido registrado! (modo demostración)
        </h1>
        <p className="mt-2 font-mono text-sm text-brand-700">{orderId}</p>
        <p className="mt-6 max-w-md text-slate-600">
          La pasarela de Mercado Pago todavía no está conectada, así que este
          pedido quedó guardado como demo. En cuanto se configure, vas a poder
          pagar con tarjeta, transferencia o QR y recibir el acceso por email.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/descarga-gratuita" className="btn-secondary">
            Empezar con la checklist gratis
          </Link>
          <Link href="/tienda" className="btn-primary">
            Seguir explorando la tienda
          </Link>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-leaf-600 text-white shadow-lift">
          <ShoppingBag className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-2xl font-extrabold text-slate-900 sm:text-3xl">
          No hay productos para pagar
        </h1>
        <Link href="/tienda" className="btn-primary mt-8">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-14">
      <Link
        href="/carrito"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al carrito
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
        Checkout
      </h1>

      {!isMpPublicConfigured && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Modo demostración:</strong> la pasarela de Mercado Pago se
          está configurando. El pago se simula y no se cobra nada.
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <form onSubmit={handlePay} className="space-y-6 lg:col-span-2">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
            <h2 className="text-lg font-extrabold text-slate-900">
              Tus datos
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="checkout-name" className="label">
                  Nombre y apellido
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="checkout-email" className="label">
                  Email (donde recibes tus descargables)
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
            <h2 className="text-lg font-extrabold text-slate-900">
              Método de pago
            </h2>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-brand-500 bg-brand-50 p-4">
              <input
                type="radio"
                name="payment"
                value="mercadopago"
                checked
                readOnly
                className="mt-1 h-4 w-4 accent-brand-600"
              />
              <span>
                <span className="flex items-center gap-2 font-extrabold text-slate-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </span>
                  Mercado Pago
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Tarjeta de crédito o débito, transferencia y pagos QR
                  (Argentina). Vas a pagar en pesos argentinos en la web segura
                  de Mercado Pago.
                </span>
              </span>
            </label>
            <p className="mt-4 flex items-start gap-2 text-xs text-slate-500">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
              Pago 100% procesado por Mercado Pago. No guardamos datos de tu
              tarjeta.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              {error}
            </div>
          )}

          <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
            {status === 'loading'
              ? 'Redirigiendo a Mercado Pago…'
              : `Pagar con Mercado Pago`}
          </button>
        </form>

        <div className="h-fit rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card lg:sticky lg:top-24">
          <h2 className="text-lg font-extrabold text-slate-900">Tu pedido</h2>
          <ul className="mt-4 space-y-4">
            {lines.map(({ product, qty }) => (
              <li key={product.slug} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">{product.title}</p>
                  <p className="text-xs text-slate-500">
                    {qty} × {formatPrice(product.price, product.interval)}
                  </p>
                </div>
                <span className="font-semibold text-slate-900">
                  USD {(product.price * qty).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 text-base font-extrabold text-slate-900">
            <span>Total</span>
            <span>USD {subtotal.toFixed(2)}</span>
          </div>
          {arsTotal > 0 && (
            <p className="mt-1 text-right text-xs text-slate-500">
              ≈ {formatARS(arsTotal)} (referencial)
            </p>
          )}
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Todos los productos son digitales. La entrega se realiza por email
            tras confirmar el pago, con acceso único ligado a tus respuestas
            del Cuestionario Matriz PINE.
          </p>
        </div>
      </div>
    </div>
  );
}
