-- ================================================
-- Marli Libros — Datos de envío estructurados (provincia, CP, referencia)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Es idempotente: se puede correr más de una vez
-- ================================================

alter table public.orders add column if not exists province text;
alter table public.orders add column if not exists postal_code text;
alter table public.orders add column if not exists address_reference text;
