import Image from 'next/image';
import { FileText, FolderOpen } from 'lucide-react';
import DownloadButton from '@/components/shop/DownloadButton';
import type { LicenseAccess } from '@/lib/shop/licenses';

function formatBytes(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatLabel(format: string): string {
  const labels: Record<string, string> = {
    ebook: 'Ebook',
    pdf: 'PDF',
    guia: 'Guía',
    checklist: 'Checklist',
    plantilla: 'Plantilla',
    audio: 'Audio',
    meditacion: 'Meditación',
    curso: 'Curso',
    podcast: 'Podcast',
    recurso: 'Recurso',
    workshop: 'Taller',
    'clase-en-vivo': 'Clase en vivo',
  };
  return labels[format] ?? format;
}

type LicenseCardProps = {
  access: LicenseAccess;
  token?: string;
};

/**
 * Tarjeta de acceso de una licencia: producto comprado + assets descargables
 * con URL firmada. Se usa en /acceso/[token] y en /mi-biblioteca.
 */
export default function LicenseCard({ access, token }: LicenseCardProps) {
  const { license, product, assets } = access;
  const downloaded = assets.filter((a) => a.signedUrl).length;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
      {product.banner ? (
        <div className="relative h-44 w-full">
          <Image
            src={product.banner}
            alt={`Portada de ${product.title}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-28 items-center justify-center bg-gradient-to-br from-brand-600 to-leaf-600">
          <FolderOpen className="h-10 w-10 text-white/80" aria-hidden="true" />
        </div>
      )}

      <div className="p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
            {formatLabel(product.format)}
          </span>
          <span className="text-xs text-slate-400">
            Acceso desde el {new Date(license.granted_at).toLocaleDateString('es-AR')}
          </span>
        </div>

        <h2 className="mt-3 text-xl font-extrabold text-slate-900 sm:text-2xl">
          {product.title}
        </h2>
        {product.description ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {product.description}
          </p>
        ) : null}

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Material para descargar
            </h3>
            {assets.length > 0 && downloaded > 0 ? (
              <span className="text-xs text-slate-400">
                {downloaded} {downloaded === 1 ? 'archivo listo' : 'archivos listos'}
              </span>
            ) : null}
          </div>

          {assets.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
              Tu material está en preparación. En breve estará disponible para
              descargar desde esta misma página.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {assets.map((asset) => (
                <li
                  key={asset.slug}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                      <FileText className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {asset.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {asset.file_name}
                        {asset.size_bytes > 0 ? ` · ${formatBytes(asset.size_bytes)}` : ''}
                      </p>
                    </div>
                  </div>
                  <DownloadButton
                    licenseId={license.id}
                    token={token}
                    productSlug={product.slug}
                    assetSlug={asset.slug}
                    fileName={asset.file_name}
                    signedUrl={asset.signedUrl}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}
