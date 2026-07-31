import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Download,
  Lock,
  Sparkles,
} from 'lucide-react';
import { getProduct, products } from '@/lib/data/products';
import AddToCartButton from '@/components/AddToCartButton';
import Disclaimer from '@/components/Disclaimer';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/motion/Reveal';
import { formatPrice } from '@/lib/utils';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  return {
    title: product.title,
    description: product.subtitle,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) notFound();

  const free = product.price === 0;
  const others = products.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden bg-ink-950 pb-16 pt-14">
        <div className="absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-leaf-500/20 blur-3xl" aria-hidden="true" />
        <div className="container-page relative">
          <Link
            href="/tienda"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a la tienda
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start">
            <div className="group relative h-72 overflow-hidden rounded-3xl border border-white/10 shadow-lift lg:h-96">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image}
                  alt={product.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
              ) : (
                <div className={`flex h-full items-center justify-center bg-gradient-to-br ${product.gradient}`}>
                  <span className="text-7xl">🌿</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" aria-hidden="true" />
              {product.badge ? (
                <span className="absolute bottom-4 left-4 inline-flex items-center rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-800 backdrop-blur">
                  {product.badge}
                </span>
              ) : null}
              {product.recommended ? (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-500 to-clay-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Más elegida
                </span>
              ) : null}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                {product.title}
              </h1>
              <p className="mt-3 text-lg font-semibold text-brand-200">
                {product.subtitle}
              </p>

              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-white">
                  {formatPrice(product.price, product.interval)}
                </span>
                {product.compareAt ? (
                  <span className="text-lg font-medium text-slate-400 line-through">
                    USD {product.compareAt.toFixed(2)}
                  </span>
                ) : null}
              </div>

              <p className="mt-5 leading-relaxed text-slate-300">
                {product.description}
              </p>

              <div className="mt-8">
                {free ? (
                  <Link href="/descarga-gratuita" className="btn-primary w-full sm:w-auto">
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Descargar gratis
                  </Link>
                ) : (
                  <AddToCartButton
                    slug={product.slug}
                    label={
                      product.interval === 'monthly'
                        ? 'Suscribirme'
                        : 'Agregar al carrito'
                    }
                    className="w-full sm:w-auto"
                  />
                )}
                <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  Entrega por email con acceso único (demo: checkout simulado).
                </p>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <h2 className="text-sm font-extrabold uppercase tracking-wide text-white">
                    Beneficios
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {product.features.map((f) => (
                      <li key={f} className="flex gap-2 text-sm text-slate-300">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <h2 className="text-sm font-extrabold uppercase tracking-wide text-white">
                    ¿Qué incluye?
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {product.includes.map((f) => (
                      <li key={f} className="flex gap-2 text-sm text-slate-300">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" aria-hidden="true" />
                <p className="text-sm text-slate-300">
                  Pagás con <strong className="text-white">MercadoPago</strong>{' '}
                  o <strong className="text-white">Hotmart</strong> (integración
                  lista en producción). Mientras tanto, el checkout funciona
                  como demo local para probar el flujo completo.
                </p>
              </div>

              <Disclaimer className="mt-6" />
            </div>
          </div>
        </div>
      </section>

      {others.length > 0 ? (
        <section className="container-page py-16 lg:py-24">
          <h2 className="text-2xl font-extrabold text-slate-900">
            Seguí avanzando en tu proceso
          </h2>
          <p className="mt-2 text-slate-600">
            Cada recurso de la escalera PINE te prepara para el siguiente.
          </p>
          <div className="mt-8 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {others.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.07}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
