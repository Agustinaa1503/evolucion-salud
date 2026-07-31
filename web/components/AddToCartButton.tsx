'use client';

import { useState } from 'react';
import { Check, ShoppingCart } from 'lucide-react';
import { useCart } from './CartProvider';

type Props = {
  slug: string;
  label?: string;
  full?: boolean;
  className?: string;
};

export default function AddToCartButton({
  slug,
  label = 'Agregar al carrito',
  full = true,
  className = '',
}: Props) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        add(slug);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 2000);
      }}
      className={
        full
          ? `btn-primary w-full ${className}`
          : `btn-primary ${className}`
      }
    >
      {added ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
      )}
      {added ? 'Agregado' : label}
    </button>
  );
}
