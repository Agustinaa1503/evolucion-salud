-- ============================================================================
-- Evolución Salud — FASE 3 · Catálogo LMS sincronizado desde `Cursos/*.md`
-- Tablas: courses, course_modules, course_lessons, course_resources,
--         course_videos, course_quizzes, quiz_questions
-- ----------------------------------------------------------------------------
-- Modelo:
--   La fuente de verdad de cada curso es su archivo Markdown. El script
--   `web/scripts/sync-catalog.mts` (npm run db:sync-catalog) upserta el
--   catálogo en estas tablas para que progreso, panel de administración y
--   analytics puedan consultar con FKs reales y sin hardcodear cursos.
--
-- RLS:
--   anon / authenticated → SOLO lectura del catálogo (el contenido es público)
--   service_role         → escritura (lo usa el script de sincronización)
--   No hay policies de insert/update/delete: por defecto todo se niega.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. courses
-- ----------------------------------------------------------------------------
create table if not exists public.courses (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  subtitle         text,
  description      text,
  category         text not null default 'PINE',
  level            text,
  difficulty       text,
  duration         text,
  duration_seconds integer,
  type             text not null default 'free' check (type in ('free', 'paid', 'upcoming')),
  status           text not null default 'published' check (status in ('published', 'in-development', 'draft', 'archived')),
  visibility       text not null default 'public' check (visibility in ('public', 'private')),
  cta              text not null default 'ver-curso',
  external_url     text,
  price            numeric,
  currency         text not null default 'ARS',
  featured         boolean not null default false,
  has_quiz         boolean not null default false,
  has_certificate  boolean not null default false,
  thumbnail        text,
  banner           text,
  tags             text[] not null default '{}',
  seo              jsonb not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists courses_status_idx    on public.courses (status);
create index if not exists courses_type_idx      on public.courses (type);
create index if not exists courses_category_idx  on public.courses (category);
create index if not exists courses_featured_idx  on public.courses (featured) where featured;
create index if not exists courses_tags_gin_idx  on public.courses using gin (tags);

-- ----------------------------------------------------------------------------
-- 2. course_modules
-- ----------------------------------------------------------------------------
create table if not exists public.course_modules (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses (id) on delete cascade,
  position    integer not null default 0,
  md_id       text,
  title       text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (course_id, position)
);

create index if not exists course_modules_course_idx on public.course_modules (course_id);

-- ----------------------------------------------------------------------------
-- 3. course_lessons
-- ----------------------------------------------------------------------------
create table if not exists public.course_lessons (
  id               uuid primary key default gen_random_uuid(),
  course_id        uuid not null references public.courses (id) on delete cascade,
  module_id        uuid not null references public.course_modules (id) on delete cascade,
  position         integer not null default 0,
  lesson_key       text not null,
  title            text not null,
  description      text,
  type             text not null check (type in ('video', 'pdf', 'texto', 'quiz', 'link')),
  platform         text,
  video_url        text,
  resource_url     text,
  duration         text,
  duration_seconds integer,
  is_free          boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (course_id, lesson_key)
);

create index if not exists course_lessons_course_idx on public.course_lessons (course_id);
create index if not exists course_lessons_module_idx on public.course_lessons (module_id);
create index if not exists course_lessons_key_idx    on public.course_lessons (course_id, lesson_key);

-- ----------------------------------------------------------------------------
-- 4. course_resources
-- ----------------------------------------------------------------------------
create table if not exists public.course_resources (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses (id) on delete cascade,
  position    integer not null default 0,
  title       text not null,
  type        text not null default 'link',
  url         text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists course_resources_course_idx on public.course_resources (course_id);

-- ----------------------------------------------------------------------------
-- 5. course_videos
-- ----------------------------------------------------------------------------
create table if not exists public.course_videos (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses (id) on delete cascade,
  position    integer not null default 0,
  title       text not null,
  url         text not null,
  duration    text,
  description text,
  created_at  timestamptz not null default now()
);

create index if not exists course_videos_course_idx on public.course_videos (course_id);

-- ----------------------------------------------------------------------------
-- 6. course_quizzes
-- ----------------------------------------------------------------------------
create table if not exists public.course_quizzes (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references public.courses (id) on delete cascade,
  position      integer not null default 0,
  title         text,
  description   text,
  cta_label     text,
  pass_threshold numeric not null default 60,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (course_id, position)
);

create index if not exists course_quizzes_course_idx on public.course_quizzes (course_id);

-- ----------------------------------------------------------------------------
-- 7. quiz_questions
-- ----------------------------------------------------------------------------
create table if not exists public.quiz_questions (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references public.course_quizzes (id) on delete cascade,
  position    integer not null default 0,
  type        text not null check (type in ('texto', 'radio', 'checkbox', 'select', 'textarea', 'escala', 'link')),
  label       text not null,
  options     jsonb not null default '[]'::jsonb,
  scale       jsonb,
  correct     jsonb,
  placeholder text,
  url         text,
  url_label   text,
  required    boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (quiz_id, position)
);

create index if not exists quiz_questions_quiz_idx on public.quiz_questions (quiz_id);

-- ----------------------------------------------------------------------------
-- 8. Trigger de updated_at del catálogo
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

drop trigger if exists course_modules_set_updated_at on public.course_modules;
create trigger course_modules_set_updated_at
  before update on public.course_modules
  for each row execute function public.set_updated_at();

drop trigger if exists course_lessons_set_updated_at on public.course_lessons;
create trigger course_lessons_set_updated_at
  before update on public.course_lessons
  for each row execute function public.set_updated_at();

drop trigger if exists course_resources_set_updated_at on public.course_resources;
create trigger course_resources_set_updated_at
  before update on public.course_resources
  for each row execute function public.set_updated_at();

drop trigger if exists course_quizzes_set_updated_at on public.course_quizzes;
create trigger course_quizzes_set_updated_at
  before update on public.course_quizzes
  for each row execute function public.set_updated_at();

drop trigger if exists quiz_questions_set_updated_at on public.quiz_questions;
create trigger quiz_questions_set_updated_at
  before update on public.quiz_questions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 9. Row Level Security
-- ----------------------------------------------------------------------------
alter table public.courses         enable row level security;
alter table public.course_modules  enable row level security;
alter table public.course_lessons  enable row level security;
alter table public.course_resources enable row level security;
alter table public.course_videos   enable row level security;
alter table public.course_quizzes  enable row level security;
alter table public.quiz_questions  enable row level security;

-- El catálogo es contenido público: todos pueden leerlo.
create policy "courses public read" on public.courses
  for select to anon, authenticated using (true);

create policy "course_modules public read" on public.course_modules
  for select to anon, authenticated using (true);

create policy "course_lessons public read" on public.course_lessons
  for select to anon, authenticated using (true);

create policy "course_resources public read" on public.course_resources
  for select to anon, authenticated using (true);

create policy "course_videos public read" on public.course_videos
  for select to anon, authenticated using (true);

create policy "course_quizzes public read" on public.course_quizzes
  for select to anon, authenticated using (true);

create policy "quiz_questions public read" on public.quiz_questions
  for select to anon, authenticated using (true);

-- ----------------------------------------------------------------------------
-- 10. Grants explícitos
-- ----------------------------------------------------------------------------
grant select on public.courses, public.course_modules, public.course_lessons,
  public.course_resources, public.course_videos, public.course_quizzes,
  public.quiz_questions to anon, authenticated;

-- El script de sincronización usa service_role (evita la RLS).
grant select, insert, update, delete on public.courses, public.course_modules,
  public.course_lessons, public.course_resources, public.course_videos,
  public.course_quizzes, public.quiz_questions to service_role;
