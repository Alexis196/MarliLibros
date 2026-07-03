'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BookCard, type Book } from '@/components/BookCard';

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_CATEGORIES = [
  'Libros',
  'Desarrollo Personal',
  'Tarot y Oráculos',
  'Rompecabezas',
  'Juegos Didácticos',
  'Agendas y Cuadernos',
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white overflow-hidden animate-pulse border border-black/5" style={{ borderRadius: '18px', boxShadow: '0 8px 24px rgba(52,84,87,0.06)' }}>
      <div style={{ paddingTop: '145%', backgroundColor: '#E5ECE8' }} />
      <div className="p-3.5 space-y-2.5">
        <div className="h-3 rounded w-3/4" style={{ backgroundColor: '#E5ECE8' }} />
        <div className="h-3 rounded w-1/2" style={{ backgroundColor: '#EFEAE0' }} />
        <div className="h-4 rounded w-1/3 mt-2" style={{ backgroundColor: '#E5ECE8' }} />
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CatalogoPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [paramsReady, setParamsReady] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showNovedades, setShowNovedades] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recientes' | 'precio_asc' | 'precio_desc' | 'rating' | 'az'>('recientes');

  // Read URL params on mount — leer la URL solo es seguro en el cliente, no se puede mover a un lazy initializer sin romper SSR.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('categoria');
    const nov = params.get('novedades');
    const author = params.get('autor');
    const searchParam = params.get('search');
    if (cat) setSelectedCategory(decodeURIComponent(cat));
    if (nov === '1') setShowNovedades(true);
    if (author) setSelectedAuthor(decodeURIComponent(author));
    if (searchParam) {
      setSearch(decodeURIComponent(searchParam));
      setDebouncedSearch(decodeURIComponent(searchParam));
    }
    setParamsReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Debounce de la búsqueda para no disparar una query por cada tecla
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const buildQuery = (from: number, to: number) => {
    let q = supabase.from('books').select('*', { count: 'exact' });
    if (showNovedades) q = q.gt('new_until', new Date().toISOString());
    if (selectedCategory) q = q.eq('category', selectedCategory);
    if (selectedAuthor) q = q.eq('author_name', selectedAuthor);
    if (debouncedSearch) q = q.or(`title.ilike.%${debouncedSearch}%,author_name.ilike.%${debouncedSearch}%`);

    switch (sortBy) {
      case 'precio_asc':
        q = q.order('price', { ascending: true });
        break;
      case 'precio_desc':
        q = q.order('price', { ascending: false });
        break;
      case 'rating':
        q = q.order('rating', { ascending: false, nullsFirst: false });
        break;
      case 'az':
        q = q.order('title', { ascending: true });
        break;
      default:
        q = q.order('created_at', { ascending: false });
    }

    return q.range(from, to);
  };

  // Fetch (primera página) cada vez que cambian los filtros/orden
  useEffect(() => {
    if (!paramsReady) return;
    setLoading(true);
    buildQuery(0, PAGE_SIZE - 1).then(({ data, count }) => {
      setBooks(data ?? []);
      setTotalCount(count ?? 0);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsReady, selectedCategory, showNovedades, selectedAuthor, debouncedSearch, sortBy]);

  const loadMore = () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    buildQuery(nextPage * PAGE_SIZE, nextPage * PAGE_SIZE + PAGE_SIZE - 1).then(({ data }) => {
      setBooks(prev => [...prev, ...(data ?? [])]);
      setPage(nextPage);
      setLoadingMore(false);
    });
  };

  const hasMore = books.length < totalCount;

  const pageTitle = selectedAuthor
    ? `Libros de ${selectedAuthor}`
    : showNovedades
    ? 'Novedades'
    : selectedCategory
    ? selectedCategory
    : 'Catálogo completo';

  const selectCategory = (cat: string | null) => {
    setLoading(true);
    setPage(0);
    setSelectedCategory(cat);
    setShowNovedades(false);
    setSelectedAuthor(null);
  };

  const selectNovedades = () => {
    setLoading(true);
    setPage(0);
    setShowNovedades(true);
    setSelectedCategory(null);
    setSelectedAuthor(null);
  };

  const selectAll = () => {
    setLoading(true);
    setPage(0);
    setSelectedCategory(null);
    setShowNovedades(false);
    setSelectedAuthor(null);
  };

  return (
    <>
      <Navbar />
      <main style={{ background: 'linear-gradient(135deg, #E6EFEA 0%, #D8E5DD 35%, #E8DEC4 75%, #F0E4C9 100%)', minHeight: '100vh' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Link href="/" className="text-gray-400 hover:text-[#345457] transition-colors duration-300">Inicio</Link>
            <span className="text-gray-300">/</span>
            <span className="font-medium text-gray-500">{pageTitle}</span>
          </div>

          {/* Panel de filtros */}
          <div
            className="rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8"
            style={{ backgroundColor: '#EDF3F1', boxShadow: '0 4px 20px rgba(52,84,87,0.07)' }}
          >
            {/* Título + contador */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h1
                className="text-2xl sm:text-[28px] font-bold"
                style={{ color: '#345457', fontFamily: 'var(--font-playfair)' }}
              >
                {pageTitle}
              </h1>
              <span
                className="text-[12px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap"
                style={{ backgroundColor: 'white', color: '#345457' }}
              >
                {loading ? 'Cargando…' : `${totalCount} ${totalCount === 1 ? 'título encontrado' : 'títulos encontrados'}`}
              </span>
            </div>

            {/* Search bar + orden */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 transition-all duration-300 focus-within:border-[#345457] focus-within:shadow-[0_0_0_3px_rgba(52,84,87,0.08)] sm:max-w-sm flex-1">
                <span className="text-gray-400"><SearchIcon /></span>
                <input
                  type="text"
                  placeholder="Buscar por título o autor..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 py-2.5 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500 text-xs cursor-pointer">✕</button>
                )}
              </div>
              <select
                value={sortBy}
                onChange={e => { setLoading(true); setPage(0); setSortBy(e.target.value as typeof sortBy); }}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-all duration-300 focus:border-[#345457] cursor-pointer sm:w-auto"
              >
                <option value="recientes">Más recientes</option>
                <option value="precio_asc">Precio: menor a mayor</option>
                <option value="precio_desc">Precio: mayor a menor</option>
                <option value="rating">Mejor calificados</option>
                <option value="az">Alfabético (A-Z)</option>
              </select>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={selectAll}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors duration-300 ${
                  !selectedCategory && !showNovedades
                    ? 'bg-[#345457] text-white border-[#345457]'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-[rgba(52,84,87,0.08)] hover:border-[#345457]/30 hover:text-[#345457]'
                }`}
              >
                <FilterIcon /> Todos
              </button>
              <button
                onClick={selectNovedades}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors duration-300 ${
                  showNovedades
                    ? 'bg-[#345457] text-white border-[#345457]'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-[rgba(52,84,87,0.08)] hover:border-[#345457]/30 hover:text-[#345457]'
                }`}
              >
                ✦ Novedades
              </button>
              {ALL_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => selectCategory(cat === selectedCategory ? null : cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors duration-300 ${
                    selectedCategory === cat
                      ? 'bg-[#345457] text-white border-[#345457]'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-[rgba(52,84,87,0.08)] hover:border-[#345457]/30 hover:text-[#345457]'
                  }`}
                >
                  {cat}
                </button>
              ))}
              {selectedAuthor && (
                <button
                  onClick={() => { setLoading(true); setPage(0); setSelectedAuthor(null); }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors duration-300"
                  style={{ backgroundColor: '#C8A86B', color: '#345457', borderColor: '#C8A86B' }}
                >
                  {selectedAuthor} ✕
                </button>
              )}
            </div>
          </div>

          {/* Panel de productos */}
          <div
            className="rounded-2xl p-5 sm:p-7"
            style={{ backgroundColor: '#F7F6F2', boxShadow: '0 4px 20px rgba(52,84,87,0.05)' }}
          >
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-4xl mb-4">📚</p>
                <p className="text-gray-500 text-lg font-medium mb-2">Sin resultados</p>
                <p className="text-sm text-gray-400 mb-6">Probá con otra categoría o término de búsqueda.</p>
                <button
                  onClick={selectAll}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#345457' }}
                >
                  Ver todos los libros
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {books.map(book => <BookCard key={book.id} book={book} />)}
                </div>
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-300"
                      style={{ color: '#345457', borderColor: '#345457' }}
                    >
                      {loadingMore ? 'Cargando…' : 'Cargar más'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
