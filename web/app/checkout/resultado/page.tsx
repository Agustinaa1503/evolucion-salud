'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Clock3,
  Loader2,
} from 'lucide-react';

type OrderStatus = { status: 'paid' | 'pending' | 'failed' };

function useOrderStatus(externalReference: string | null) {
  const [order, setOrder] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (!externalReference) return;
    let active = true;
    let attempts = 0;
    const maxAttempts = 15;

    const tick = async () => {
      if (!active || attempts >= maxAttempts) return;
      attempts += 1;
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(externalReference)}`);
        if (!active) return;
        if (!res.ok) {
          setTimeout(tick, 3000);
          return;
        }
        const data = (await res.json()) as OrderStatus;
        if (!active) return;
        setOrder(data);
        if (data.status === 'pending') {
          setTimeout(tick, 3000);
        }
      } catch {
        setTimeout(tick, 3000);
      }
    };

    tick();
    return () => {
      active = false;
    };
  }, [externalReference]);

  return order;
}

function Resultado() {
  const params = useSearchParams();
  const estado = params.get('estado') ?? 'failure';
  const externalReference = params.get('external_reference');
  const order = useOrderStatus(externalReference);

  const paid = order?.status === 'paid';
  const failed = order?.status === 'failed';
  const waiting = estado === 'pending' || order?.status === 'pending';

  if (waiting) {
    return (
      <Shell>
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <Clock3 className="h-9 w-9" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          Estamos confirmando tu pago
        </h1>
        <p className="mt-2 flex items-center justify-center gap-2 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Esperá unos segundos mientras verificamos el pago…
        </p>
        {externalReference && (
          <p className="mt-4 font-mono text-xs text-slate-400">
            Orden {externalReference}
          </p>
        )}
      </Shell>
    );
  }

  if (paid) {
    return (
      <Shell>
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-leaf-100 text-leaf-700">
          <BadgeCheck className="h-9 w-9" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          ¡Pago aprobado!
        </h1>
        <p className="mt-3 max-w-md text-slate-600">
          Vas a recibir por email el enlace único a tus descargables. También
          podés acceder en cualquier momento desde tu biblioteca personal.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/mi-biblioteca" className="btn-primary">
            Ir a mi biblioteca
          </Link>
          <Link href="/tienda" className="btn-secondary">
            Seguir explorando la tienda
          </Link>
        </div>
      </Shell>
    );
  }

  if (failed) {
    return (
      <Shell>
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <AlertTriangle className="h-9 w-9" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          No se completó el pago
        </h1>
        <p className="mt-3 max-w-md text-slate-600">
          El pago no pudo procesarse. No te cobramos nada. Podés reintentarlo o
          elegir otro medio de pago desde Mercado Pago.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/carrito" className="btn-primary">
            Reintentar el pago
          </Link>
          <Link href="/tienda" className="btn-secondary">
            Volver a la tienda
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <AlertTriangle className="h-9 w-9" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-3xl font-bold text-slate-900">
        No encontramos tu pedido
      </h1>
      <p className="mt-3 max-w-md text-slate-600">
        Parece que el enlace llegó incompleto. Revisá el email de Mercado Pago o
        volvé a intentar desde el carrito.
      </p>
      <Link href="/carrito" className="btn-primary mt-8">
        Ir al carrito
      </Link>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al inicio
      </Link>
      {children}
    </div>
  );
}

export default function ResultadoPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page flex min-h-[70vh] items-center justify-center py-24 text-center text-slate-500">
          Cargando resultado…
        </div>
      }
    >
      <Resultado />
    </Suspense>
  );
}
