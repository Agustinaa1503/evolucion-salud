'use client';

import { useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { logAssetDownload } from '@/lib/shop/actions';

type DownloadButtonProps = {
  licenseId?: string;
  token?: string;
  productSlug: string;
  assetSlug: string;
  fileName: string;
  signedUrl?: string;
  label?: string;
};

/**
 * Botón de descarga de un asset de la biblioteca digital.
 * Abre la URL firmada (generada por el servidor) y registra la descarga en
 * `asset_downloads` vía server action (fire-and-forget; nunca bloquea).
 */
export default function DownloadButton({
  licenseId,
  token,
  productSlug,
  assetSlug,
  fileName,
  signedUrl,
  label = 'Descargar',
}: DownloadButtonProps) {
  const [downloaded, setDownloaded] = useState(false);
  const logged = useRef(false);

  const handleClick = () => {
    if (downloaded) return;
    setDownloaded(true);
    if (signedUrl) {
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    }
    if (logged.current) return;
    logged.current = true;
    void logAssetDownload({
      licenseId,
      token,
      productSlug,
      assetSlug,
      fileName,
    }).catch(() => null);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!signedUrl}
      className="btn-primary inline-flex items-center gap-2"
      aria-label={`Descargar ${fileName}`}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      {downloaded ? 'Descargado' : label}
    </button>
  );
}

