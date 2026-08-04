/**
 * Tests del CMS de contenido (Subfase 12.2):
 * workflow, validación (pipeline), repository, servicio y versionado.
 */
import { describe, expect, it } from 'vitest';
import {
  ContentService,
  type ContentActor,
} from '@/lib/content/service';
import {
  getContentRepository,
  setContentRepository,
} from '@/lib/content/repository';
import {
  getAllContent,
  getPublicContent,
} from '@/lib/content/registry';
import { publicData } from '@/lib/content/compile';
import { parseContentString } from '@/lib/content/parser';
import { diffVersions, versionToText } from '@/lib/content/diff';
import {
  validationErrors,
  validateDocument,
} from '@/lib/content/validate';
import {
  assertTransition,
  canTransition,
  isPublicStatus,
  workflowStatusLabel,
  WORKFLOW_STATUSES,
} from '@/lib/content/workflow';
import {
  noopVersioner,
  type ContentVersionEntry,
  type ContentVersioner,
  type ContentVersionRow,
} from '@/lib/content/versioning';
import type { ContentRepository } from '@/lib/content/repository';
import type { FileContentKind } from '@/lib/content/parser';
import type { ContentDoc } from '@/lib/content/types';

const actor: ContentActor = { id: 'u-test', email: 'test@evolucionsalud.com', kind: 'human' };

const blogMarkdown = (status = 'published', slug = 'test-post') => `---
kind: blog
order: 0
slug: ${slug}
title: Post de prueba
excerpt: Un resumen.
date: "2026-08-01"
category: PINE
readTime: 5 min
categories:
  - pine
tags:
  - test
level: introductorio
audience:
  - publico-general
icon: heart
gradient: from-brand-500 to-leaf-600
image: https://images.example.com/a.jpg
status: ${status}
locale: es
version: 1
createdAt: "2026-08-01"
---

## Sección uno

Primer párrafo.
`;

const blogDoc = (status = 'published', slug = 'test-post'): ContentDoc =>
  parseContentString('blog', blogMarkdown(status, slug));

/** Repositorio en memoria para probar el servicio sin tocar el filesystem. */
class MemoryRepository implements ContentRepository {
  readonly kind = 'markdown' as const;
  docs = new Map<string, ContentDoc>();
  compileCalls = 0;

  private key(kind: FileContentKind, slug: string): string {
    return `${kind}:${slug}`;
  }

  list(kind: FileContentKind): ContentDoc[] {
    return [...this.docs.values()].filter((d) => d.kind === kind);
  }

  get(kind: FileContentKind, slug: string): ContentDoc | undefined {
    return this.docs.get(this.key(kind, slug));
  }

  exists(kind: FileContentKind, slug: string): boolean {
    return this.docs.has(this.key(kind, slug));
  }

  save(doc: ContentDoc): { saved: boolean } {
    const key = this.key(doc.kind as FileContentKind, doc.slug);
    const existed = this.docs.has(key);
    this.docs.set(key, JSON.parse(JSON.stringify(doc)) as ContentDoc);
    return { saved: !existed };
  }

  remove(kind: FileContentKind, slug: string): boolean {
    return this.docs.delete(this.key(kind, slug));
  }

  compile(): void {
    this.compileCalls += 1;
  }
}

/* -------------------------------------------------------------------------- */
/* Workflow                                                                    */
/* -------------------------------------------------------------------------- */

