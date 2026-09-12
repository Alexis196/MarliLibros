-- ================================================
-- Marli Libros — Integridad de stock al aprobar pedidos
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Es idempotente: se puede correr más de una vez
-- ================================================

-- Descuento de stock atómico. Antes se leía el stock, se restaba en JavaScript y se
-- guardaba de vuelta — si dos pedidos del mismo libro se aprobaban casi al mismo
-- tiempo, uno de los descuentos se podía "perder" (condición de carrera). Con esta
-- función, la resta ocurre en una sola sentencia SQL con "FOR UPDATE", que bloquea
-- la fila del libro hasta terminar: la segunda llamada concurrente espera a que
-- termine la primera y ve el stock ya actualizado, en vez de pisarlo.
create or replace function public.decrement_book_stock(p_book_id uuid, p_quantity integer)
returns table (new_stock integer, was_sufficient boolean)
language plpgsql
as $$
declare
  v_prev integer;
begin
  select stock into v_prev from public.books where id = p_book_id for update;

  -- Libro sin control de stock (stock = null): no se descuenta nada, siempre "alcanza".
  if v_prev is null then
    return query select null::integer, true;
    return;
  end if;

  update public.books set stock = greatest(v_prev - p_quantity, 0) where id = p_book_id;

  return query select greatest(v_prev - p_quantity, 0), (v_prev >= p_quantity);
end;
$$;

-- Si al aprobar un pedido algún libro no tenía stock suficiente (se vendió de más),
-- queda anotado acá para que se vea en el panel de admin y se pueda avisar al
-- cliente o reponer antes de despachar. null = todo OK.
alter table public.orders add column if not exists stock_warning text;
