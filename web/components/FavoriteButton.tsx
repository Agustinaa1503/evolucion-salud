'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { toggleFavorite, getFavoriteSlugs } from '@/lib/lms/actions';

/**
 * Botón de favorito de un curso (FASE 8). Cliente: llama a la server action
 * `toggleFavorite`. Sin sesión redirige a /login con `next` de retorno.
 * En el montaje consulta `getFavoriteSlugs` para reflejar el estado real
 * (preserva el SSG de las páginas de curso).
 */
export default function FavoriteButton({
  courseSlug,
  initialFavorite = false,
  variant = 'light',
  className = '',
}: {
  courseSlug: string;
  initialFavorite?: boolean;
  /** 'light' para fondos oscuros (hero); 'card' para tarjetas blancas. */
  variant?: 'light' | 'card';
  className?: string;
}) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    getFavoriteSlugs().then((slugs) => {
      if (mounted) setFavorite(slugs.includes(courseSlug));
    });
    return () => {
      mounted = false;
    };
  }, [courseSlug]);

  function handleClick() {
    startTransition(async () => {
      const res = await toggleFavorite(courseSlug);
      if (!res.ok && res.authed === false) {
        router.push(`/login?next=/cursos/${courseSlug}`);
        return;
      }
      if (res.ok && res.favorite !== undefined) {
        setFavorite(res.favorite);
        router.refresh();
      }
    });
  }

  const idle =
    variant === 'card'
      ? 'border-slate-200/70 bg-white text-slate-700 shadow-sm hover:border-brand-300 hover:text-brand-600'
      : 'border-white/25 bg-white/10 text-white hover:border-brand-300 hover:text-brand-300';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={favorite}
      aria-label={favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={`group/star inline-flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur transition disabled:opacity-60 ${
        favorite
          ? 'border-brand-300 bg-brand-600 text-white shadow-lift'
          : idle
      } ${className}`}
    >
      <Heart
        className={`h-5 w-5 transition ${favorite ? 'fill-current' : ''} ${
          pending ? 'animate-pulse' : ''
        }`}
        aria-hidden="true"
      />
    </button>
  );
}
