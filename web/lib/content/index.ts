/**
 * Motor de contenido unificado de Evolución Salud (FASE 12).
 *
 * Punto de entrada del motor. **Solo server/build**: el parser y el registry
 * leen el filesystem, así que este índice nunca debe importarse desde un
 * componente cliente.
 */
export * from './types';
export { validateFrontmatter, SLUG_RE as SCHEMA_SLUG_RE } from './schemas';
export * from './slugs';
export * from './parser';
export * from './serializer';
export * from './adapters';
export * from './registry';
export * from './compile';
export * from './repository';
export * from './validate';
export * from './workflow';
export * from './versioning';
export * from './service';
