-- ============================================================
-- Marli Libros — MIGRACIÓN PENDIENTE (verificada contra la DB real el 2026-07-08)
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- Es idempotente: se puede correr más de una vez sin romper nada.
--
-- Esto es lo ÚNICO que falta. Sin esto NO funcionan:
--   · Agregar/editar gastos (faltan columnas de expenses)
--   · Guardar productos con ISBN/editorial/promo/estado (faltan columnas de books)
--   · La tienda pública y el checkout (el código filtra por books.status)
--   · Los cupones de descuento (falta la tabla coupons)
--   · La fecha de despacho de pedidos (falta orders.shipped_at)
-- ============================================================

-- 1) books — columnas extendidas del formulario de productos
alter table public.books
  add column if not exists isbn        text,
  add column if not exists publisher   text,
  add column if not exists language    text default 'Español',
  add column if not exists sku         text,
  add column if not exists cost_price  numeric(10,2),
  add column if not exists promotional_price numeric(10,2),
  add column if not exists binding     text,
  add column if not exists edition     text,
  add column if not exists tags        text[] default '{}',
  add column if not exists status      text not null default 'published';

create index if not exists books_status_idx    on public.books(status);
create index if not exists books_isbn_idx      on public.books(isbn);
create index if not exists books_sku_idx       on public.books(sku);
create index if not exists books_publisher_idx on public.books(publisher);
create index if not exists books_category_idx  on public.books(category);

-- 2) orders — fecha de despacho
alter table public.orders add column if not exists shipped_at timestamptz;

-- 3) expenses — columnas extendidas del panel de gastos
alter table public.expenses
  add column if not exists category        text,
  add column if not exists supplier        text,
  add column if not exists payment_method  text default 'Transferencia',
  add column if not exists invoice_number  text,
  add column if not exists notes           text,
  add column if not exists tags            text[] default '{}',
  add column if not exists receipt_url     text,
  add column if not exists currency        text not null default 'ARS';

create index if not exists expenses_category_idx on public.expenses(category);
create index if not exists expenses_date_idx     on public.expenses(expense_date);
create index if not exists expenses_supplier_idx on public.expenses(supplier);
create index if not exists expenses_created_idx  on public.expenses(created_at desc);

-- 4) coupons — tabla completa (nunca se creó)
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
