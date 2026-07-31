import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import PublicShell from '@/components/PublicShell';
import JsonLd from '@/components/JsonLd';
import { CartProvider } from '@/components/CartProvider';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { site, socialLinks } from '@/lib/data/site';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.domain),
  title: {
    default: `${site.name} | ${site.positioning}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    'PINE',
    'Psicoinmunoneuroendocrinología',
    'Evolución Salud',
    'estrés prequirúrgico',
    'carga alostática',
    'cronobiología',
    'melatonina',
    'cirugía despierta',
    'mapeo cortical',
    'preparación para una cirugía',
  ],
  openGraph: {
    title: `${site.name} | ${site.positioning}`,
    description: site.description,
    url: site.domain,
    siteName: site.name,
    locale: 'es_AR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationJsonLd: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.name,
  url: site.domain,
  email: site.email,
  slogan: site.tagline,
  description: site.description,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Córdoba',
    addressCountry: 'AR',
  },
  sameAs: socialLinks.map((s) => s.url),
};

const webSiteJsonLd: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: site.name,
  url: site.domain,
  inLanguage: 'es-AR',
  description: site.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR" className={manrope.variable}>
      <body>
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={webSiteJsonLd} />
        <AuthProvider>
          <CartProvider>
            <PublicShell>{children}</PublicShell>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
