-- ============================================================================
-- Evolución Salud — FASE 1 · Autenticación
-- Tablas: roles, profiles, user_settings + triggers + RLS + Storage (avatars)
-- ----------------------------------------------------------------------------
-- Modelo:
--   auth.users (Supabase)  →  public.profiles  (1:1, FK con CASCADE)
--   roles                   →  public.profiles.rol  (FK, por slug)
--   user_settings           →  preferencias por usuario (newsletter, avisos)
--
-- RLS:
--   anon          → solo lectura pública de roles (sin datos de usuarios)
--   authenticated → lee/edita SOLO su propio profile y settings
--   admin         → lectura/escritura total (vía helper public.is_admin())
--   El alta de profiles la hace el trigger on_auth_user_created (security definer)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. roles (catálogo de roles de la plataforma)
-- ----------------------------------------------------------------------------
create table if not exists public.roles (
  slug        text primary key,
  nombre      text not null,
  descripcion text,
  created_at  timestamptz not null default now()
);

insert into public.roles (slug, nombre, descripcion) values
  ('alumno', 'Alumno', 'Usuario de la plataforma educativa.'),
  ('admin',  'Administrador', 'Acceso total al panel de administración.')
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 2. profiles (datos públicos del usuario autenticado)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  nombre          text,
  apellido        text,
  email           text,
  avatar_url      text,
  rol             text not null default 'alumno' references public.roles (slug),
  estado          text not null default 'activo' check (estado in ('activo', 'bloqueado')),
  last_sign_in_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists profiles_rol_idx   on public.profiles (rol);
create index if not exists profiles_estado_idx on public.profiles (estado);
create index if not exists profiles_email_idx on public.profiles (lower(email));

-- ----------------------------------------------------------------------------
-- 3. user_settings (preferencias por usuario)
-- ----------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id           uuid primary key references public.profiles (id) on delete cascade,
  receive_newsletter boolean not null default true,
  notification_email boolean not null default true,
  preferences       jsonb not null default '{}'::jsonb,
  updated_at        timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. Helper: is_admin() (security definer evita recursión en políticas)
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin' and p.estado = 'activo'
  );
$$;

-- ----------------------------------------------------------------------------
-- 5. Triggers
-- ----------------------------------------------------------------------------
-- 5.1 Alta automática de profile + settings al crear el usuario en auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, apellido, email)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'apellido'), ''),
    new.email
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5.2 Sincronizar email en profiles cuando cambia en auth.users
create or replace function public.handle_user_email_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set email = new.email, updated_at = now()
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_updated();

-- 5.3 Registrar último acceso a partir de auth.sessions
create or replace function public.handle_user_sign_in()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set last_sign_in_at = now()
   where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists on_auth_session_created on auth.sessions;
create trigger on_auth_session_created
  after insert on auth.sessions
  for each row execute function public.handle_user_sign_in();

-- 5.4 Mantener updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. Row Level Security
-- ----------------------------------------------------------------------------
alter table public.roles         enable row level security;
alter table public.profiles      enable row level security;
alter table public.user_settings enable row level security;

-- roles: lectura pública; solo admins escriben
create policy "roles public read" on public.roles
  for select to anon, authenticated
  using (true);

create policy "roles admin write" on public.roles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- profiles: cada usuario ve/edita el suyo; el admin todo
create policy "profiles select own" on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy "profiles select admin" on public.profiles
  for select to authenticated
  using (public.is_admin());

create policy "profiles update own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and rol = 'alumno'          -- el usuario no puede cambiarse el rol
    and estado = 'activo'       -- ni el estado
    and email is not distinct from (
      select email from public.profiles where id = auth.uid()
    )                           -- ni el email (se sincroniza solo)
  );

create policy "profiles admin all" on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- user_settings: cada usuario ve/edita las suyas; el admin todo
create policy "user_settings select own" on public.user_settings
  for select to authenticated
  using (user_id = auth.uid());

create policy "user_settings update own" on public.user_settings
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "user_settings admin all" on public.user_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 7. Grants explícitos (además de los defaults de Supabase, por claridad)
-- ----------------------------------------------------------------------------
grant select on public.roles to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, update on public.user_settings to authenticated;

-- ----------------------------------------------------------------------------
-- 8. Storage: bucket "avatars" (fotos de perfil)
--    public de lectura; escritura solo sobre avatars/<uid>/...
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do nothing;

create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars auth upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars auth update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars auth delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
