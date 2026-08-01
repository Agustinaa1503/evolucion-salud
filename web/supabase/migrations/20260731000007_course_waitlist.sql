-- ============================================================================
-- Evolución Salud — FASE 7: Lista de espera de cursos (próximos lanzamientos)
-- Cada fila es una persona que quiere enterarse cuando un curso se publique.
-- RLS: el rol anon SOLO inserta (patrón idéntico al resto de los formularios).
-- La escritura por API usa service_role; el equipo lee con el backoffice.
-- ============================================================================

create table if not exists public.course_waitlist (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  name         text,
  course_slug  text not null,
  source       text not null default 'web',
  status       text not null default 'waiting',
  email_sent_at timestamptz,
  created_at   timestamptz not null default now()
);

-- Dedupe por persona y curso: la misma persona NO puede anotarse dos veces
-- al mismo curso, pero sí a cursos distintos.
create unique index if not exists course_waitlist_email_course_idx
  on public.course_waitlist (lower(email), course_slug);

create index if not exists course_waitlist_slug_idx
  on public.course_waitlist (course_slug);
create index if not exists course_waitlist_email_idx
  on public.course_waitlist (lower(email));

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.course_waitlist enable row level security;

-- El rol anon (clave pública del navegador) SOLO inserta desde el formulario.
-- Sin políticas de select/update/delete: nadie lee la lista con la clave pública.
create policy "course_waitlist public insert"
  on public.course_waitlist
  for insert to anon
  with check (true);

grant insert on public.course_waitlist to anon;
