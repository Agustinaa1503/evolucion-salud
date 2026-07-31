import { describe, expect, it } from 'vitest';
import {
  computeProgressPct,
  isVideoCompleted,
  statusFromProgress,
  videoProgressPct,
} from '../lib/lms/progress';
import { extractYouTubeId } from '../lib/youtube';

describe('computeProgressPct', () => {
  it('devuelve 0 cuando no hay lecciones', () => {
    expect(computeProgressPct(0, 0)).toBe(0);
  });

  it('calcula porcentajes redondeados', () => {
    expect(computeProgressPct(2, 4)).toBe(50);
    expect(computeProgressPct(3, 4)).toBe(75);
  });

  it('nunca supera 100', () => {
    expect(computeProgressPct(5, 4)).toBe(100);
  });
});

describe('statusFromProgress', () => {
  it('completa al llegar a 100', () => {
    expect(statusFromProgress(100)).toBe('completed');
  });

  it('mantiene en progreso bajo 100', () => {
    expect(statusFromProgress(0)).toBe('in_progress');
    expect(statusFromProgress(99)).toBe('in_progress');
  });
});

describe('isVideoCompleted', () => {
  it('completa al ver el 97% con tolerancia de 3 s', () => {
    expect(isVideoCompleted(97, 100)).toBe(true);
    expect(isVideoCompleted(97, 100)).toBe(true);
    expect(isVideoCompleted(95, 100)).toBe(false);
  });

  it('exige 60 s como mínimo sin duración conocida', () => {
    expect(isVideoCompleted(60, null)).toBe(true);
    expect(isVideoCompleted(59, null)).toBe(false);
    expect(isVideoCompleted(0, null)).toBe(false);
  });
});

describe('videoProgressPct', () => {
  it('calcula el porcentaje de reproducción', () => {
    expect(videoProgressPct(30, 100)).toBe(30);
    expect(videoProgressPct(100, 100)).toBe(100);
    expect(videoProgressPct(120, 100)).toBe(100);
  });

  it('devuelve 0 sin duración conocida', () => {
    expect(videoProgressPct(30, null)).toBe(0);
  });
});

describe('extractYouTubeId', () => {
  it('extrae IDs de los formatos habituales', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://www.youtube.com/watch?v=abcDEF12345&t=30s')).toBe('abcDEF12345');
  });

  it('devuelve null para URLs no válidas', () => {
    expect(extractYouTubeId('https://vimeo.com/123456')).toBeNull();
    expect(extractYouTubeId('')).toBeNull();
    expect(extractYouTubeId('no-es-url')).toBeNull();
  });
});
