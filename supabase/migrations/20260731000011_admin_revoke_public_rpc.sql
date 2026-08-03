-- FASE 11 — Fix de seguridad: revocar EXECUTE público de log_admin_event.
--
-- Las funciones nuevas en PostgreSQL heredan EXECUTE para PUBLIC por defecto.
-- `log_admin_event` (security definer) solo debe ser ejecutable por usuarios
-- autenticados con rol admin (el RBAC valida en el server action); un usuario
-- anónimo no debe poder escribir en la auditoría.

revoke execute on function public.log_admin_event(text, text, text, text, jsonb) from public;