describe('workflow', () => {
  it('define los 4 estados editoriales', () => {
    expect(WORKFLOW_STATUSES).toEqual(['draft', 'review', 'published', 'archived']);
  });

  it('permite las transiciones válidas', () => {
    expect(canTransition('draft', 'review')).toBe(true);
    expect(canTransition('draft', 'published')).toBe(true);
    expect(canTransition('draft', 'archived')).toBe(true);
    expect(canTransition('review', 'published')).toBe(true);
    expect(canTransition('review', 'draft')).toBe(true);
    expect(canTransition('published', 'draft')).toBe(true);
    expect(canTransition('published', 'archived')).toBe(true);
    expect(canTransition('archived', 'draft')).toBe(true);
  });

  it('rechaza las transiciones inválidas', () => {
    expect(canTransition('archived', 'published')).toBe(false);
    expect(canTransition('published', 'review')).toBe(false);
    expect(canTransition('archived', 'review')).toBe(false);
    expect(() => assertTransition('published', 'review')).toThrow();
  });

  it('marca solo publicado como público', () => {
    expect(isPublicStatus('published')).toBe(true);
    for (const s of ['draft', 'review', 'archived'] as const) {
      expect(isPublicStatus(s)).toBe(false);
    }
  });

  it('etiqueta los estados en español', () => {
    expect(workflowStatusLabel('published')).toBe('Publicado');
    expect(workflowStatusLabel('draft')).toBe('Borrador');
  });
});

/* -------------------------------------------------------------------------- */
/* Validación                                                                  */
/* -------------------------------------------------------------------------- */

