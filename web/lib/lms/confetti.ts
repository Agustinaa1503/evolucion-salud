/**
 * Micro-celebraciones con canvas-confetti (FASE UX: Retención).
 *
 * Se importa dinámicamente para no inflar el bundle inicial.
 * Colores de la marca Evolución Salud: morado #762d8f, naranja #d88242.
 */

const BRAND_PURPLE = '#762d8f';
const BRAND_ORANGE = '#d88242';
const BRAND_YELLOW = '#f3dd2b';

/** Confetti sutil al completar una lección (no invasivo). */
export async function confettiLessonComplete() {
  const confetti = (await import('canvas-confetti')).default;
  confetti({
    particleCount: 30,
    spread: 50,
    origin: { y: 0.7 },
    colors: [BRAND_PURPLE, BRAND_ORANGE],
    ticks: 100,
    gravity: 1.2,
    scalar: 0.8,
    shapes: ['circle'],
    drift: 0,
  });
}

/** Confetti más expresivo al aprobar un cuestionario puntuable. */
export async function confettiQuizPassed() {
  const confetti = (await import('canvas-confetti')).default;
  // Primer burst
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.6 },
    colors: [BRAND_PURPLE, BRAND_ORANGE, BRAND_YELLOW],
    ticks: 150,
    gravity: 1,
    scalar: 1,
  });
  // Segundo burst (delay)
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: [BRAND_PURPLE, BRAND_ORANGE],
      ticks: 120,
    });
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: [BRAND_PURPLE, BRAND_ORANGE],
      ticks: 120,
    });
  }, 250);
}

/** Confetti épico al alcanzar el 100% del curso. */
export async function confettiCourseComplete() {
  const confetti = (await import('canvas-confetti')).default;
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: [BRAND_PURPLE, BRAND_ORANGE, BRAND_YELLOW],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: [BRAND_PURPLE, BRAND_ORANGE, BRAND_YELLOW],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

/** Confetti de milestone (25%, 50%, 75%). */
export async function confettiMilestone(pct: number) {
  const confetti = (await import('canvas-confetti')).default;
  confetti({
    particleCount: 45,
    spread: 60,
    origin: { y: 0.65 },
    colors: pct === 100
      ? [BRAND_PURPLE, BRAND_ORANGE, BRAND_YELLOW]
      : [BRAND_PURPLE, BRAND_ORANGE],
    ticks: 120,
    gravity: 1.1,
    scalar: 0.9,
  });
}
