-- ================================================
-- Marli Libros — Schema y datos de demostración
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Es idempotente: se puede correr más de una vez
-- ================================================

-- ── Tablas ──────────────────────────────────────

create table if not exists public.authors (
  id          uuid default gen_random_uuid() primary key,
  name        text not null unique,
  nationality text,
  bio         text,
  photo_url   text,
  created_at  timestamptz default now()
);

create table if not exists public.books (
  id          uuid default gen_random_uuid() primary key,
  title       text not null unique,
  author_id   uuid references public.authors(id) on delete set null,
  author_name text not null,
  category    text not null,
  price       numeric(10,2) not null,
  description text,
  cover_url   text,
  -- new_until: mientras sea futuro, el libro aparece en "Novedades".
  -- Admin puede extender: UPDATE books SET new_until = now() + interval '7 days' WHERE id = '...';
  new_until   timestamptz default (now() + interval '7 days'),
  rating      numeric(3,1) default 4.0,
  pages       integer,
  year        integer,
  created_at  timestamptz default now()
);

-- Si ya corriste el seed sin new_until, esto lo agrega sin borrar datos:
alter table public.books add column if not exists new_until timestamptz default (now() + interval '7 days');

-- ── RLS: solo lectura pública ────────────────────

alter table public.authors enable row level security;
alter table public.books   enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'authors' and policyname = 'anon_select_authors'
  ) then
    create policy "anon_select_authors" on public.authors for select to anon using (true);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'books' and policyname = 'anon_select_books'
  ) then
    create policy "anon_select_books" on public.books for select to anon using (true);
  end if;
end $$;

-- ── Autores (10) ─────────────────────────────────

insert into public.authors (name, nationality, bio, photo_url) values
(
  'Gabriel García Márquez', 'Colombiano',
  'Premio Nobel de Literatura 1982. Padre del realismo mágico y autor de Cien años de soledad, una de las novelas más influyentes del siglo XX.',
  'https://i.pravatar.cc/300?img=11'
),
(
  'Jorge Luis Borges', 'Argentino',
  'Escritor, poeta y ensayista considerado uno de los autores clave de la literatura en lengua española. Maestro del cuento fantástico y los laberintos.',
  'https://i.pravatar.cc/300?img=12'
),
(
  'Julio Cortázar', 'Argentino',
  'Novelista y cuentista vanguardista. Su novela Rayuela revolucionó la narrativa latinoamericana al proponer múltiples formas de lectura.',
  'https://i.pravatar.cc/300?img=13'
),
(
  'Isabel Allende', 'Chilena',
  'Una de las escritoras más leídas del mundo hispanohablante. Su obra combina el realismo mágico con la historia y la lucha por los derechos humanos.',
  'https://i.pravatar.cc/300?img=5'
),
(
  'Laura Esquivel', 'Mexicana',
  'Novelista y guionista reconocida mundialmente por Como agua para chocolate, que mezcla gastronomía, amor y tradición mexicana.',
  'https://i.pravatar.cc/300?img=9'
),
(
  'Ernesto Sabato', 'Argentino',
  'Escritor y físico argentino. Premio Cervantes 1984. Autor de El túnel y Sobre héroes y tumbas, obras cumbres de la narrativa argentina.',
  'https://i.pravatar.cc/300?img=14'
),
(
  'Mario Vargas Llosa', 'Peruano',
  'Premio Nobel de Literatura 2010. Uno de los narradores más importantes de la literatura contemporánea en lengua española.',
  'https://i.pravatar.cc/300?img=15'
),
(
  'Pablo Neruda', 'Chileno',
  'Poeta y político chileno. Premio Nobel de Literatura 1971. Sus Veinte poemas de amor son de los más leídos en el mundo hispano.',
  'https://i.pravatar.cc/300?img=58'
),
(
  'Robin Sharma', 'Canadiense',
  'Coach de liderazgo y autor de autoayuda. Su bestseller El monje que vendió su Ferrari ha vendido millones de ejemplares en todo el mundo.',
  'https://i.pravatar.cc/300?img=52'
),
(
  'James Clear', 'Estadounidense',
  'Escritor y conferencista especializado en hábitos y toma de decisiones. Autor del bestseller Hábitos atómicos.',
  'https://i.pravatar.cc/300?img=53'
)
on conflict (name) do nothing;

-- ── Libros (20) ──────────────────────────────────
-- Todos reciben new_until = now() + 7 días por defecto.
-- Al final del script se expiran los que no son novedad.

