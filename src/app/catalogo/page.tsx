'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

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

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
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

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const catTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openCat = () => {
    if (catTimer.current) clearTimeout(catTimer.current);
    setCatOpen(true);
  };
  const closeCat = () => {
    catTimer.current = setTimeout(() => setCatOpen(false), 120);
  };

  return (
    <nav
      className="bg-white sticky top-0 z-50 transition-all duration-300"
      style={{ boxShadow: scrolled ? '0 2px 16px rgba(27,46,94,0.07)' : 'none' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-20">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image src="/logo.png" alt="Marli Libros" width={160} height={52} style={{ objectFit: 'contain', height: '48px', width: 'auto' }} />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5">
          <div className="relative" onMouseEnter={openCat} onMouseLeave={closeCat}>
            <Link
              href="/catalogo"
              className="flex items-center gap-1 text-base font-medium text-[#345457] transition-colors whitespace-nowrap"
            >
              Categorías <ChevronDownIcon />
            </Link>
            {catOpen && (
              <div
                className="absolute top-full left-0 mt-1 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50"
                onMouseEnter={openCat}
                onMouseLeave={closeCat}
              >
                <Link
                  href="/catalogo"
                  onClick={() => setCatOpen(false)}
                  className="block px-4 py-2 text-sm font-semibold text-gray-700 hover:text-[#345457] hover:bg-gray-50 transition-colors"
                >
                  Todos
                </Link>
                <div className="my-1 h-px bg-gray-100 mx-3" />
                {ALL_CATEGORIES.map(cat => (
                  <Link
                    key={cat}
                    href={`/catalogo?categoria=${encodeURIComponent(cat)}`}
                    onClick={() => setCatOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-[#345457] hover:bg-gray-50 transition-colors"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link href="/catalogo?novedades=1" className="text-base font-medium text-gray-500 hover:text-[#345457] transition-colors whitespace-nowrap">
            Novedades
          </Link>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-3 sm:gap-4" style={{ color: '#345457' }}>
          <button className="hover:opacity-60 transition-opacity"><SearchIcon /></button>
          <button className="hidden sm:block hover:opacity-60 transition-opacity"><UserIcon /></button>
          <button className="relative hover:opacity-60 transition-opacity">
            <CartIcon />
            <span
              className="absolute -top-1.5 -right-1.5 text-white text-[10px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center"
              style={{ backgroundColor: '#587F82' }}
            >
              2
            </span>
          </button>
          <button
            className="md:hidden p-1 hover:opacity-60 transition-opacity"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 flex flex-col gap-0.5">
            <button
              onClick={() => setMobileCatOpen(!mobileCatOpen)}
              className="flex items-center justify-between w-full py-2.5 px-3 rounded-xl text-left text-[15px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span>Categorías</span>
              <span style={{ display: 'inline-block', transform: mobileCatOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <ChevronDownIcon />
              </span>
            </button>
            {mobileCatOpen && (
              <div className="pl-3 flex flex-col gap-0.5 pb-1">
                <Link
                  href="/catalogo"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 px-3 rounded-lg text-[14px] font-medium text-gray-500 hover:text-[#345457] hover:bg-gray-50 transition-colors"
                >
                  Todos
                </Link>
                {ALL_CATEGORIES.map(cat => (
                  <Link
                    key={cat}
                    href={`/catalogo?categoria=${encodeURIComponent(cat)}`}
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 px-3 rounded-lg text-[14px] text-gray-500 hover:text-[#345457] hover:bg-gray-50 transition-colors"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            )}
            <Link
              href="/catalogo?novedades=1"
              className="flex items-center w-full py-2.5 px-3 rounded-xl text-[15px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Novedades
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── BookCard ─────────────────────────────────────────────────────────────────

function BookCard({ book }: { book: Book }) {
  const now = new Date().toISOString();
  const isNew = book.new_until && book.new_until > now;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
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
      <div className="p-3">
        <p className="text-[12px] font-bold text-gray-800 leading-tight line-clamp-2 mb-0.5">{book.title}</p>
        <Link href={`/catalogo?autor=${encodeURIComponent(book.author_name)}`} className="text-[11px] text-gray-400 mb-1 hover:text-[#345457] transition-colors block">
          {book.author_name}
        </Link>
        <p className="text-[10px] text-gray-300 mb-3">{book.category}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: '#345457' }}>{formatPrice(book.price)}</span>
          <button className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#345457] hover:text-white hover:border-transparent transition-all">
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
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse">
      <div className="bg-gray-200" style={{ paddingTop: '145%' }} />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3 mt-2" />
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ backgroundColor: '#1E3134' }} className="text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/" className="shrink-0">
          <Image src="/logo.png" alt="Marli Libros" width={140} height={46} style={{ objectFit: 'contain', height: '38px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
        </Link>
        <p className="text-[12px] text-white/35">© 2026 Marli Libros. Todos los derechos reservados.</p>
      </div>
    </footer>
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
      <main style={{ background: '#F7F9F8', minHeight: '100vh' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

          {/* Breadcrumb + title */}
          <div className="flex items-center gap-2 mb-6 text-sm">
            <Link href="/" className="text-gray-400 hover:text-[#345457] transition-colors">Inicio</Link>
            <span className="text-gray-300">/</span>
            <span className="font-semibold" style={{ color: '#345457' }}>{pageTitle}</span>
          </div>

          {/* Search bar */}
          <div className="mb-5 max-w-md">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white shadow-sm px-3">
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
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={selectAll}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all border"
              style={
                !selectedCategory && !showNovedades
                  ? { backgroundColor: '#345457', color: 'white', borderColor: '#345457' }
                  : { backgroundColor: 'white', color: '#6b7280', borderColor: '#e5e7eb' }
              }
            >
              <FilterIcon /> Todos
            </button>
            <button
              onClick={selectNovedades}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all border"
              style={
                showNovedades
                  ? { backgroundColor: '#587F82', color: 'white', borderColor: '#587F82' }
                  : { backgroundColor: 'white', color: '#6b7280', borderColor: '#e5e7eb' }
              }
            >
              ✦ Novedades
            </button>
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => selectCategory(cat === selectedCategory ? null : cat)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all border"
                style={
                  selectedCategory === cat
                    ? { backgroundColor: '#345457', color: 'white', borderColor: '#345457' }
                    : { backgroundColor: 'white', color: '#6b7280', borderColor: '#e5e7eb' }
                }
              >
                {cat}
              </button>
            ))}
            {selectedAuthor && (
              <button
                onClick={() => setSelectedAuthor(null)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border"
                style={{ backgroundColor: '#B8924A', color: '#345457', borderColor: '#B8924A' }}
              >
                {selectedAuthor} ✕
              </button>
            )}
          </div>

          {/* Count */}
          <p className="text-sm text-gray-400 mb-6">
            {loading ? 'Cargando...' : `${filtered.length} ${filtered.length === 1 ? 'título encontrado' : 'títulos encontrados'}`}
          </p>

          {/* Grid */}
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
      </main>
      <Footer />
    </>
  );
}
