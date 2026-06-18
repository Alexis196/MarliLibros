'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

// ─── Types ────────────────────────────────────────────────────────────────────

type Book = {
  id: string;
  title: string;
  author_name: string;
  category: string;
  price: number;
  description?: string;
  cover_url?: string;
  new_until?: string;
  rating?: number;
  pages?: number;
  year?: number;
};

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function CartIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
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

// ─── BookCard ─────────────────────────────────────────────────────────────────

function BookCard({ book }: { book: Book }) {
  const now = new Date().toISOString();
  const isNew = book.new_until && book.new_until > now;
  const { addItem } = useCart();

  return (
    <div
      className="bg-white overflow-hidden group border border-black/5 transition-all duration-300 hover:-translate-y-1"
      style={{ borderRadius: '18px', boxShadow: '0 8px 24px rgba(52,84,87,0.06)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 14px 32px rgba(52,84,87,0.13)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(52,84,87,0.06)'; }}
    >
      <Link href={`/libro/${book.id}`}>
        <div className="relative w-full bg-gray-100" style={{ paddingTop: '145%' }}>
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, #345457, #587F82)' }} />
          )}
          {isNew && (
            <span
              className="absolute top-2 left-2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
              style={{ backgroundColor: '#587F82' }}
            >
              Nuevo
            </span>
          )}
        </div>
      </Link>
      <div className="p-3.5">
        <Link href={`/libro/${book.id}`} className="text-[12px] font-bold text-gray-800 leading-tight line-clamp-2 mb-1 hover:text-[#345457] transition-colors duration-300 block">
          {book.title}
        </Link>
        <Link href={`/catalogo?autor=${encodeURIComponent(book.author_name)}`} className="text-[11px] text-gray-400 mb-1.5 hover:text-[#345457] transition-colors duration-300 block">
          {book.author_name}
        </Link>
        <p className="text-[9px] font-semibold uppercase tracking-wide mb-3" style={{ color: '#7A9C96' }}>{book.category}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: '#345457' }}>{formatPrice(book.price)}</span>
          <button
            onClick={() => addItem(book)}
            aria-label="Agregar al carrito"
            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#345457] hover:text-white hover:border-transparent transition-all duration-300"
          >
            <CartIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CatalogoPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showNovedades, setShowNovedades] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);

  // Read URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('categoria');
    const nov = params.get('novedades');
    const author = params.get('autor');
    if (cat) setSelectedCategory(decodeURIComponent(cat));
    if (nov === '1') setShowNovedades(true);
    if (author) setSelectedAuthor(decodeURIComponent(author));
  }, []);

  // Fetch books
  useEffect(() => {
    supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBooks(data ?? []);
        setLoading(false);
      });
  }, []);

  const now = new Date().toISOString();

  const filtered = books.filter(b => {
    if (showNovedades && !(b.new_until && b.new_until > now)) return false;
    if (selectedCategory && b.category !== selectedCategory) return false;
    if (selectedAuthor && b.author_name !== selectedAuthor) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!b.title.toLowerCase().includes(q) && !b.author_name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const pageTitle = selectedAuthor
    ? `Libros de ${selectedAuthor}`
    : showNovedades
    ? 'Novedades'
    : selectedCategory
    ? selectedCategory
    : 'Catálogo completo';

  const selectCategory = (cat: string | null) => {
    setSelectedCategory(cat);
    setShowNovedades(false);
    setSelectedAuthor(null);
  };

  const selectNovedades = () => {
    setShowNovedades(true);
    setSelectedCategory(null);
    setSelectedAuthor(null);
  };

  const selectAll = () => {
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
                {loading ? 'Cargando…' : `${filtered.length} ${filtered.length === 1 ? 'título encontrado' : 'títulos encontrados'}`}
              </span>
            </div>

            {/* Search bar */}
            <div className="mb-4 lg:max-w-sm">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 transition-all duration-300 focus-within:border-[#345457] focus-within:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]">
                <span className="text-gray-400"><SearchIcon /></span>
                <input
                  type="text"
                  placeholder="Buscar por título o autor..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 py-2.5 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500 text-xs">✕</button>
                )}
              </div>
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
                  onClick={() => setSelectedAuthor(null)}
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
            ) : filtered.length === 0 ? (
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filtered.map(book => <BookCard key={book.id} book={book} />)}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
