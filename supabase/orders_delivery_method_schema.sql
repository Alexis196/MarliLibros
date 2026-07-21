-- ================================================
-- Marli Libros — Retiro en persona (delivery_method)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Es idempotente: se puede correr más de una vez
-- ================================================

alter table public.orders add column if not exists delivery_method text not null default 'shipping';

-- Tarifa de envío provisoria (nacional, fija) hasta integrar cotización real con Correo
-- Argentino. Queda registrada por pedido para no perder el detalle si la tarifa cambia.
alter table public.orders add column if not exists shipping_cost numeric(10,2) not null default 0;
