-- ============================================================================
-- Evolución Salud — FASE 5 · Certificados (PDF + QR + Storage)
-- Tabla: certificates + secuencia + funciones RPC + Storage bucket "certificates"
-- ----------------------------------------------------------------------------
-- Modelo:
--   certificates → 1 fila por par (user_id, course_id): número único legible
--                  (ES-YYYY-NNNNN), fecha de emisión y path del PDF en Storage.
--
-- Emisión:
--   El PDF lo genera el servidor (pdf-lib + qrcode). El servidor llama a
--   public.issue_certificate(...) (security definer), que asigna el número
--   secuencial y crea la fila en una sola transacción. La subida del PDF a
--   Storage la hace el cliente autenticado (policy por carpeta <uid>/).
--
-- Verificación pública:
--   public.get_certificate_public(p_id) expone SOLO campos no sensibles
--   (número, fecha, nombre completo, título del curso) para la página pública
--   /verificar/[id], sin exponer user_id ni pdf_path.
--
-- RLS:
--   authenticated → select/update de SUS propios certificados
--   admin         → total
--   El insert se hace vía RPC definer (número secuencial sin colisiones).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Secuencia para el número de certificado
-- ----------------------------------------------------------------------------
create sequence if not exists public.certificates_number_seq;

-- ----------------------------------------------------------------------------
-- 2. certificates
-- ----------------------------------------------------------------------------
create table if not exists public.certificates (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  course_id          uuid not null references public.courses (id) on delete cascade,
  certificate_number text not null unique,
  issued_at          timestamptz not null default now(),
  pdf_path           text,
  created_at         timestamptz not null default now(),
  unique (user_id, course_id)
);

create index if not exists certificates_user_idx   on public.certificates (user_id);
create index if not exists certificates_course_idx on public.certificates (course_id);

-- ----------------------------------------------------------------------------
-- 3. Número secuencial del certificado (ES-YYYY-NNNNN)
-- ----------------------------------------------------------------------------
create or replace function public.next_certificate_number()
returns text
language sql
security definer
set search_path = public
as $$
  select 'ES-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.certificates_number_seq')::text, 5, '0');
$$;

-- ----------------------------------------------------------------------------
-- 4. Emisión idempotente: devuelve el certificado existente o crea uno nuevo
-- ----------------------------------------------------------------------------
create or replace function public.issue_certificate(
  p_user_id uuid,
  p_course_id uuid,
  p_pdf_path text
)
returns table (
  id uuid,
  certificate_number text,
  issued_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_number text;
  v_issued timestamptz;
begin
  select c.id, c.certificate_number, c.issued_at
    into v_id, v_number, v_issued
    from public.certificates c
   where c.user_id = p_user_id and c.course_id = p_course_id
   limit 1;

  if v_id is null then
    v_number := public.next_certificate_number();
    v_issued := now();
    insert into public.certificates (user_id, course_id, certificate_number, issued_at, pdf_path)
    values (p_user_id, p_course_id, v_number, v_issued, p_pdf_path);
    select c.id into v_id
      from public.certificates c
     where c.user_id = p_user_id and c.course_id = p_course_id;
  end if;

  return query select v_id, v_number, v_issued;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. Verificación pública (sin datos sensibles)
-- ----------------------------------------------------------------------------
create or replace function public.get_certificate_public(p_id uuid)
returns table (
  valid boolean,
  certificate_number text,
  issued_at timestamptz,
  full_name text,
  course_title text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.certificates c where c.id = p_id) then
    return query select false::boolean, null::text, null::timestamptz, null::text, null::text;
    return;
  end if;

  return query
    select true::boolean,
           c.certificate_number,
           c.issued_at,
           trim(coalesce(p.nombre, '') || ' ' || coalesce(p.apellido, '')),
           co.title
      from public.certificates c
      join public.profiles p on p.id = c.user_id
      join public.courses co on co.id = c.course_id
     where c.id = p_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. Storage: bucket "certificates" (privado, solo PDF)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'certificates',
  'certificates',
  false,
  5242880,  -- 5 MB
  array['application/pdf']::text[]
)
on conflict (id) do nothing;

drop policy if exists "certificates select own folder" on storage.objects;
create policy "certificates select own folder"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "certificates insert own folder" on storage.objects;
create policy "certificates insert own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "certificates update own folder" on storage.objects;
create policy "certificates update own folder"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "certificates delete own folder" on storage.objects;
create policy "certificates delete own folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ----------------------------------------------------------------------------
-- 7. RLS + grants
-- ----------------------------------------------------------------------------
alter table public.certificates enable row level security;

drop policy if exists "certificates select own" on public.certificates;
create policy "certificates select own" on public.certificates
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "certificates admin all" on public.certificates;
create policy "certificates admin all" on public.certificates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, update on public.certificates to authenticated;
grant select, insert, update, delete on public.certificates to service_role;

grant execute on function public.issue_certificate(uuid, uuid, text) to authenticated;
grant execute on function public.get_certificate_public(uuid) to anon, authenticated;
grant execute on function public.next_certificate_number() to authenticated;

-- ----------------------------------------------------------------------------
-- 8. Fix FASE 6: notifications sin policy/grant de INSERT (fallaban en silencio)
-- ----------------------------------------------------------------------------
drop policy if exists "notifications insert own" on public.notifications;
create policy "notifications insert own" on public.notifications
  for insert to authenticated with check (user_id = auth.uid());

grant insert on public.notifications to authenticated;
