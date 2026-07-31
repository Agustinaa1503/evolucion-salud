-- ============================================================================
-- Evolución Salud — esquema inicial de la plataforma
-- Tablas definidas en web/lib/supabase/types.ts
-- RLS: el rol anon SOLO puede insertar desde los formularios públicos.
-- El equipo consulta/edita con service_role (Supabase Studio, n8n, backoffice).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Newsletter
-- ----------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  name       text,
  source     text,
  status     text not null default 'active',
  created_at timestamptz not null default now()
);

create unique index if not exists newsletter_subscribers_email_idx
  on public.newsletter_subscribers (lower(email));

-- ----------------------------------------------------------------------------
-- 2. Descargas de lead magnets
-- ----------------------------------------------------------------------------
create table if not exists public.lead_magnet_downloads (
  id               uuid primary key default gen_random_uuid(),
  email            text not null,
  name             text,
  lead_magnet_slug text not null,
  access_code      text not null,
  downloaded_at    timestamptz not null default now()
);

create index if not exists lead_magnet_downloads_email_idx
  on public.lead_magnet_downloads (lower(email));
create unique index if not exists lead_magnet_downloads_code_idx
  on public.lead_magnet_downloads (access_code);

-- ----------------------------------------------------------------------------
-- 3. Respuestas del cuestionario Matriz PINE
-- ----------------------------------------------------------------------------
create table if not exists public.questionnaire_responses (
  id               uuid primary key default gen_random_uuid(),
  email            text,
  participant_type text not null,
  answers          jsonb not null default '{}'::jsonb,
  percepcion_avg   numeric not null,
  corporal_avg     numeric not null,
  ambioma_score    integer not null,
  access_code      text not null,
  created_at       timestamptz not null default now()
);

create index if not exists questionnaire_responses_email_idx
  on public.questionnaire_responses (lower(email));
create unique index if not exists questionnaire_responses_code_idx
  on public.questionnaire_responses (access_code);

-- ----------------------------------------------------------------------------
-- 4. Mensajes de contacto
-- ----------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  topic      text,
  message    text not null,
  status     text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_status_idx
  on public.contact_messages (status);

-- ----------------------------------------------------------------------------
-- 5. Órdenes de compra
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  email          text not null,
  customer_name  text not null,
  items          jsonb not null default '[]'::jsonb,
  subtotal       numeric not null default 0,
  payment_method text not null,
  status         text not null default 'pending',
  created_at     timestamptz not null default now()
);

create index if not exists orders_email_idx
  on public.orders (lower(email));
create index if not exists orders_status_idx
  on public.orders (status);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.newsletter_subscribers     enable row level security;
alter table public.lead_magnet_downloads      enable row level security;
alter table public.questionnaire_responses    enable row level security;
alter table public.contact_messages           enable row level security;
alter table public.orders                     enable row level security;

-- El rol anon (clave pública del navegador) SOLO inserta.
-- Sin políticas de select/update/delete: nadie puede leer datos con la clave pública.
create policy "newsletter public insert"
  on public.newsletter_subscribers
  for insert to anon
  with check (true);

create policy "lead magnet public insert"
  on public.lead_magnet_downloads
  for insert to anon
  with check (true);

create policy "questionnaire public insert"
  on public.questionnaire_responses
  for insert to anon
  with check (true);

create policy "contact public insert"
  on public.contact_messages
  for insert to anon
  with check (true);

create policy "orders public insert"
  on public.orders
  for insert to anon
  with check (true);

-- Privilegios explícitos (idempotentes) para que el rol anon pueda insertar.
grant insert on public.newsletter_subscribers, public.lead_magnet_downloads,
  public.questionnaire_responses, public.contact_messages, public.orders to anon;
