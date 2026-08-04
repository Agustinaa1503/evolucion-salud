/**
 * Podcast de Evolución Salud (puente).
 *
 * Los episodios viven en `Contenido/podcast/` (motor unificado FASE 12) y su
 * copia compilada en `generated/podcast.ts`. Este módulo arma el objeto `podcast` que
 * consumen las páginas: la configuración del canal (título, descripción y
 * URLs de búsqueda) es configuración del sitio, no contenido, por eso se
 * mantiene acá.
 */
import { episodes } from './generated/podcast';
import type { Episode } from '@/lib/content/types';

const spotifySearch =
  'https://open.spotify.com/search/Evoluci%C3%B3n%20Salud';

export const podcast = {
  title: 'Podcast Evolución Salud',
  description:
    'Prácticas guiadas de Mindfulness y Meditaciones PINE de Evolución Salud, para escuchar en Spotify.',
  spotifyUrl: spotifySearch,
  episodes,
};

export type { Episode };
