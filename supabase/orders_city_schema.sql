-- ================================================
-- Marli Libros — Ciudad / barrio en los datos de envío
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Es idempotente: se puede correr más de una vez
-- ================================================

alter table public.orders add column if not exists city text;
