-- ================================================
-- Marli Libros — Curaduría y stock de productos
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Es idempotente: se puede correr más de una vez
-- ================================================

alter table public.books add column if not exists featured boolean not null default false;
alter table public.books add column if not exists stock integer;

-- featured: marca manual desde el admin para "Catálogo destacado" en la home.
-- stock: cantidad disponible. NULL = sin control de stock (comportamiento actual).
