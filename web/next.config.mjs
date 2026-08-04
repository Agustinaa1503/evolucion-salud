/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // NOTA Windows/OneDrive: si el build/dev falla con
  // "EINVAL: invalid argument, readlink ... .next" es porque OneDrive convirtió
  // archivos de .next en "reparse points" (files-on-demand). Solución: anclar
  // la carpeta localmente → attrib +P "web\.next" /S (se documenta en AGENT.md).
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/admin/recursos',
        destination: '/admin/productos',
        permanent: true,
      },
      {
        source: '/admin/recursos/:slug',
        destination: '/admin/productos/:slug',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
