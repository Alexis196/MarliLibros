-- ================================================
-- Marli Libros — Gastos de compra (registro manual)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Es idempotente: se puede correr más de una vez
-- ================================================

create table if not exists public.expenses (
  id           uuid default gen_random_uuid() primary key,
  amount       numeric(10,2) not null,
  description  text not null,
  expense_date date not null default current_date,
  created_at   timestamptz default now()
);

alter table public.expenses enable row level security;
-- Sin policies públicas: el alta/baja pasa por /api/admin/expenses con la service role key