describe('validateDocument', () => {
  it('acepta un documento válido', () => {
    const res = validateDocument(blogDoc(), { repo: new MemoryRepository() });
    expect(res.ok).toBe(true);
    expect(res.issues).toEqual([]);
  });

  it('rechaza una categoría fuera del catálogo', () => {
    const doc = blogDoc();
    doc.categories = ['no-existe'];
    doc.frontmatter.categories = ['no-existe'];
    const res = validateDocument(doc, { repo: new MemoryRepository() });
    expect(res.ok).toBe(false);
    expect(validationErrors(res).some((i) => i.step === 'category')).toBe(true);
  });

  it('rechaza un nivel inválido', () => {
    const doc = blogDoc();
    doc.level = 'inexistente';
    doc.frontmatter.level = 'inexistente';
    const res = validateDocument(doc, { repo: new MemoryRepository() });
    expect(res.ok).toBe(false);
    expect(validationErrors(res).some((i) => i.step === 'level')).toBe(true);
  });

  it('rechaza una audiencia desconocida', () => {
    const doc = blogDoc();
    doc.audience = ['marcianos'];
    doc.frontmatter.audience = ['marcianos'];
    const res = validateDocument(doc, { repo: new MemoryRepository() });
    expect(res.ok).toBe(false);
    expect(validationErrors(res).some((i) => i.step === 'audience')).toBe(true);
  });

  it('rechaza un slug duplicado dentro del tipo', () => {
    const repo = new MemoryRepository();
    repo.save(blogDoc('published', 'test-post'));
    const res = validateDocument(blogDoc('published', 'test-post'), { repo });
    expect(res.ok).toBe(false);
    expect(validationErrors(res).some((i) => i.step === 'slug')).toBe(true);
  });

  it('excluye el propio slug cuando se edita (exceptSlug)', () => {
    const repo = new MemoryRepository();
    repo.save(blogDoc('published', 'test-post'));
    const res = validateDocument(blogDoc('published', 'test-post'), {
      repo,
      exceptSlug: 'test-post',
    });
    expect(validationErrors(res).some((i) => i.step === 'slug')).toBe(false);
  });

  it('rechaza un bundle con un componente inexistente', () => {
    const doc = parseContentString('product', `---
kind: product
slug: bundle-test
title: Bundle de prueba
subtitle: Pack
description: Descripción.
price: 49
level: media
productType: bundle
components:
  - guia-no-existe
features: []
includes: []
status: draft
locale: es
version: 1
---

Cuerpo.
`);
    const res = validateDocument(doc, { repo: new MemoryRepository() });
    expect(res.ok).toBe(false);
    expect(validationErrors(res).some((i) => i.step === 'relation')).toBe(true);
  });

  it('advierte (no bloquea) sobre traducciones pendientes', () => {
    const doc = blogDoc();
    doc.translations = { en: 'post-traduccion-futura' };
    doc.frontmatter.translations = { en: 'post-traduccion-futura' };
    const res = validateDocument(doc, { repo: new MemoryRepository() });
    expect(res.ok).toBe(true);
    expect(res.issues.some((i) => i.step === 'relation' && i.severity === 'warning')).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* Servicio                                                                    */
/* -------------------------------------------------------------------------- */

describe('ContentService', () => {
  it('crea un documento en versión 1 y recompila', async () => {
    const repo = new MemoryRepository();
    const service = new ContentService(repo);
    const res = await service.save(blogDoc(), actor);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.version).toBe(1);
      expect(res.saved).toBe(true);
      expect(res.published).toBe(true);
    }
    expect(repo.compileCalls).toBe(1);
  });

  it('incrementa la versión al actualizar', async () => {
    const repo = new MemoryRepository();
    const service = new ContentService(repo);
    await service.save(blogDoc(), actor);
    const current = repo.get('blog', 'test-post') as ContentDoc;
    const updated = { ...current, body: '## Cambio\n\nNuevo párrafo.' };
    const res = await service.save(updated, actor);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.version).toBe(2);
    expect(repo.get('blog', 'test-post')?.body).toContain('Cambio');
  });

  it('guarda un borrador sin publicarlo (no sale en getPublic)', async () => {
    const repo = new MemoryRepository();
    const service = new ContentService(repo);
    const doc = blogDoc('draft');
    const res = await service.save(doc, actor);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.published).toBe(false);
    expect(service.getPublic('blog')).toHaveLength(0);
  });

  it('bloquea transiciones de estado inválidas', async () => {
    const repo = new MemoryRepository();
    const service = new ContentService(repo);
    await service.save(blogDoc('archived', 'archivado'), actor);
    const res = await service.setStatus('blog', 'archivado', 'published', actor);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain('Transición');
  });

  it('publica desde borrador respetando el workflow', async () => {
    const repo = new MemoryRepository();
    const service = new ContentService(repo);
    await service.save(blogDoc('draft'), actor);
    const res = await service.publish('blog', 'test-post', actor, 'Primera publicación');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.published).toBe(true);
      expect(res.doc.status).toBe('published');
    }
  });

  it('registra cada guardado en el versioner', async () => {
    const entries: ContentVersionEntry[] = [];
    const versioner: ContentVersioner = {
      async log(entry) {
        entries.push(entry);
        return true;
      },
      async list() {
        return [];
      },
    };
    const service = new ContentService(new MemoryRepository(), versioner);
    await service.save(blogDoc(), actor);
    expect(entries).toHaveLength(1);
    expect(entries[0].version).toBe(1);
    expect(entries[0].content_type).toBe('blog');
    expect(entries[0].content_slug).toBe('test-post');
    expect(entries[0].status_after).toBe('published');
    expect(entries[0].editorId).toBe(actor.id);
  });

  it('elimina un documento y recompila', async () => {
    const repo = new MemoryRepository();
    const service = new ContentService(repo);
    await service.save(blogDoc(), actor);
    const removed = service.remove('blog', 'test-post');
    expect(removed.ok).toBe(true);
    if (removed.ok) expect(removed.removed).toBe(true);
    expect(repo.exists('blog', 'test-post')).toBe(false);
    expect(repo.compileCalls).toBe(2);
  });

  it('setStatus devuelve error si el documento no existe', async () => {
    const service = new ContentService(new MemoryRepository());
    const res = await service.setStatus('blog', 'fantasma', 'published', actor);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain('No existe');
  });
});

/* -------------------------------------------------------------------------- */
/* Versioner no-op                                                             */
/* -------------------------------------------------------------------------- */

describe('noopVersioner', () => {
  it('nunca falla y no persiste', async () => {
    expect(
      await noopVersioner.log({
        content_type: 'blog',
        content_slug: 'x',
        version: 1,
        status_after: 'draft',
        frontmatter: {},
        body: '',
      })
    ).toBe(true);
    expect(await noopVersioner.list('blog', 'x')).toEqual([]);
  });
});