insert into public.books (title, author_id, author_name, category, price, description, cover_url, rating, pages, year) values

-- Literatura latinoamericana (11)
(
  'Cien años de soledad',
  (select id from public.authors where name = 'Gabriel García Márquez'),
  'Gabriel García Márquez', 'Libros', 4500.00,
  'La saga de la familia Buendía en el mítico pueblo de Macondo a lo largo de siete generaciones. La obra cumbre del realismo mágico.',
  'https://covers.openlibrary.org/b/isbn/9780060883287-L.jpg',
  4.9, 471, 1967
),
(
  'El amor en los tiempos del cólera',
  (select id from public.authors where name = 'Gabriel García Márquez'),
  'Gabriel García Márquez', 'Libros', 3800.00,
  'Una historia de amor incondicional que trasciende décadas, la vejez y la enfermedad. Una de las novelas más bellas de García Márquez.',
  'https://covers.openlibrary.org/b/isbn/9780140124699-L.jpg',
  4.7, 368, 1985
),
(
  'Ficciones',
  (select id from public.authors where name = 'Jorge Luis Borges'),
  'Jorge Luis Borges', 'Libros', 3200.00,
  'Diecisiete cuentos que exploran laberintos, bibliotecas infinitas y el tiempo. La obra más representativa de Borges.',
  'https://covers.openlibrary.org/b/isbn/9780802130082-L.jpg',
  4.8, 224, 1944
),
(
  'El Aleph',
  (select id from public.authors where name = 'Jorge Luis Borges'),
  'Jorge Luis Borges', 'Libros', 2900.00,
  'Colección de cuentos en los que Borges despliega su universo: la paradoja, el infinito, los espejos y la identidad.',
  'https://covers.openlibrary.org/b/isbn/9780140286458-L.jpg',
  4.8, 160, 1949
),
(
  'Rayuela',
  (select id from public.authors where name = 'Julio Cortázar'),
  'Julio Cortázar', 'Libros', 4100.00,
  'Una novela que puede leerse de múltiples formas, como un juego o como una búsqueda existencial en París y Buenos Aires.',
  'https://covers.openlibrary.org/b/isbn/9780394752846-L.jpg',
  4.7, 576, 1963
),
(
  'Bestiario',
  (select id from public.authors where name = 'Julio Cortázar'),
  'Julio Cortázar', 'Libros', 3000.00,
  'El primer libro de cuentos de Cortázar. Ocho relatos donde lo cotidiano y lo fantástico conviven de manera inquietante.',
  'https://picsum.photos/seed/bestiario-cortazar/300/450',
  4.5, 192, 1951
),
(
  'La casa de los espíritus',
  (select id from public.authors where name = 'Isabel Allende'),
  'Isabel Allende', 'Libros', 4200.00,
  'Cuatro generaciones de mujeres de la familia Trueba en un país latinoamericano sacudido por la historia y la magia.',
  'https://covers.openlibrary.org/b/isbn/9781501117015-L.jpg',
  4.7, 448, 1982
),
(
  'Como agua para chocolate',
  (select id from public.authors where name = 'Laura Esquivel'),
  'Laura Esquivel', 'Libros', 3500.00,
  'El amor prohibido de Tita y Pedro, narrado a través de recetas de cocina que transmiten los sentimientos más profundos.',
  'https://covers.openlibrary.org/b/isbn/9780385420174-L.jpg',
  4.6, 245, 1989
),
(
  'El túnel',
  (select id from public.authors where name = 'Ernesto Sabato'),
  'Ernesto Sabato', 'Libros', 2800.00,
  'Novela existencialista narrada por un pintor obsesivo que comete un crimen de amor. Una de las grandes obras de la literatura argentina.',
  'https://covers.openlibrary.org/b/isbn/9780140177183-L.jpg',
  4.5, 160, 1948
),
(
  'La ciudad y los perros',
  (select id from public.authors where name = 'Mario Vargas Llosa'),
  'Mario Vargas Llosa', 'Libros', 3900.00,
  'Primera novela de Vargas Llosa, ambientada en un colegio militar de Lima. Una denuncia de la violencia institucional.',
  'https://covers.openlibrary.org/b/isbn/9780374527297-L.jpg',
  4.6, 412, 1963
),
(
  'Veinte poemas de amor y una canción desesperada',
  (select id from public.authors where name = 'Pablo Neruda'),
  'Pablo Neruda', 'Libros', 2500.00,
  'El poemario más leído en lengua castellana. Neruda celebra el amor con imágenes de una belleza sublime.',
  'https://covers.openlibrary.org/b/isbn/9780811218719-L.jpg',
  4.9, 96, 1924
),

