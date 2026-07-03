-- ================================================
-- Marli Libros — Suscriptores del newsletter
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Es idempotente: se puede correr más de una vez
-- ================================================

create table if not exists public.subscribers (
  id         uuid default gen_random_uuid() primary key,
  email      text not null unique,
  created_at timestamptz default now()
);

alter table public.subscribers enable row level security;
-- Sin policies públicas: el alta pasa por /api/newsletter/subscribe con la service role key
