-- ================================================
-- Marli Libros — Panel admin (despacho de pedidos)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Es idempotente: se puede correr más de una vez
-- ================================================

alter table public.orders add column if not exists shipped boolean not null default false;
alter table public.orders add column if not exists shipped_at timestamptz;

-- El seed.sql original (corrido antes de que se agregara esta columna) dejó la tabla
-- books sin new_until — lo agrega ahora sin afectar los libros existentes (quedan sin "Nuevo").
alter table public.books add column if not exists new_until timestamptz;

-- "Pedidos por despachar" = status = 'approved' AND shipped = false
-- El rol de admin no vive en una tabla: se marca en auth.users.app_metadata.role
-- al crear el usuario con scripts/create-admin.js (npm run create-admin).
