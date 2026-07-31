'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { reportVideoProgress } from '@/lib/lms/actions';
import { extractYouTubeId, youtubeEmbedUrl } from '@/lib/youtube';

/* eslint-disable @typescript-eslint/no-explicit-any */
type YTPlayer = any;
type YTState = any;

declare global {
  interface Window {
    YT?: { Player: new (id: string | HTMLElement, options: Record<string, any>) => any };
    onYouTubeIframeAPIReady?: () => void;
  }
}

/**
 * Carga la API del reproductor de YouTube una sola vez y devuelve una promesa
 * que se resuelve cuando `YT.Player` está disponible.
 */
function loadYouTubeApi(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return;
    if (window.YT && window.YT.Player) return resolve();

    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (existing) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    document.head.appendChild(tag);
  });
}

const REPORT_EVERY_MS = 5000;
const ENDED = 0;
const PLAYING = 1;
const PAUSED = 2;
const CUED = 5;

type Props = {
  courseSlug: string;
  lessonKey: string;
  videoUrl: string;
  /** Si el usuario no está autenticado, no se reporta progreso. */
  enabled: boolean;
  /** Se llama cuando el video termina (para marcar la lección). */
  onCompleted?: () => void;
};

/**
 * Reproductor de YouTube que reporta el avance de reproducción a Supabase
 * vía la server action `reportVideoProgress` (intervalo de 5 s y fin de video).
 */
export default function CoursePlayer({ courseSlug, lessonKey, videoUrl, enabled, onCompleted }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const apiReadyRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const videoId = extractYouTubeId(videoUrl);

  useEffect(() => {
    if (!videoId) {
      setError('No se pudo reconocer el enlace del video.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    let tickTimer: ReturnType<typeof setInterval> | null = null;

    async function init() {
      try {
        await loadYouTubeApi();
        if (cancelled || !containerRef.current) return;
        apiReadyRef.current = true;

        const player = new window.YT!.Player(containerRef.current, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            rel: 0,
            playsinline: 1,
            modestbranding: 1,
          },
          events: {
            onReady: (e: { target: YTPlayer }) => {
              playerRef.current = e.target;
              setLoading(false);
            },
            onStateChange: (e: { data: YTState }) => {
              const { data } = e;
              if (data === PLAYING) {
                startTick();
              } else if (data === PAUSED) {
                stopTick();
              } else if (data === ENDED) {
                stopTick();
                report();
                onCompleted?.();
              } else if (data === CUED && playerRef.current) {
                setLoading(false);
              }
            },
            onError: () => {
              setError('El video no está disponible. Puede intentar abrirlo en YouTube.');
              setLoading(false);
            },
          },
        });

        function report() {
          if (!enabled || !playerRef.current) return;
          const t = playerRef.current;
          let current = 0;
          let duration: number | null = null;
          try {
            current = Math.floor(t.getCurrentTime?.() ?? 0);
            duration = Math.floor(t.getDuration?.() ?? 0) || null;
          } catch {
            return;
          }
          if (current <= 0) return;
          void reportVideoProgress(courseSlug, lessonKey, videoUrl, current, duration);
        }

        function startTick() {
          stopTick();
          tickTimer = setInterval(report, REPORT_EVERY_MS);
        }

        function stopTick() {
          if (tickTimer) {
            clearInterval(tickTimer);
            tickTimer = null;
          }
        }
      } catch {
        if (!cancelled) {
          setError('No se pudo cargar el reproductor de YouTube.');
          setLoading(false);
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
      if (tickTimer) clearInterval(tickTimer);
      // El reproductor se destruye solo al desmontar el contenedor.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, courseSlug, lessonKey]);

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-950 shadow-card">
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-sm font-semibold text-white">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Cargando video…
          </div>
        ) : null}
        <div ref={containerRef} className="absolute inset-0" />
      </div>

      {error ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span>{error}</span>
          {videoUrl ? (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-brand-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Ver en YouTube
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
