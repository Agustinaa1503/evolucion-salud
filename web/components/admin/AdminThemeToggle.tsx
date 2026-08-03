'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const THEME_KEY = 'evolucion-admin-theme';

/**
 * Alterna el tema claro/oscuro del BackOffice. El tema se aplica como clase
 * `dark` sobre la raíz del admin (ancestro de los `dark:` de Tailwind), de modo
 * que el sitio público no se ve afectado. Persiste en localStorage.
 */
export default function AdminThemeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(THEME_KEY);
    const preferDark = saved === null
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : saved === 'dark';
    setDark(preferDark);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark, mounted]);

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 ${className}`}
    >
      {mounted && dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
    </button>
  );
}
