/**
 * Pipeline de validación del contenido (Subfase 12.2 — CMS).
 *
 * Todo documento pasa por estos pasos ANTES de persistirse o publicarse, tanto
 * si lo edita una persona en el BackOffice como si lo hace un agente de IA:
 *
 *   1. schema   — zod (`validateFrontmatter`): tipos y campos obligatorios.
 *   2. slug     — formato (`SLUG_RE`) y unicidad dentro del tipo.
 *   3. category — las categorías deben pertenecer al catálogo fijo.
 *   4. level    — nivel válido (niveles del catálogo; productos: niveles propios).
 *   5. relation — traducciones y componentes de productos (targets existentes).
 *   6. roundtrip— `serialize → parse` debe devolver el mismo documento.
 *
 * A diferencia de la validación de compilación (que LANZA y detiene), esta
 * devuelve `ValidationIssue[]` para que el editor vea los errores en la UI sin
 * perder el trabajo. Los errores bloquean el guardado; las advertencias solo
 * informan.
 */
import { getAllAudiences, getAllCategories, getAllLevels } from '@/lib/taxonomy';
import { PRODUCT_LEVELS, SLUG_RE } from './schemas';
import { parseContentString } from './parser';
import { serializeContent } from './serializer';
import type { ContentRepository } from './repository';
import type { FileContentKind } from './parser';
import type { ContentDoc } from './types';

export type ValidationStep =
  | 'schema'
  | 'slug'
  | 'category'
  | 'level'
  | 'audience'
  | 'relation'
  | 'roundtrip';

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: ValidationSeverity;
  step: ValidationStep;
  message: string;
}

export interface ContentValidationResult {
  ok: boolean;
  /** Errores (bloquean) y advertencias (informativas), en orden de pipeline. */
  issues: ValidationIssue[];
}

export interface ValidateContext {
  /** Repositorio contra el que se verifican unicidad y relaciones. */
  repo: ContentRepository;
  /** Slug del documento que se edita (se excluye de la unicidad). */
  exceptSlug?: string;
}

const issue = (
  severity: ValidationSeverity,
  step: ValidationStep,
  message: string
): ValidationIssue => ({ severity, step, message });

/** Valida un documento. No lanza: devuelve errores/advertencias. */
export function validateDocument(
  doc: ContentDoc,
  ctx: ValidateContext
): ContentValidationResult {
  const issues: ValidationIssue[] = [];
  const kind = doc.kind as FileContentKind;

  // 1. Schema (zod)
  if (doc.frontmatter) {
    try {
      parseContentString(kind, serializeContent(doc));
    } catch (err) {
      issues.push(
        issue('error', 'schema', err instanceof Error ? err.message : 'Schema inválido')
      );
    }
  }

  // 2. Slug: formato + unicidad
  if (!SLUG_RE.test(doc.slug)) {
    issues.push(
      issue(
        'error',
        'slug',
        `Slug inválido: '${doc.slug}' (solo minúsculas, números y guiones).`
      )
    );
  }
  if (ctx.exceptSlug !== doc.slug) {
    const duplicate = ctx.repo.exists(kind, doc.slug);
    if (duplicate && ctx.exceptSlug !== doc.slug) {
      issues.push(issue('error', 'slug', `Ya existe un contenido con el slug '${doc.slug}'.`));
    }
  }

  // 3. Categorías del catálogo fijo
  const categorySlugs = new Set(getAllCategories().map((c) => c.slug));
  for (const cat of doc.categories ?? []) {
    if (!categorySlugs.has(cat)) {
      issues.push(issue('error', 'category', `La categoría '${cat}' no existe en el catálogo.`));
    }
  }

  // 4. Nivel
  if (doc.level) {
    if (kind === 'product') {
      if (!(PRODUCT_LEVELS as readonly string[]).includes(doc.level)) {
        issues.push(
          issue('error', 'level', `Nivel de producto inválido: '${doc.level}'.`)
        );
      }
    } else if (!getAllLevels().some((l) => l.slug === doc.level)) {
      issues.push(
        issue('error', 'level', `Nivel inválido: '${doc.level}'.`)
      );
    }
  }

  // 4b. Audiencias
  const audienceSlugs = new Set(getAllAudiences().map((a) => a.slug));
  for (const aud of doc.audience ?? []) {
    if (!audienceSlugs.has(aud)) {
      issues.push(issue('error', 'audience', `La audiencia '${aud}' no existe.`));
    }
  }

  // 5. Relaciones: traducciones y componentes de productos
  if (doc.translations) {
    for (const [locale, slug] of Object.entries(doc.translations)) {
      if (!ctx.repo.exists(kind, slug)) {
        issues.push(
          issue(
            'warning',
            'relation',
            `La traducción '${locale}' apunta a '${slug}', que aún no existe en ${kind}.`
          )
        );
      }
    }
  }
  if (kind === 'product') {
    const components = doc.frontmatter.components;
    if (Array.isArray(components)) {
      for (const componentSlug of components as string[]) {
        if (!ctx.repo.exists('product', componentSlug)) {
          issues.push(
            issue(
              'error',
              'relation',
              `El bundle incluye '${componentSlug}', que no existe entre los productos.`
            )
          );
        }
      }
    }
  }

  // 6. Round-trip serialización: al serializar y volver a parsear se debe
  //    obtener exactamente el mismo documento (comparación canónica).
  const reparsed = parseContentString(kind, serializeContent(doc));
  if (
    reparsed.body !== doc.body ||
    serializeContent(reparsed) !== serializeContent(doc)
  ) {
    issues.push(
      issue(
        'error',
        'roundtrip',
        'El documento no sobrevive al round-trip serialización→parser. Revisar campos complejos.'
      )
    );
  }

  return { ok: issues.every((i) => i.severity !== 'error'), issues };
}

/** Errores de una validación (para la UI). */
export const validationErrors = (result: ContentValidationResult): ValidationIssue[] =>
  result.issues.filter((i) => i.severity === 'error');

/** Advertencias de una validación (para la UI). */
export const validationWarnings = (result: ContentValidationResult): ValidationIssue[] =>
  result.issues.filter((i) => i.severity === 'warning');
