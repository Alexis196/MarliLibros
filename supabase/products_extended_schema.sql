-- Nuevas columnas para la tabla books
-- Ejecutar en Supabase SQL Editor

alter table public.books
  add column if not exists isbn        text,
  add column if not exists publisher   text,
  add column if not exists language    text default 'Español',
  add column if not exists sku         text,
  add column if not exists cost_price  numeric(10,2),
  add column if not exists promotional_price numeric(10,2),
  add column if not exists binding     text,
  add column if not exists edition     text,
  add column if not exists tags        text[] default '{}',
  add column if not exists status      text not null default 'published';

-- Índices para búsqueda y filtrado
create index if not exists books_status_idx      on public.books(status);
create index if not exists books_isbn_idx        on public.books(isbn);
create index if not exists books_sku_idx         on public.books(sku);
create index if not exists books_publisher_idx   on public.books(publisher);
create index if not exists books_category_idx    on public.books(category);