/* -------------------------------------------------------------------------- */
/* Repositorio + contenido real (solo lectura)                                 */
/* -------------------------------------------------------------------------- */

describe('ContentRepository y visibilidad pública', () => {
  it('el repositorio por defecto es Markdown y tiene contenido', () => {
    const repo = getContentRepository();
    expect(repo.kind).toBe('markdown');
    expect(repo.list('blog').length).toBeGreaterThan(0);
    expect(repo.get('blog', 'estres-prequirurgico-como-preparar-cuerpo-y-mente')?.title).toBeTruthy();
    expect(repo.exists('blog', 'melatonina-y-sueno-la-hormona-que-prepara-tu-cuerpo-para-sanar')).toBe(true);
  });

  it('getPublicContent filtra solo publicado (hoy todo lo es)', () => {
    const all = getAllContent('blog');
    const pub = getPublicContent('blog');
    expect(pub.length).toBeGreaterThan(0);
    expect(pub.every((d) => d.status === 'published')).toBe(true);
    expect(all.every((d) => d.status === 'published')).toBe(true);
  });

  it('publicData compila los 4 tipos desde el contenido publicado', () => {
    const data = publicData();
    expect(data.blog.length).toBe(6);
    expect(data.episodes.length).toBe(17);
    expect(data.products.length).toBe(8);
    expect(data.newsletter.length).toBe(1);
  });

  it('CONTENT_REPOSITORY inválido lanza al resolver la fábrica', () => {
    setContentRepository(null);
    process.env.CONTENT_REPOSITORY = 'no-existe';
    expect(() => getContentRepository()).toThrow();
    delete process.env.CONTENT_REPOSITORY;
    setContentRepository(null);
    expect(getContentRepository().kind).toBe('markdown');
  });
});

/* -------------------------------------------------------------------------- */
/* Diff entre versiones                                                        */
/* -------------------------------------------------------------------------- */

describe('diffVersions', () => {
  const base = (extra: Record<string, unknown> = {}): ContentVersionRow => ({
    id: '1',
    content_type: 'blog',
    content_slug: 'test-post',
    version: 1,
    status_after: 'published',
    editor_email: null,
    editor_kind: 'human',
    summary: null,
    frontmatter: { title: 'Título', slug: 'test-post', ...extra },
    body: 'Primer párrafo.\n',
    created_at: '2026-08-03T00:00:00Z',
  });

  it('serializa front matter + cuerpo a texto', () => {
    const text = versionToText(base());
    expect(text).toContain('title');
    expect(text).toContain('Título');
    expect(text).toContain('Primer párrafo.');
  });

  it('la versión inicial marca todo como added', () => {
    const diff = diffVersions(null, base());
    expect(diff).toHaveLength(1);
    expect(diff[0].type).toBe('added');
    expect(diff[0].value).toContain('Título');
  });

  it('detecta un párrafo nuevo como added', () => {
    const prev = base();
    const next = base();
    next.version = 2;
    next.body = 'Primer párrafo.\nPárrafo nuevo.\n';
    const diff = diffVersions(prev, next);
    expect(diff.some((d) => d.type === 'added' && d.value.includes('Párrafo nuevo'))).toBe(true);
  });

  it('detecta un campo de front matter cambiado', () => {
    const prev = base({ title: 'Título anterior' });
    const next = base({ title: 'Título nuevo' });
    next.version = 2;
    const diff = diffVersions(prev, next);
    expect(diff.some((d) => d.type === 'removed' && d.value.includes('Título anterior'))).toBe(true);
    expect(diff.some((d) => d.type === 'added' && d.value.includes('Título nuevo'))).toBe(true);
  });

  it('devuelve unchanged cuando no hay diferencias', () => {
    const a = base();
    const b = base();
    b.version = 2;
    b.created_at = '2026-08-03T01:00:00Z';
    const diff = diffVersions(a, b);
    expect(diff.every((d) => d.type === 'unchanged')).toBe(true);
  });
});
