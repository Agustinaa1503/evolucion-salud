-- ============================================================================
-- Evolución Salud — Seed (se ejecuta tras las migraciones en `supabase db reset`)
-- Contenido: catálogo de roles y usuario administrador de demostración.
--
-- Para crear el primer administrador real (fuera del seed):
--   1) Registre el usuario en /register
--   2) Conviértalo en admin desde SQL (service_role):
--      update public.profiles set rol = 'admin' where email = 'tu@email.com';
--   3) O desde el panel de administración (FASE 11).
-- ============================================================================

insert into public.roles (slug, nombre, descripcion) values
  ('alumno', 'Alumno', 'Usuario de la plataforma educativa.'),
  ('admin',  'Administrador', 'Acceso total al panel de administración.')
on conflict (slug) do nothing;
