-- FASE 11 — Defensa en profundidad para log_admin_event.
--
-- Aunque PostgREST/anon pudieran ejecutar la RPC, solo un administrador
-- autenticado con `admin.access` puede registrar eventos de auditoría. El
-- check usa `has_permission()` (que a su vez exige sesión y rol activo), así
-- que un anónimo (auth.uid() nulo) o un alumno siempre recibe un error.

create or replace function public.log_admin_event(
  p_action      text,
  p_category    text,
  p_target_type text default null,
  p_target_id   text default null,
  p_detail      jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (select public.has_permission('admin.access')) then
    raise exception 'No autorizado para registrar eventos de auditoría';
  end if;
  insert into public.admin_audit_logs (user_id, action, category, target_type, target_id, detail)
  values (auth.uid(), p_action, p_category, p_target_type, p_target_id, p_detail);
end;
$$;

grant execute on function public.log_admin_event(text, text, text, text, jsonb) to authenticated;
revoke execute on function public.log_admin_event(text, text, text, text, jsonb) from public;
