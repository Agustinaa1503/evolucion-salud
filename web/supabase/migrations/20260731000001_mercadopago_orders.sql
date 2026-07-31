-- ============================================================================
-- Evolución Salud — Mercado Pago: columnas de pago en la tabla de órdenes
-- El rol anon sigue teniendo SOLO insert (RLS). La actualización de estados
-- la hace el servidor con service_role (webhook y endpoints /api/orders).
-- ============================================================================

alter table public.orders
  add column if not exists mp_preference_id text,
  add column if not exists mp_payment_id   text,
  add column if not exists mp_status       text,
  add column if not exists currency        text not null default 'ARS',
  add column if not exists paid_at         timestamptz;

create index if not exists orders_mp_preference_idx
  on public.orders (mp_preference_id);

create index if not exists orders_mp_payment_idx
  on public.orders (mp_payment_id);
