-- ============================================================================
-- Evolución Salud — FASE 3 · Progreso del alumno (runtime LMS)
-- Tablas: user_courses, user_lesson_progress, user_video_progress,
--         user_quiz_attempts, activity_logs, notifications
-- ----------------------------------------------------------------------------
-- Modelo:
--   user_courses          → inscripción/avance por curso (1 fila por par user+course)
--   user_lesson_progress  → estado por lección (vista / completada)
--   user_video_progress   → segundos vistos por video (YouTube IFrame API)
--   user_quiz_attempts    → 1 fila por intento de cuestionario (con nota)
--   activity_logs         → eventos de la plataforma (auditoría y analytics)
--   notifications         → avisos para el alumno (sin canal de envío aún)
--
-- RLS:
--   authenticated → cada usuario lee/escribe SOLO sus propios registros
--   admin         → acceso total (helper public.is_admin())
--   Los triggers de activity_logs corren con security definer.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. user_courses
-- ----------------------------------------------------------------------------
create table if not exists public.user_courses (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  course_id          uuid not null references public.courses (id) on delete cascade,
  status             text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  progress_pct       numeric not null default 0,
  total_study_seconds integer not null default 0,
  started_at         timestamptz not null default now(),
  completed_at       timestamptz,
  last_access_at     timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id, course_id)
);

create index if not exists user_courses_user_idx  on public.user_courses (user_id);
create index if not exists user_courses_course_idx on public.user_courses (course_id);
create index if not exists user_courses_status_idx on public.user_courses (status);

-- ----------------------------------------------------------------------------
-- 2. user_lesson_progress
-- ----------------------------------------------------------------------------
create table if not exists public.user_lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  course_id    uuid not null references public.courses (id) on delete cascade,
  lesson_id    uuid not null references public.course_lessons (id) on delete cascade,
  status       text not null default 'viewed' check (status in ('viewed', 'completed')),
  viewed_at    timestamptz not null default now(),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists user_lesson_progress_user_idx   on public.user_lesson_progress (user_id);
create index if not exists user_lesson_progress_course_idx on public.user_lesson_progress (course_id);
create index if not exists user_lesson_progress_lesson_idx on public.user_lesson_progress (lesson_id);

-- ----------------------------------------------------------------------------
-- 3. user_video_progress
-- ----------------------------------------------------------------------------
create table if not exists public.user_video_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  course_id       uuid not null references public.courses (id) on delete cascade,
  lesson_id       uuid references public.course_lessons (id) on delete cascade,
  video_url       text not null,
  watched_seconds integer not null default 0,
  duration_seconds integer,
  progress_pct    numeric not null default 0,
  completed       boolean not null default false,
  last_position_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, video_url)
);

create index if not exists user_video_progress_user_idx   on public.user_video_progress (user_id);
create index if not exists user_video_progress_course_idx on public.user_video_progress (course_id);
create index if not exists user_video_progress_lesson_idx on public.user_video_progress (lesson_id);

-- ----------------------------------------------------------------------------
-- 4. user_quiz_attempts
-- ----------------------------------------------------------------------------
create table if not exists public.user_quiz_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  course_id   uuid not null references public.courses (id) on delete cascade,
  quiz_id     uuid references public.course_quizzes (id) on delete cascade,
  answers     jsonb not null default '{}'::jsonb,
  score       numeric,
  max_score   numeric,
  passed      boolean,
  submitted_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index if not exists user_quiz_attempts_user_idx   on public.user_quiz_attempts (user_id);
create index if not exists user_quiz_attempts_course_idx on public.user_quiz_attempts (course_id);
create index if not exists user_quiz_attempts_quiz_idx   on public.user_quiz_attempts (quiz_id);
create index if not exists user_quiz_attempts_time_idx   on public.user_quiz_attempts (submitted_at);

-- ----------------------------------------------------------------------------
-- 5. activity_logs (eventos para auditoría y analytics)
-- ----------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete set null,
  course_id  uuid references public.courses (id) on delete set null,
  event      text not null,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_user_idx    on public.activity_logs (user_id);
