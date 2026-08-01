-- FASE 10 — Taxonomía unificada
-- Tablas de clasificación compartidas por todos los tipos de contenido
-- (cursos, blog, podcast, recursos, newsletter y futuros productos digitales).
--
-- La fuente de verdad sigue siendo el contenido (Cursos/*.md + web/lib/data).
-- Estas tablas se pueblan con `npm run db:sync-taxonomy` (script sync-taxonomy.mts)
-- para que consultas, filtros y analytics tengan FKs reales.
--
-- RLS: lectura pública (los slugs/names no son sensibles); escritura solo
-- service_role (la taxonomía se sincroniza en el servidor).

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  slug        text primary key,
  name        text not null,
  "group"     text not null,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- tags
-- ---------------------------------------------------------------------------
create table if not exists public.tags (
  slug       text primary key,
  name       text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- content_categories (unión many-to-many: contenido <-> categoría)
-- ---------------------------------------------------------------------------
create table if not exists public.content_categories (
  content_type   text not null, -- course | blog | podcast | resource | newsletter
  content_id     text not null, -- slug estable del contenido (ej. slug de curso)
  category_slug  text not null references public.categories(slug) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (content_type, content_id, category_slug)
);

create index if not exists content_categories_category_idx
  on public.content_categories (category_slug);

create index if not exists content_categories_content_idx
  on public.content_categories (content_type, content_id);

-- ---------------------------------------------------------------------------
-- content_tags (unión many-to-many: contenido <-> tag)
-- ---------------------------------------------------------------------------
create table if not exists public.content_tags (
  content_type  text not null,
  content_id    text not null,
  tag_slug      text not null references public.tags(slug) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (content_type, content_id, tag_slug)
);

create index if not exists content_tags_tag_idx
  on public.content_tags (tag_slug);

create index if not exists content_tags_content_idx
  on public.content_tags (content_type, content_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.categories          enable row level security;
alter table public.tags                enable row level security;
alter table public.content_categories  enable row level security;
alter table public.content_tags        enable row level security;

-- Lectura pública (slugs, nombres y relaciones no sensibles).
create policy "categories_public_read" on public.categories
  for select using (true);
create policy "tags_public_read" on public.tags
  for select using (true);
create policy "content_categories_public_read" on public.content_categories
  for select using (true);
create policy "content_tags_public_read" on public.content_tags
  for select using (true);

-- Escritura solo con service_role (los grants definen quién puede escribir).
create policy "categories_service_write" on public.categories
  for all to service_role using (true) with check (true);
create policy "tags_service_write" on public.tags
  for all to service_role using (true) with check (true);
create policy "content_categories_service_write" on public.content_categories
  for all to service_role using (true) with check (true);
create policy "content_tags_service_write" on public.content_tags
  for all to service_role using (true) with check (true);

-- service_role ya tiene permisos por defecto; grants explícitos de lectura
-- para que anon/authenticated puedan leer los catálogos vía API REST.
grant select on public.categories, public.tags, public.content_categories, public.content_tags
  to anon, authenticated;
