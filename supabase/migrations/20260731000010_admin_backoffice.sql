-- FASE 11 — BackOffice administrativo
-- RBAC (roles + permisos), auditoría, configuración y segmentos de newsletter.
--
-- Roles: super_admin, admin, editor, teacher, student, guest (más el legado
-- `alumno` que sigue existiendo para perfiles ya creados).
-- Permisos: la tabla `role_permissions` define qué puede hacer cada rol; la
-- función `has_permission()` la consulta en las policies RLS.
-- Auditoría: `admin_audit_logs` registra inicios de sesión de administradores,
-- cambios administrativos, publicaciones y errores (insert solo vía definer o
-- service_role; lectura solo para roles con `admin.logs.read`).
-- Configuración: `backoffice_settings` guarda el estado del BackOffice
-- (institucional, SEO, redes, contacto, logo/favicon, analytics).
-- Segmentos: `newsletter_segments` para la gestión de la newsletter.

-- ---------------------------------------------------------------------------
-- 1) Roles
-- ---------------------------------------------------------------------------
insert into public.roles (slug, nombre, descripcion)
values
  ('super_admin', 'Super Administrador', 'Acceso total al BackOffice y a la gestión de usuarios.'),
  ('admin', 'Administrador', 'Acceso total al BackOffice excepto acciones destructivas de usuarios.'),
  ('editor', 'Editor', 'Gestiona contenido: blog, podcast, recursos, categorías, tags y newsletter.'),
  ('teacher', 'Docente', 'Gestiona cursos, cuestionarios y certificados.'),
  ('student', 'Alumno', 'Acceso a la plataforma educativa. Sin acceso al BackOffice.'),
  ('guest', 'Invitado', 'Acceso limitado al contenido público. Sin acceso al BackOffice.')
on conflict (slug) do update
  set nombre = excluded.nombre, descripcion = excluded.descripcion;

-- ---------------------------------------------------------------------------
-- 2) Permisos por rol (RBAC)
-- ---------------------------------------------------------------------------
create table if not exists public.role_permissions (
  role_slug   text not null references public.roles(slug) on delete cascade,
  permission  text not null,
  created_at  timestamptz not null default now(),
  primary key (role_slug, permission)
);

insert into public.role_permissions (role_slug, permission)
values
  -- super_admin: todo
  ('super_admin', 'admin.access'), ('super_admin', 'admin.dashboard'),
  ('super_admin', 'admin.users.read'), ('super_admin', 'admin.users.write'), ('super_admin', 'admin.users.delete'),
  ('super_admin', 'admin.courses.read'), ('super_admin', 'admin.courses.write'),
  ('super_admin', 'admin.blog.read'), ('super_admin', 'admin.blog.write'),
  ('super_admin', 'admin.podcast.read'), ('super_admin', 'admin.podcast.write'),
  ('super_admin', 'admin.resources.read'), ('super_admin', 'admin.resources.write'),
  ('super_admin', 'admin.taxonomy.read'), ('super_admin', 'admin.taxonomy.write'),
  ('super_admin', 'admin.newsletter.read'), ('super_admin', 'admin.newsletter.write'),
  ('super_admin', 'admin.waitlist.read'),
  ('super_admin', 'admin.quizzes.read'),
  ('super_admin', 'admin.certificates.read'), ('super_admin', 'admin.certificates.write'),
  ('super_admin', 'admin.settings.read'), ('super_admin', 'admin.settings.write'),
  ('super_admin', 'admin.logs.read'),
  -- admin: todo excepto eliminar usuarios
  ('admin', 'admin.access'), ('admin', 'admin.dashboard'),
  ('admin', 'admin.users.read'), ('admin', 'admin.users.write'),
  ('admin', 'admin.courses.read'), ('admin', 'admin.courses.write'),
  ('admin', 'admin.blog.read'), ('admin', 'admin.blog.write'),
  ('admin', 'admin.podcast.read'), ('admin', 'admin.podcast.write'),
  ('admin', 'admin.resources.read'), ('admin', 'admin.resources.write'),
  ('admin', 'admin.taxonomy.read'), ('admin', 'admin.taxonomy.write'),
  ('admin', 'admin.newsletter.read'), ('admin', 'admin.newsletter.write'),
  ('admin', 'admin.waitlist.read'),
  ('admin', 'admin.quizzes.read'),
  ('admin', 'admin.certificates.read'), ('admin', 'admin.certificates.write'),
  ('admin', 'admin.settings.read'), ('admin', 'admin.settings.write'),
  ('admin', 'admin.logs.read'),
  -- editor: contenido
  ('editor', 'admin.access'), ('editor', 'admin.dashboard'),
  ('editor', 'admin.courses.read'), ('editor', 'admin.blog.read'), ('editor', 'admin.blog.write'),
  ('editor', 'admin.podcast.read'), ('editor', 'admin.podcast.write'),
  ('editor', 'admin.resources.read'), ('editor', 'admin.resources.write'),
  ('editor', 'admin.taxonomy.read'), ('editor', 'admin.taxonomy.write'),
  ('editor', 'admin.newsletter.read'), ('editor', 'admin.waitlist.read'),
  ('editor', 'admin.quizzes.read'), ('editor', 'admin.certificates.read'),
  ('editor', 'admin.logs.read'),
  -- teacher: cursos y evaluaciones
  ('teacher', 'admin.access'), ('teacher', 'admin.dashboard'),
  ('teacher', 'admin.courses.read'), ('teacher', 'admin.courses.write'),
  ('teacher', 'admin.quizzes.read'), ('teacher', 'admin.certificates.read'),
  ('teacher', 'admin.logs.read')
