-- ================================================
-- Marli Libros — Extensión de tabla de gastos
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Es idempotente: se puede correr más de una vez
-- ================================================

alter table public.expenses
  add column if not exists category        text,
  add column if not exists supplier        text,
  add column if not exists payment_method  text default 'Transferencia',
  add column if not exists invoice_number  text,
  add column if not exists notes           text,
  add column if not exists tags            text[] default '{}',
  add column if not exists receipt_url     text,
  add column if not exists currency        text not null default 'ARS';

create index if not exists expenses_category_idx    on public.expenses(category);
create index if not exists expenses_date_idx        on public.expenses(expense_date);
create index if not exists expenses_supplier_idx    on public.expenses(supplier);
create index if not exists expenses_created_idx     on public.expenses(created_at desc);
