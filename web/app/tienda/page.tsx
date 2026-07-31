import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, ShoppingCart, TrendingUp } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/motion/Reveal';
import { products, levelLabel } from '@/lib/data/products';
import { img } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Tienda de guías y recursos PINE',
  description:
    'Guías descargables, meditaciones, protocolos y membresía PINE de Evolución Salud. Empezá gratis con la Checklist Matriz PINE.',
};

const ladder = [
  { step: '1', name: 'Gratis', text: 'Checklist Matriz PINE' },
  { step: '2', name: 'Entrada · USD 19', text: 'Guía Básica (caps. 1-4)' },
  { step: '3', name: 'Media · USD 49', text: 'Guía Premium + meditaciones' },
  { step: '4', name: 'Alta · USD 79', text: 'Bundle PINE completo' },
  { step: '5', name: 'B2B · USD 99+', text: 'Protocolo PsicoPINE' },
  { step: '6', name: 'Recurrente', text: 'Membresía Biblioteca PINE' },
];

export default function TiendaPage() {
  return (
    <>
      <PageHero
        eyebrow="Tienda de infoproductos"
        title={
          <>
            Herramientas PINE <span className="text-gradient">descargables</span>
          </>
        }
        description="Productos digitales con entrega inmediata: guías, meditaciones, plantillas y protocolos. Cada recurso te acerca al siguiente: empieza gratis y profundiza cuando estés listo."
        image={img.care}
      />

      <section className="container-page py-16 lg:py-24">
        <Reveal>
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
            <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-brand-700">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              Escalera de valor PINE
            </div>
            <ol className="mt-5 grid gap-3 sm:grid-cols-3">
              {ladder.map((l) => (
                <li
                  key={l.step}
                  className="flex items-start gap-3 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100/60 p-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-sm">
                    {l.step}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{l.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{l.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-700">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
              El checkout es una demo local. En producción se conecta con
              MercadoPago / Hotmart para el cobro y la entrega automática del
              PDF por email.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product, i) => (
            <Reveal key={product.slug} delay={(i % 3) * 0.07}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-leaf-800 p-8 text-white sm:p-10">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
              <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-leaf-400/20 blur-3xl" aria-hidden="true" />
              <div className="relative">
                <ShoppingCart className="h-9 w-9 text-leaf-100" aria-hidden="true" />
                <h2 className="mt-4 text-2xl font-extrabold">Carrito y checkout local</h2>
                <p className="mt-3 leading-relaxed text-leaf-50/90">
                  Agregá tus productos al carrito y probá el flujo completo de
                  compra: resumen, datos y método de pago. En producción, el pago
                  se procesa con MercadoPago o Hotmart y la entrega del PDF es
                  automática.
                </p>
                <Link href="/carrito" className="btn-dark mt-6">
                  Ir al carrito
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="h-full rounded-3xl border border-slate-200/80 bg-white p-8 shadow-card sm:p-10">
              <h2 className="text-2xl font-extrabold text-slate-900">
                ¿Cómo se entrega cada producto?
              </h2>
              <ol className="mt-5 space-y-4">
                {[
                  'Completás el checkout con tu email.',
                  'El pago se procesa con la pasarela elegida (demo: simulado).',
                  'Recibes el acceso único por email, ligado a tu correo y tu Cuestionario Matriz PINE (bloqueo de segundo uso).',
                ].map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-leaf-600 text-sm font-bold text-white shadow-sm">
                      {i + 1}
                    </span>
                    <p className="pt-1 text-sm leading-relaxed text-slate-700">{s}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                Nivel: {products.map((p) => levelLabel[p.level]).filter((v, i, a) => a.indexOf(v) === i).join(' · ')}
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