on conflict (role_slug, permission) do nothing;

-- ---------------------------------------------------------------------------
-- 3) Funciones de rol y permiso (para RLS y server actions)
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select pr.rol from public.profiles pr where pr.id = auth.uid();
$$;

create or replace function public.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles pr
    join public.role_permissions rp on rp.role_slug = pr.rol
    where pr.id = auth.uid()
      and pr.estado = 'activo'
      and rp.permission = p_permission
  );
$$;

grant execute on function public.current_role() to anon, authenticated;
grant execute on function public.has_permission(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) Auditoría administrativa (admin_audit_logs)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_audit_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete set null,
  action        text not null,        -- login | admin_change | publish | error | settings | export
  category      text not null,        -- auth | users | courses | blog | podcast | resources | taxonomy | newsletter | waitlist | quizzes | certificates | settings | system
  target_type   text,                 -- user | course | blog_post | episode | product | category | tag | certificate | newsletter | setting
  target_id     text,
  detail        jsonb not null default '{}'::jsonb,
  ip_address    text,
  created_at    timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_category_idx on public.admin_audit_logs (category);
create index if not exists admin_audit_logs_action_idx on public.admin_audit_logs (action);
create index if not exists admin_audit_logs_user_idx on public.admin_audit_logs (user_id);

alter table public.admin_audit_logs enable row level security;

create policy "admin_audit_logs_select_for_logs_readers" on public.admin_audit_logs
  for select using (public.has_permission('admin.logs.read'));

-- Escritura: solo la función definer y service_role (sin policy de insert).
create policy "admin_audit_logs_service_write" on public.admin_audit_logs
  for all to service_role using (true) with check (true);

grant select on public.admin_audit_logs to authenticated;

-- ---------------------------------------------------------------------------
-- 5) Función para registrar eventos de auditoría (definer)
-- ---------------------------------------------------------------------------
create or replace function public.log_admin_event(
  p_action     text,
  p_category   text,
  p_target_type text default null,
  p_target_id  text default null,
  p_detail     jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.admin_audit_logs (user_id, action, category, target_type, target_id, detail)
  values (auth.uid(), p_action, p_category, p_target_type, p_target_id, p_detail);
$$;

grant execute on function public.log_admin_event(text, text, text, text, jsonb) to authenticated;
revoke execute on function public.log_admin_event(text, text, text, text, jsonb) from public;

-- Registro automático del inicio de sesión de administradores.
create or replace function public.on_admin_sign_in()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rol in ('super_admin', 'admin')
     and coalesce(old.last_sign_in_at, 'epoch'::timestamptz) is distinct from new.last_sign_in_at then
    insert into public.admin_audit_logs (user_id, action, category, target_type, target_id, detail)
    values (
      new.id,
      'login',
      'auth',
      'user',
      new.id::text,
      jsonb_build_object('email', new.email, 'rol', new.rol)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_admin_sign_in on public.profiles;
create trigger on_admin_sign_in
  after update of last_sign_in_at on public.profiles
  for each row execute function public.on_admin_sign_in();

-- ---------------------------------------------------------------------------
-- 6) Configuración del BackOffice (backoffice_settings)
-- ---------------------------------------------------------------------------
create table if not exists public.backoffice_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles(id) on delete set null
);

alter table public.backoffice_settings enable row level security;

create policy "backoffice_settings_select_for_settings_readers" on public.backoffice_settings
  for select using (public.has_permission('admin.settings.read'));
create policy "backoffice_settings_update_for_settings_writers" on public.backoffice_settings
  for update using (public.has_permission('admin.settings.write'))
  with check (public.has_permission('admin.settings.write'));
create policy "backoffice_settings_service_write" on public.backoffice_settings
  for all to service_role using (true) with check (true);

grant select, update on public.backoffice_settings to authenticated;

-- ---------------------------------------------------------------------------
-- 7) Segmentos de newsletter (newsletter_segments)
-- ---------------------------------------------------------------------------
create table if not exists public.newsletter_segments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  filter      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

insert into public.newsletter_segments (name, description, filter)
values
  ('Todos los suscriptores', 'Toda la base de contactos.', '{}'::jsonb),
  ('Solo email', 'Suscriptores sin nombre (solo dirección de correo).', '{"has_name": false}'::jsonb),
  ('Con nombre', 'Suscriptores que dejaron su nombre.', '{"has_name": true}'::jsonb),
  ('Desde lista de espera', 'Suscriptores captados por la lista de espera de cursos.', '{"source_like": "waitlist%"}'::jsonb),
  ('Desde la web', 'Suscriptores captados desde la web.', '{"source_like": "web%"}'::jsonb)
on conflict (name) do nothing;

alter table public.newsletter_segments enable row level security;

create policy "newsletter_segments_select_for_newsletter_readers" on public.newsletter_segments
  for select using (public.has_permission('admin.newsletter.read'));
create policy "newsletter_segments_service_write" on public.newsletter_segments
  for all to service_role using (true) with check (true);

grant select on public.newsletter_segments to authenticated;
