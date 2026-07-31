'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { isAuthPage } from '@/lib/auth/config';

/**
 * Envuelve el contenido público (Header, Footer, WhatsApp) y los oculta en las
 * páginas de autenticación, que tienen su propio layout de pantalla completa.
 */
export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const minimal = isAuthPage(pathname);

  return (
    <>
      {!minimal && <Header />}
      <main>{children}</main>
      {!minimal && <Footer />}
      {!minimal && <WhatsAppButton />}
    </>
  );
}
