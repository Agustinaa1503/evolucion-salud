-- ============================================================================
-- Evolución Salud — FASE 8: Favoritos de cursos
-- El alumno guarda cursos en su lista personal (marcar / desmarcar).
-- RLS: cada usuario solo puede leer/insertar/borrar sus propios favoritos.
-- ============================================================================

create table if not exists public.user_favorites (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  course_id  uuid not null references public.courses (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create index if not exists user_favorites_course_idx
  on public.user_favorites (course_id);
create index if not exists user_favorites_created_idx
  on public.user_favorites (created_at desc);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.user_favorites enable row level security;

create policy "user_favorites select own" on public.user_favorites
  for select to authenticated using (user_id = auth.uid());

create policy "user_favorites insert own" on public.user_favorites
  for insert to authenticated with check (user_id = auth.uid());

create policy "user_favorites delete own" on public.user_favorites
  for delete to authenticated using (user_id = auth.uid());

create policy "user_favorites admin all" on public.user_favorites
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Grants explícitos (idempotentes)
grant select, insert, delete on public.user_favorites to authenticated;
grant select, insert, update, delete on public.user_favorites to service_role;
