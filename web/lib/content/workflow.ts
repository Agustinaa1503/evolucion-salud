/**
 * Workflow editorial del contenido (Subfase 12.2 — CMS).
 *
 * Cada documento vive en un estado y solo puede moverse a estados permitidos:
 *
 *   draft     →  review | published | archived
 *   review    →  published | draft | archived
 *   published →  draft | archived
 *   archived  →  draft
 *
 * Regla transversal: publicar un borrador con errores de validación está
 * prohibido (se exige `validateDocument(...).ok`). Las transiciones son puras y
 * testeables; el servicio (`service.ts`) las aplica junto al versionado.
 */
import type { EditorialStatus } from './types';

export type WorkflowStatus = EditorialStatus;

export const WORKFLOW_STATUSES: WorkflowStatus[] = [
  'draft',
  'review',
  'published',
  'archived',
];

export const WORKFLOW_LABELS: Record<WorkflowStatus, string> = {
  draft: 'Borrador',
  review: 'En revisión',
  published: 'Publicado',
  archived: 'Archivado',
};

export const workflowStatusLabel = (status: WorkflowStatus): string =>
  WORKFLOW_LABELS[status] ?? status;

const TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  draft: ['review', 'published', 'archived'],
  review: ['published', 'draft', 'archived'],
  published: ['draft', 'archived'],
  archived: ['draft'],
};

/** Indica si una transición de estado está permitida. */
export function canTransition(from: WorkflowStatus, to: WorkflowStatus): boolean {
  return from === to || (TRANSITIONS[from] ?? []).includes(to);
}

/** Indica si un estado es "público" (visible en la web). */
export const isPublicStatus = (status: WorkflowStatus): boolean =>
  status === 'published';

/** Lanza un error si la transición no está permitida. */
export function assertTransition(from: WorkflowStatus, to: WorkflowStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `[content] Transición de estado inválida: ${workflowStatusLabel(from)} → ${workflowStatusLabel(to)}.`
    );
  }
}