-- Desarrollo Personal (5)
(
  'El monje que vendió su Ferrari',
  (select id from public.authors where name = 'Robin Sharma'),
  'Robin Sharma', 'Desarrollo Personal', 3600.00,
  'Una fábula espiritual sobre cómo redescubrir tu destino y vivir con mayor sentido, alegría y propósito.',
  'https://covers.openlibrary.org/b/isbn/9780006385271-L.jpg',
  4.4, 240, 1997
),
(
  'Hábitos atómicos',
  (select id from public.authors where name = 'James Clear'),
  'James Clear', 'Desarrollo Personal', 4800.00,
  'Un método probado para construir buenos hábitos y eliminar los malos. El libro más influyente sobre comportamiento humano de la última década.',
  'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
  4.9, 320, 2018
),
(
  'Los cuatro acuerdos',
  null,
  'Miguel Ángel Ruiz', 'Desarrollo Personal', 2900.00,
  'Un código de conducta personal basado en la sabiduría tolteca que ofrece cuatro principios para transformar tu vida.',
  'https://covers.openlibrary.org/b/isbn/9781878424501-L.jpg',
  4.7, 160, 1997
),
(
  'El poder del ahora',
  null,
  'Eckhart Tolle', 'Desarrollo Personal', 3400.00,
  'Una guía espiritual que enseña a vivir plenamente en el momento presente y liberarse del sufrimiento mental.',
  'https://covers.openlibrary.org/b/isbn/9781577314806-L.jpg',
  4.6, 229, 1997
),
(
  'La inteligencia emocional',
  null,
  'Daniel Goleman', 'Desarrollo Personal', 3700.00,
  'El libro que redefinió el concepto de inteligencia. Demuestra que el cociente emocional puede ser más determinante que el intelectual.',
  'https://covers.openlibrary.org/b/isbn/9780553804911-L.jpg',
  4.5, 352, 1995
),

-- Tarot y Oráculos (4)
(
  'Tarot Rider Waite: Guía completa',
  null,
  'Arthur Edward Waite', 'Tarot y Oráculos', 5200.00,
  'La guía definitiva del tarot más popular del mundo. Significado de cada carta, spreads y técnicas de lectura para todos los niveles.',
  'https://picsum.photos/seed/tarot-rider-waite/300/450',
  4.8, 280, 2020
),
(
  'El gran libro del tarot',
  null,
  'Hajo Banzhaf', 'Tarot y Oráculos', 4900.00,
  'Una referencia esencial para cualquier lector de tarot. Interpretaciones profundas de los 78 arcanos con ilustraciones.',
  'https://picsum.photos/seed/gran-libro-tarot/300/450',
  4.6, 320, 2015
),
(
  'Tarot: El camino como destino',
  null,
  'Rachel Pollack', 'Tarot y Oráculos', 4100.00,
  'Una exploración filosófica y práctica de los 78 arcanos. Ideal para lectores intermedios y avanzados.',
  'https://picsum.photos/seed/tarot-camino-destino/300/450',
  4.5, 400, 2010
),
(
  'Oráculos y mensajes del universo',
  null,
  'Doreen Virtue', 'Tarot y Oráculos', 3800.00,
  'Introducción accesible a los oráculos angélicos y cómo usarlos para recibir guía espiritual en el día a día.',
  'https://picsum.photos/seed/oraculos-universo/300/450',
  4.3, 224, 2018
),

-- Juegos Didácticos (1)
(
  'El gran libro de juegos de mesa',
  null,
  'Varios autores', 'Juegos Didácticos', 3500.00,
  'Más de 100 juegos de mesa explicados paso a paso para toda la familia. Desde los clásicos hasta los más modernos.',
  'https://picsum.photos/seed/juegos-mesa-didacticos/300/450',
  4.4, 256, 2019
)

on conflict (title) do nothing;

-- ── Expirar novedades de libros clásicos ─────────
-- Solo quedan como novedad: Bestiario, La ciudad y los perros,
-- Hábitos atómicos, Tarot Rider Waite y Oráculos y mensajes del universo.

update public.books
set new_until = now() - interval '1 day'
where title not in (
  'Bestiario',
  'La ciudad y los perros',
  'Hábitos atómicos',
  'Tarot Rider Waite: Guía completa',
  'Oráculos y mensajes del universo'
);
