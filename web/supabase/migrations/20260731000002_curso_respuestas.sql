-- ============================================================================
-- Evolución Salud — respuestas de cuestionarios de cursos (LMS)
-- Tabla: public.curso_respuestas
-- RLS: el rol anon SOLO puede insertar (mismo patrón que el resto del esquema).
-- El equipo consulta/analiza con service_role (Supabase Studio, n8n).
-- ============================================================================

create table if not exists public.curso_respuestas (
  id          uuid primary key default gen_random_uuid(),
  course_slug text not null,
  answers     jsonb not null default '{}'::jsonb,
  source      text not null default 'web',
  created_at  timestamptz not null default now()
);

create index if not exists curso_respuestas_course_slug_idx
  on public.curso_respuestas (course_slug);

create index if not exists curso_respuestas_created_at_idx
  on public.curso_respuestas (created_at);

alter table public.curso_respuestas enable row level security;

create policy "curso respuestas public insert"
  on public.curso_respuestas
  for insert to anon
  with check (true);

grant insert on public.curso_respuestas to anon;
