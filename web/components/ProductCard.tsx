import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import CardCover from './CardCover';
import AddToCartButton from './AddToCartButton';
import type { Product } from '@/lib/data/products';
import { formatPrice } from '@/lib/utils';

export default function ProductCard({ product }: { product: Product }) {
  const free = product.price === 0;

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card transition duration-500 hover:-translate-y-1.5 hover:shadow-lift">
      <Link href={`/tienda/${product.slug}`} aria-label={product.title} className="relative">
        <CardCover
          gradient={product.gradient}
          icon={product.icon}
          image={product.image}
          className="h-52"
        />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          {product.badge ? (
            <span className="inline-flex items-center rounded-full border border-white/30 bg-black/35 px-3 py-1 text-xs font-bold text-white backdrop-blur">
              {product.badge}
            </span>
          ) : null}
          {product.recommended ? (
            <span className="inline-flex items-center rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white shadow-lift">
              Recomendada
            </span>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-extrabold leading-snug tracking-tight text-slate-900 transition group-hover:text-brand-700">
          {product.title}
        </h3>
        <p className="mt-1 text-sm text-slate-600">{product.subtitle}</p>
        <div className="mt-3 flex items-baseline gap-2">
          <p className="text-2xl font-extrabold tracking-tight text-slate-900">
            {formatPrice(product.price, product.interval)}
          </p>
          {product.compareAt ? (
            <p className="text-sm font-medium text-slate-400 line-through">
              USD {product.compareAt.toFixed(2)}
            </p>
          ) : null}
        </div>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          {product.features.slice(0, 3).map((f) => (
            <li key={f} className="flex gap-2">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-brand-600"
                aria-hidden="true"
              />
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-center gap-3 pt-6">
          {free ? (
            <Link href="/descarga-gratuita" className="btn-primary flex-1">
              Descargar gratis
            </Link>
          ) : (
            <AddToCartButton slug={product.slug} className="flex-1" />
          )}
          <Link
            href={`/tienda/${product.slug}`}
            aria-label={`Ver detalles de ${product.title}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
