-- ================================================
-- Marli Libros — Pedidos (orders / order_items)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Es idempotente: se puede correr más de una vez
-- ================================================

create table if not exists public.orders (
  id               uuid default gen_random_uuid() primary key,
  status           text not null default 'pending', -- pending | approved | rejected | in_process | cancelled
  customer_name    text not null,
  customer_email   text not null,
  customer_phone   text,
  shipping_address text not null,
  total_amount     numeric(10,2) not null,
  mp_preference_id text,
  mp_payment_id    text,
  mp_status_detail text,
  email_sent       boolean not null default false,
  created_at       timestamptz default now()
);

create table if not exists public.order_items (
  id          uuid default gen_random_uuid() primary key,
  order_id    uuid not null references public.orders(id) on delete cascade,
  book_id     uuid references public.books(id) on delete set null,
  title       text not null,
  author_name text not null,
  price       numeric(10,2) not null,
  quantity    integer not null
);

-- ── RLS: sin acceso público — todo pasa por rutas /api/* con la service role key ──

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- ================================================
-- Cupones de descuento
-- ================================================

alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount_amount numeric(10,2) not null default 0;

create table if not exists public.coupons (
  id             uuid default gen_random_uuid() primary key,
  code           text not null unique,
  discount_type  text not null default 'percentage', -- percentage | fixed
  discount_value numeric(10,2) not null,
  active         boolean not null default true,
  expires_at     timestamptz,
  min_purchase   numeric(10,2),
  max_uses       integer,
  used_count     integer not null default 0,
  created_at     timestamptz default now()
);

alter table public.coupons enable row level security;
-- Sin policies públicas: la validación pasa por /api/coupons/validate con la service role key

-- Cupón de ejemplo para probar el flujo (10% de descuento, sin vencimiento ni límite de usos)
insert into public.coupons (code, discount_type, discount_value)
values ('BIENVENIDA10', 'percentage', 10)
on conflict (code) do nothing;
