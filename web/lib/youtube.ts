/**
 * Utilidades para URLs de YouTube (identificación y embed).
 */

/** Extrae el ID de video de una URL de YouTube en cualquiera de sus formatos. */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const normalized = url.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?[^#]*v=)([a-zA-Z0-9_-]{6,})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{6,})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{6,})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{6,})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{6,})/,
  ];
  for (const re of patterns) {
    const match = normalized.match(re);
    if (match?.[1]) return match[1];
  }
  return null;
}

/** URL de embed (iframe) para un ID de YouTube. */
export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube.com/embed/${id}`;
}
