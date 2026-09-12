-- ================================================
-- Marli Libros — Pago en efectivo (payment_method)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Es idempotente: se puede correr más de una vez
-- ================================================

-- Identifica cómo se pagó el pedido. Los pedidos existentes (tarjeta o Checkout Pro)
-- quedan marcados como 'mercadopago'; los nuevos de efectivo usan 'cash'.
alter table public.orders add column if not exists payment_method text not null default 'mercadopago';

-- Los pedidos en efectivo no piden email (solo nombre, apellido, dirección y teléfono),
-- así que customer_email deja de ser obligatorio.
alter table public.orders alter column customer_email drop not null;
