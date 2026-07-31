export type DemoRecordType =
  | 'newsletter'
  | 'lead'
  | 'contact'
  | 'questionnaire'
  | 'order'
  | 'curso_respuesta';

export type DemoRecord = {
  type: DemoRecordType;
  data: Record<string, unknown>;
  createdAt: string;
};

const KEY = 'evolucion-salud-demo-records';

/**
 * Guarda un registro en localStorage como demo del flujo.
 * En producción, cada flujo escribe en Supabase (ver lib/supabase/types.ts)
 * y las automatizaciones de n8n/Make procesan los registros.
 */
export function saveDemoRecord(
  type: DemoRecordType,
  data: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = JSON.parse(
      localStorage.getItem(KEY) ?? '[]'
    ) as DemoRecord[];
    existing.push({
      type,
      data,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(KEY, JSON.stringify(existing.slice(-50)));
  } catch {
    // Demo: si localStorage falla, no rompemos el flujo del usuario.
  }
}

export function randomCode(prefix = 'PINE'): string {
  const part = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${part()}-${part()}`;
}
