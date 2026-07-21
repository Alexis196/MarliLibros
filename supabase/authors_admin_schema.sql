-- ================================================
-- Marli Libros — Alta de autores desde el admin + destacados
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Es idempotente: se puede correr más de una vez
-- ================================================

-- Antes, "Autores destacados" en el home mostraba TODOS los autores.
-- Con este flag, el admin elige cuáles aparecen ahí (igual que "featured" en books).
alter table public.authors add column if not exists featured boolean not null default false;
