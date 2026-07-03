-- ================================================
-- Marli Libros — Reseñas de productos
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Es idempotente: se puede correr más de una vez
-- ================================================

create table if not exists public.reviews (
  id            uuid default gen_random_uuid() primary key,
  book_id       uuid not null references public.books(id) on delete cascade,
  reviewer_name text not null,
  rating        integer not null check (rating >= 1 and rating <= 5),
  comment       text,
  created_at    timestamptz default now()
);

alter table public.reviews enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'reviews' and policyname = 'anon_select_reviews'
  ) then
    create policy "anon_select_reviews" on public.reviews for select to anon using (true);
  end if;
end $$;

-- El alta de reseñas pasa por /api/reviews con la service role key (valida rating y datos antes de insertar).