create index if not exists activity_logs_course_idx  on public.activity_logs (course_id);
create index if not exists activity_logs_event_idx   on public.activity_logs (event);
create index if not exists activity_logs_created_idx on public.activity_logs (created_at desc);

-- ----------------------------------------------------------------------------
-- 6. notifications
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null default 'info',
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id);
create index if not exists notifications_read_idx on public.notifications (user_id, read_at);

-- ----------------------------------------------------------------------------
-- 7. updated_at triggers (runtime)
-- ----------------------------------------------------------------------------
drop trigger if exists user_courses_set_updated_at on public.user_courses;
create trigger user_courses_set_updated_at
  before update on public.user_courses
  for each row execute function public.set_updated_at();

drop trigger if exists user_lesson_progress_set_updated_at on public.user_lesson_progress;
create trigger user_lesson_progress_set_updated_at
  before update on public.user_lesson_progress
  for each row execute function public.set_updated_at();

drop trigger if exists user_video_progress_set_updated_at on public.user_video_progress;
create trigger user_video_progress_set_updated_at
  before update on public.user_video_progress
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 8. Helper: registrar actividad (security definer, evita RLS en la inserción)
-- ----------------------------------------------------------------------------
create or replace function public.log_activity(
  p_user_id uuid,
  p_course_id uuid,
  p_event text,
  p_payload jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.activity_logs (user_id, course_id, event, payload)
  values (p_user_id, p_course_id, p_event, p_payload);
$$;

-- ----------------------------------------------------------------------------
-- 9. Triggers de actividad (el registro es automático a nivel de base)
-- ----------------------------------------------------------------------------
-- 9.1 Curso iniciado
create or replace function public.handle_user_course_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_activity(new.user_id, new.course_id, 'course_started', jsonb_build_object('course_id', new.course_id));
  elsif tg_op = 'UPDATE' and new.status = 'completed' and old.status <> 'completed' then
    perform public.log_activity(new.user_id, new.course_id, 'course_completed',
      jsonb_build_object('course_id', new.course_id, 'progress_pct', new.progress_pct, 'completed_at', new.completed_at));
  end if;
  return new;
end;
$$;

drop trigger if exists user_courses_activity on public.user_courses;
create trigger user_courses_activity
  after insert or update of status on public.user_courses
  for each row execute function public.handle_user_course_activity();

-- 9.2 Lección vista / completada
create or replace function public.handle_lesson_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_activity(new.user_id, new.course_id,
      case when new.status = 'completed' then 'lesson_completed' else 'lesson_viewed' end,
      jsonb_build_object('lesson_id', new.lesson_id, 'status', new.status));
  elsif tg_op = 'UPDATE' and new.status = 'completed' and old.status <> 'completed' then
    perform public.log_activity(new.user_id, new.course_id, 'lesson_completed',
      jsonb_build_object('lesson_id', new.lesson_id));
  end if;
  return new;
end;
$$;

drop trigger if exists user_lesson_progress_activity on public.user_lesson_progress;
create trigger user_lesson_progress_activity
  after insert or update of status on public.user_lesson_progress
  for each row execute function public.handle_lesson_activity();

-- 9.3 Video completado
create or replace function public.handle_video_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.completed and not old.completed then
    perform public.log_activity(new.user_id, new.course_id, 'video_completed',
      jsonb_build_object('lesson_id', new.lesson_id, 'video_url', new.video_url,
                         'watched_seconds', new.watched_seconds, 'progress_pct', new.progress_pct));
  end if;
  return new;
end;
$$;

drop trigger if exists user_video_progress_activity on public.user_video_progress;
create trigger user_video_progress_activity
  after update of completed on public.user_video_progress
  for each row execute function public.handle_video_activity();

-- 9.4 Intento de cuestionario
create or replace function public.handle_quiz_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.log_activity(new.user_id, new.course_id, 'quiz_attempt',
    jsonb_build_object('quiz_id', new.quiz_id, 'score', new.score, 'max_score', new.max_score, 'passed', new.passed));
  if new.passed then
    perform public.log_activity(new.user_id, new.course_id, 'quiz_passed',
      jsonb_build_object('quiz_id', new.quiz_id, 'score', new.score, 'max_score', new.max_score));
  end if;
  return new;
end;
$$;

drop trigger if exists user_quiz_attempts_activity on public.user_quiz_attempts;
create trigger user_quiz_attempts_activity
  after insert on public.user_quiz_attempts
  for each row execute function public.handle_quiz_activity();

-- ----------------------------------------------------------------------------
-- 10. Row Level Security
-- ----------------------------------------------------------------------------
alter table public.user_courses         enable row level security;
alter table public.user_lesson_progress enable row level security;
alter table public.user_video_progress  enable row level security;
alter table public.user_quiz_attempts   enable row level security;
alter table public.activity_logs        enable row level security;
alter table public.notifications        enable row level security;

-- user_courses: cada usuario solo su propio progreso
create policy "user_courses select own" on public.user_courses
  for select to authenticated using (user_id = auth.uid());

create policy "user_courses insert own" on public.user_courses
  for insert to authenticated with check (user_id = auth.uid());

create policy "user_courses update own" on public.user_courses
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "user_courses delete own" on public.user_courses
  for delete to authenticated using (user_id = auth.uid());

create policy "user_courses admin all" on public.user_courses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- user_lesson_progress
create policy "user_lesson_progress select own" on public.user_lesson_progress
  for select to authenticated using (user_id = auth.uid());

create policy "user_lesson_progress insert own" on public.user_lesson_progress
  for insert to authenticated with check (user_id = auth.uid());

create policy "user_lesson_progress update own" on public.user_lesson_progress
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "user_lesson_progress delete own" on public.user_lesson_progress
  for delete to authenticated using (user_id = auth.uid());

create policy "user_lesson_progress admin all" on public.user_lesson_progress
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- user_video_progress
create policy "user_video_progress select own" on public.user_video_progress
  for select to authenticated using (user_id = auth.uid());

create policy "user_video_progress insert own" on public.user_video_progress
  for insert to authenticated with check (user_id = auth.uid());

create policy "user_video_progress update own" on public.user_video_progress
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "user_video_progress delete own" on public.user_video_progress
  for delete to authenticated using (user_id = auth.uid());

create policy "user_video_progress admin all" on public.user_video_progress
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- user_quiz_attempts
create policy "user_quiz_attempts select own" on public.user_quiz_attempts
  for select to authenticated using (user_id = auth.uid());

create policy "user_quiz_attempts insert own" on public.user_quiz_attempts
  for insert to authenticated with check (user_id = auth.uid());

create policy "user_quiz_attempts update own" on public.user_quiz_attempts
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "user_quiz_attempts delete own" on public.user_quiz_attempts
  for delete to authenticated using (user_id = auth.uid());

create policy "user_quiz_attempts admin all" on public.user_quiz_attempts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- activity_logs: el usuario lee lo suyo; los triggers insertan con definer
create policy "activity_logs select own" on public.activity_logs
  for select to authenticated using (user_id = auth.uid());

create policy "activity_logs admin all" on public.activity_logs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- notifications: el usuario lee y marca como leídas las suyas
create policy "notifications select own" on public.notifications
  for select to authenticated using (user_id = auth.uid());

create policy "notifications update own" on public.notifications
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications admin all" on public.notifications
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 11. Grants explícitos
-- ----------------------------------------------------------------------------
grant select, insert, update, delete on public.user_courses,
  public.user_lesson_progress, public.user_video_progress,
  public.user_quiz_attempts to authenticated;

grant select on public.activity_logs to authenticated;
grant select, update on public.notifications to authenticated;

grant select, insert, update, delete on public.user_courses,
  public.user_lesson_progress, public.user_video_progress,
  public.user_quiz_attempts, public.activity_logs,
  public.notifications to service_role;
