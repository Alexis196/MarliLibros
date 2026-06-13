'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect, RefObject } from 'react';
import { supabase } from '@/lib/supabase';

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

type Author = {
  id: string;
  name: string;
  nationality?: string;
  bio?: string;
  photo_url?: string;
};

function useStoreData() {
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('books').select('*').order('created_at', { ascending: false }),
      supabase.from('authors').select('*').order('name'),
    ]).then(([booksRes, authorsRes]) => {
      setBooks(booksRes.data ?? []);
      setAuthors(authorsRes.data ?? []);
      setLoading(false);
    });
  }, []);

  const now = new Date().toISOString();
  const novedades = books.filter(b => b.new_until && b.new_until > now);
  const categoryCounts = books.reduce<Record<string, number>>((acc, b) => {
    acc[b.category] = (acc[b.category] ?? 0) + 1;
    return acc;
  }, {});

  return { books, novedades, authors, categoryCounts, loading };
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
}

function BookCard({ book }: { book: Book }) {
  const now = new Date().toISOString();
  const isNew = book.new_until && book.new_until > now;
  return (
    <div className="w-40 sm:w-52 flex-shrink-0 bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
      <div className="relative h-52 sm:h-64 w-full bg-gray-100">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: 'linear-gradient(145deg, #345457, #587F82)' }} />
        )}
        {isNew && (
          <span className="absolute top-2 left-2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide" style={{ backgroundColor: '#587F82' }}>
            Nuevo
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-[12px] font-bold text-gray-800 leading-tight line-clamp-2 mb-0.5">{book.title}</p>
        <Link href={`/catalogo?autor=${encodeURIComponent(book.author_name)}`} className="text-[11px] text-gray-400 mb-3 hover:text-[#345457] transition-colors block">
          {book.author_name}
        </Link>
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

function BookCarousel({ books, loading }: { books: Book[]; loading: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <button onClick={() => scroll('left')} className="hidden sm:flex absolute -left-4 top-[45%] -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md items-center justify-center text-gray-500 hover:text-[#345457] transition-colors border border-gray-100">
        <ChevronLeftIcon />
      </button>
      <div ref={scrollRef} className="overflow-x-auto scrollbar-hide pb-2">
        <div className="flex gap-3 sm:gap-4" style={{ width: 'max-content' }}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-40 sm:w-52 flex-shrink-0 bg-white rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-52 sm:h-64 bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            : books.map(book => <BookCard key={book.id} book={book} />)
          }
        </div>
      </div>
      <button onClick={() => scroll('right')} className="hidden sm:flex absolute -right-4 top-[45%] -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md items-center justify-center text-gray-500 hover:text-[#345457] transition-colors border border-gray-100">
        <ChevronRightIcon />
      </button>
    </div>
  );
}

// ─── Base Icons ───────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
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

function CartIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
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

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="m9 18 6-6-6-6" />
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

// ─── Category Icons ───────────────────────────────────────────────────────────

function IconBook() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#345457" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconBrain() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#345457" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-3.16A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-3.16A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#345457" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
  );
}

function IconPuzzle() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#345457" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 2c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z" />
    </svg>
  );
}

function IconDice() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#345457" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <path d="M16 8h.01" /><path d="M8 8h.01" /><path d="M8 16h.01" />
      <path d="M16 16h.01" /><path d="M12 12h.01" />
    </svg>
  );
}

function IconNotebook() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#345457" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6h4" /><path d="M2 10h4" /><path d="M2 14h4" /><path d="M2 18h4" />
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <path d="M16 2v20" />
    </svg>
  );
}

// ─── Benefit Icons ────────────────────────────────────────────────────────────

function IconTruck() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
      <rect width="7" height="7" x="14" y="10" rx="1" />
      <path d="M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0" />
      <path d="M17 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="1" fill="white" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// ─── Social Icons ─────────────────────────────────────────────────────────────

function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

// ─── Fade-up hook ─────────────────────────────────────────────────────────────

function useFadeUp(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Categorías', href: '/catalogo', dropdown: true },
  { label: 'Novedades', href: '/catalogo?novedades=1' },
];

const CATEGORIES = [
  { name: 'Libros', Icon: IconBook, count: '184' },
  { name: 'Desarrollo Personal', Icon: IconBrain, count: '62' },
  { name: 'Tarot y Oráculos', Icon: IconSparkles, count: '45' },
  { name: 'Rompecabezas', Icon: IconPuzzle, count: '38' },
  { name: 'Juegos Didácticos', Icon: IconDice, count: '71' },
  { name: 'Agendas y Cuadernos', Icon: IconNotebook, count: '29' },
];


const BENEFITS = [
  { Icon: IconTruck, title: 'Envíos en 24–48 hs', desc: 'A todo el país, desde $X en adelante' },
  { Icon: IconLock, title: 'Compra 100% segura', desc: 'Tus datos siempre protegidos' },
  { Icon: IconBox, title: 'Stock garantizado', desc: 'Solo vendemos lo que tenemos' },
  { Icon: IconChat, title: 'Atención personalizada', desc: 'Respondemos en menos de 1 hora' },
];

const FOOTER_LINKS: Record<string, string[]> = {
  Institucional: ['Nosotros', 'Preguntas frecuentes', 'Formas de pago', 'Envíos', 'Cambios y devoluciones', 'Contacto'],
  Categorías: ['Libros', 'Desarrollo Personal', 'Tarot y Oráculos', 'Rompecabezas', 'Juegos Didácticos', 'Agendas y Cuadernos'],
  Información: ['Términos y condiciones', 'Política de privacidad', 'Libro de quejas'],
};

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
      style={{
        boxShadow: scrolled ? '0 2px 16px rgba(27,46,94,0.07)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-20">
        {/* Logo */}
        <div className="shrink-0">
          <Image src="/logo.png" alt="Marli Libros" width={160} height={52} style={{ objectFit: 'contain', height: '48px', width: 'auto' }} />
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-5">
          <div className="relative" onMouseEnter={openCat} onMouseLeave={closeCat}>
            <Link
              href="/catalogo"
              className="flex items-center gap-1 text-base font-medium text-gray-500 hover:text-[#345457] transition-colors whitespace-nowrap"
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
                {CATEGORIES.map(cat => (
                  <Link
                    key={cat.name}
                    href={`/catalogo?categoria=${encodeURIComponent(cat.name)}`}
                    onClick={() => setCatOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-[#345457] hover:bg-gray-50 transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/catalogo?novedades=1"
            className="text-base font-medium text-gray-500 hover:text-[#345457] transition-colors whitespace-nowrap"
          >
            Novedades
          </Link>
        </div>

        {/* Right: icons + hamburger */}
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
          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-1 hover:opacity-60 transition-opacity"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
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
                {CATEGORIES.map(cat => (
                  <Link
                    key={cat.name}
                    href={`/catalogo?categoria=${encodeURIComponent(cat.name)}`}
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 px-3 rounded-lg text-[14px] text-gray-500 hover:text-[#345457] hover:bg-gray-50 transition-colors"
                  >
                    {cat.name}
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

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const [query, setQuery] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const section = canvas.parentElement as HTMLElement;

    const resize = () => {
      canvas.width = section.offsetWidth;
      canvas.height = section.offsetHeight;
    };
    resize();

    type P = { x: number; y: number; vx: number; vy: number; alpha: number; decay: number; size: number; rot: number; rotSpeed: number };
    const particles: P[] = [];

    const spawn = (x: number, y: number) => {
      for (let i = 0; i < 2; i++) {
        particles.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -(Math.random() * 1.4 + 0.4),
          alpha: Math.random() * 0.15 + 0.85,
          decay: Math.random() * 0.013 + 0.010,
          size: Math.random() * 2.5 + 1.5,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.12,
        });
      }
    };

    const star = (x: number, y: number, r: number, angle: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        const b = a + Math.PI / 4;
        ctx.lineTo(Math.cos(b) * r * 0.3, Math.sin(b) * r * 0.3);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.alpha -= p.decay; p.rot += p.rotSpeed;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = '#B8924A';
        ctx.shadowColor = '#B8924A';
        ctx.shadowBlur = 10;
        star(p.x, p.y, p.size, p.rot);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      const r = section.getBoundingClientRect();
      spawn(e.clientX - r.left, e.clientY - r.top);
    };

    section.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(tick);
    return () => { section.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section
      className="relative overflow-hidden md:min-h-[580px] flex flex-col md:flex-row"
      style={{
        background: '#F7F9F8',
        width: '95%',
        margin: '0 auto',
        borderRadius: '10px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
      }}
    >
      {/* Columna izquierda: texto */}
      <div className="relative z-20 flex-1 flex items-center px-4 sm:px-10 py-12 md:py-20">
        <div className="max-w-xl space-y-5 sm:space-y-6">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest px-3 py-1 rounded border uppercase"
            style={{ color: '#B8924A', borderColor: '#B8924A', backgroundColor: '#F7F9F8' }}
          >
            ✦ Novedades 2026
          </span>

          <h1
            className="font-black tracking-tight leading-[1.05]"
            style={{ color: '#345457', fontSize: 'clamp(38px, 5vw, 68px)' }}
          >
            Encontrá tu próxima historia
          </h1>

          <p className="text-gray-500 text-[15px] leading-relaxed max-w-sm">
            Libros, juegos didácticos, agendas, tarot, rompecabezas y mucho más para inspirar tu día a día.
          </p>

          <div className="space-y-2">
            <div className="flex rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white">
              <div className="flex items-center gap-2 flex-1 px-3 sm:px-4 text-gray-400 min-w-0">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Buscar libros, autores..."
                  className="flex-1 py-3 text-sm outline-none bg-transparent text-gray-600 placeholder-gray-400 min-w-0"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
              <button
                className="px-4 sm:px-5 py-3 text-sm font-semibold text-white shrink-0 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#345457' }}
              >
                Buscar
              </button>
            </div>
            <p className="text-[12px] text-gray-400 pl-1">
              ✦ Más de <strong className="text-gray-500">12.000 títulos</strong> disponibles
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <Link
              href="/catalogo"
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#345457' }}
            >
              📖 Explorar catálogo
            </Link>
            <Link
              href="/catalogo?novedades=1"
              className="flex items-center gap-1 text-sm font-medium transition-all hover:gap-2"
              style={{ color: '#345457' }}
            >
              Ver novedades <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Columna derecha: imagen sin caja visible */}
      <div className="relative hidden md:block md:w-[52%] shrink-0">
        <Image
          src="/bgGreen.jpeg"
          alt=""
          fill
          style={{ objectFit: 'cover', objectPosition: 'center center' }}
          priority
        />
        {/* Fade izquierdo para fundir con el fondo del hero sin corte visible */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #F7F9F8 0%, transparent 18%)' }}
        />
      </div>

      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 30 }} />
    </section>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────

function Categories({ categoryCounts }: { categoryCounts: Record<string, number> }) {
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  return (
    <section
      ref={ref}
      className="py-12 sm:py-16 bg-white"
      style={{ opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#345457' }}>Explorá por categoría</h2>
          <Link href="/catalogo" className="text-sm text-gray-400 hover:text-[#345457] transition-colors whitespace-nowrap">
            Ver todas →
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {CATEGORIES.map(cat => {
            const Icon = cat.Icon;
            const count = categoryCounts[cat.name] ?? 0;
            return (
              <Link
                href={`/catalogo?categoria=${encodeURIComponent(cat.name)}`}
                key={cat.name}
                className="group flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-5 bg-white rounded-2xl border border-gray-100 hover:border-[#B8924A] hover:-translate-y-1 transition-all cursor-pointer"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(52,84,87,0.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
              >
                <div
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: '#E5E9E8' }}
                >
                  <Icon />
                </div>
                <span className="text-[11px] sm:text-[13px] font-semibold text-center text-gray-700 leading-tight">{cat.name}</span>
                <span className="text-[10px] sm:text-[11px] text-gray-400 group-hover:text-[#B8924A] transition-colors">{count} títulos</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Novedades ────────────────────────────────────────────────────────────────

function Novedades({ books, loading }: { books: Book[]; loading: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  if (!loading && books.length === 0) return null;

  return (
    <section
      ref={ref}
      className="py-12 sm:py-16"
      style={{
        opacity: 0,
        transform: 'translateY(24px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        backgroundColor: '#F7F9F8',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 sm:mb-10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#345457' }}>Novedades</h2>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide text-white"
              style={{ backgroundColor: '#587F82' }}
            >
              Últimos 7 días
            </span>
          </div>
          <Link href="/catalogo?novedades=1" className="text-sm text-gray-400 hover:text-[#345457] transition-colors whitespace-nowrap">
            Ver todas →
          </Link>
        </div>
        <BookCarousel books={books} loading={loading} />
      </div>
    </section>
  );
}

// ─── All Books ────────────────────────────────────────────────────────────────

function AllBooks({ books, loading }: { books: Book[]; loading: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  return (
    <section
      ref={ref}
      className="py-12 sm:py-16 bg-white"
      style={{ opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#345457' }}>Catálogo destacado</h2>
          <Link href="/catalogo" className="text-sm text-gray-400 hover:text-[#345457] transition-colors whitespace-nowrap">
            Ver catálogo completo →
          </Link>
        </div>
        <BookCarousel books={books} loading={loading} />
      </div>
    </section>
  );
}

// ─── Benefits ─────────────────────────────────────────────────────────────────

function Benefits() {
  return (
    <section className="py-10 sm:py-12" style={{ backgroundColor: '#345457' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {BENEFITS.map((b, i) => {
            const Icon = b.Icon;
            return (
              <div
                key={i}
                className={`flex items-center gap-4 text-white ${i > 0 ? 'sm:border-t-0 lg:border-l lg:border-white/10 lg:pl-6' : ''}`}
              >
                <div className="shrink-0 opacity-90">
                  <Icon />
                </div>
                <div>
                  <p className="font-semibold text-[13px]">{b.title}</p>
                  <p className="text-[12px] text-white/55">{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Featured Authors ─────────────────────────────────────────────────────────

function FeaturedAuthors({ authors, loading }: { authors: Author[]; loading: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  return (
    <section
      ref={ref}
      className="py-12 sm:py-16 bg-white"
      style={{ opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#345457' }}>Autores destacados</h2>
          <button className="text-sm text-gray-400 hover:text-[#345457] transition-colors whitespace-nowrap">
            Ver todos →
          </button>
        </div>

        <div className="relative">
          <button className="hidden sm:flex absolute -left-4 top-[45%] -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md items-center justify-center text-gray-500 hover:text-[#345457] transition-colors border border-gray-100">
            <ChevronLeftIcon />
          </button>

          <div className="flex gap-6 sm:gap-10 overflow-x-auto scrollbar-hide pb-2 px-1">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 flex-shrink-0 animate-pulse">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gray-200" />
                    <div className="space-y-1.5">
                      <div className="h-2.5 bg-gray-200 rounded w-16" />
                      <div className="h-2 bg-gray-100 rounded w-12 mx-auto" />
                    </div>
                  </div>
                ))
              : authors.map(author => (
                  <Link
                    key={author.id}
                    href={`/catalogo?autor=${encodeURIComponent(author.name)}`}
                    className="flex flex-col items-center gap-3 flex-shrink-0 cursor-pointer group"
                  >
                    <div
                      className="w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden group-hover:ring-2 group-hover:ring-offset-2 transition-all"
                      style={{ ringColor: '#B8924A' } as React.CSSProperties}
                    >
                      {author.photo_url ? (
                        <img src={author.photo_url} alt={author.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: '#345457' }}>
                          {author.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-[12px] font-semibold text-gray-700 leading-tight group-hover:text-[#345457] transition-colors">{author.name}</p>
                      {author.nationality && (
                        <p className="text-[11px] text-gray-400 mt-0.5">{author.nationality}</p>
                      )}
                    </div>
                  </Link>
                ))
            }
          </div>

          <button className="hidden sm:flex absolute -right-4 top-[45%] -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md items-center justify-center text-gray-500 hover:text-[#345457] transition-colors border border-gray-100">
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── About Marli ──────────────────────────────────────────────────────────────

function IconHeartOutline() {
  return (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}
function IconBookOpenOutline() {
  return (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}
function IconUsersOutline() {
  return (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}
function IconCompassOutline() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12Z" />
    </svg>
  );
}

const ABOUT_PILLARS = [
  { Icon: IconHeartOutline, label: 'Pasión\npor los libros' },
  { Icon: IconBookOpenOutline, label: 'Lecturas que\ntransforman' },
  { Icon: IconUsersOutline, label: 'Comunidad que\nacompaña' },
];

function AboutMarli() {
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  return (
    <section
      ref={ref}
      className="py-16 sm:py-24"
      style={{
        opacity: 0,
        transform: 'translateY(24px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        background: '#F5F1EA',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-start">

          {/* ── Columna izquierda: foto + pilares ── */}
          <div className="flex flex-col gap-5">
            <div className="flex justify-center" style={{ backgroundColor: '#F5F1EA' }}>
              <Image
                src="/marli.png"
                alt="Marli"
                width={460}
                height={460}
                className="w-full max-w-xs sm:max-w-sm object-contain"
                style={{ mixBlendMode: 'multiply' }}
              />
            </div>

            {/* 3 pillar cards */}
            <div className="grid grid-cols-3 gap-3">
              {ABOUT_PILLARS.map(({ Icon, label }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl py-4 px-2 flex flex-col items-center text-center gap-2 shadow-sm"
                >
                  <span style={{ color: '#B8924A' }}><Icon /></span>
                  <span className="text-[11px] text-gray-500 leading-tight whitespace-pre-line">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Columna derecha: texto ── */}
          <div className="relative">
            {/* Sparkles decorativos */}
            <svg width="18" height="18" viewBox="0 0 16 16" fill="#B8924A" className="absolute -top-2 right-10 opacity-70">
              <path d="M8 0L9.2 6.8L16 8L9.2 9.2L8 16L6.8 9.2L0 8L6.8 6.8Z" />
            </svg>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="#B8924A" className="absolute top-6 right-2 opacity-50">
              <path d="M8 0L9.2 6.8L16 8L9.2 9.2L8 16L6.8 9.2L0 8L6.8 6.8Z" />
            </svg>

            {/* Badge */}
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest px-4 py-1.5 rounded-full border uppercase mb-5"
              style={{ color: '#B8924A', borderColor: '#B8924A' }}
            >
              ✦ Sobre Marli
            </span>

            {/* Título */}
            <h2
              className="text-3xl sm:text-4xl font-bold leading-tight mb-3"
              style={{ color: '#1E3134', fontFamily: 'var(--font-playfair)' }}
            >
              Más que libros,<br />un camino compartido
            </h2>
            {/* Línea dorada bajo el título */}
            <div
              style={{
                width: '110px', height: '3px', borderRadius: '2px',
                background: 'linear-gradient(to right, #B8924A, rgba(184,146,74,0.1))',
                marginBottom: '28px',
              }}
            />

            <p className="text-gray-600 text-[15px] leading-relaxed mb-4">
              Marlilibros es el reflejo de mi viaje personal. A lo largo de los años, descubrí en la lectura una forma de transformar mi vida y, hoy, mi mayor deseo es compartir ese legado contigo.
            </p>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-4">
              Entiendo la selección de cada libro como un acto de cuidado: elijo títulos que invitan a mirar hacia adentro y que actúan como faros en momentos de búsqueda. Marlilibros es mi manera de sembrar luz y construir una comunidad donde cada lectura sea una oportunidad de crecimiento.
            </p>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-8">
              Te invito a recorrer este espacio como lo que es: un lugar donde las palabras se convierten en herramientas para sanar y evolucionar.
            </p>

            {/* CTA box */}
            <Link
              href="/catalogo"
              className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div
                className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center border-2"
                style={{ borderColor: '#1E3134', color: '#1E3134' }}
              >
                <IconCompassOutline />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px]" style={{ color: '#1E3134' }}>
                  ¿Qué libro te está buscando hoy?
                </p>
                <p className="text-[12px] text-gray-400">Quizás ya esté aquí, esperándote.</p>
              </div>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: '#B8924A', flexShrink: 0 }}>
                <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4.167 10h11.666M10 4.167 15.833 10 10 15.833" />
              </svg>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── Newsletter ───────────────────────────────────────────────────────────────

function Newsletter() {
  const [email, setEmail] = useState('');
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  return (
    <section
      ref={ref}
      className="py-16 sm:py-20 text-center"
      style={{
        opacity: 0,
        transform: 'translateY(24px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        background: 'linear-gradient(135deg, #345457 0%, #587F82 100%)',
      }}
    >
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest px-3 py-1 rounded border uppercase mb-6"
          style={{ color: '#B8924A', borderColor: 'rgba(234,215,181,0.5)', backgroundColor: 'rgba(234,215,181,0.1)' }}
        >
          ✦ Newsletter
        </span>

        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
          Lecturas, ofertas y novedades
        </h3>
        <p className="text-white/60 text-[14px] mb-8">
          Sin spam. Solo lo que vale la pena leer.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="email"
            placeholder="tu@email.com"
            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none border text-white placeholder-white/40 focus:border-[#B8924A] transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }}
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button
            className="w-full sm:w-auto px-5 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
            style={{ backgroundColor: '#B8924A', color: '#345457' }}
          >
            Suscribirme
          </button>
        </div>
        <p className="text-[12px] text-white/40">
          📚 +4.800 lectores ya suscritos
        </p>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ backgroundColor: '#1E3134' }} className="text-white pt-12 sm:pt-14 pb-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-3">
              <Image src="/logo.png" alt="Marli Libros" width={140} height={46} style={{ objectFit: 'contain', height: '40px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
            </div>
            <div className="w-8 h-px mb-4" style={{ backgroundColor: '#B8924A', opacity: 0.5 }} />
            <p className="text-[12px] text-white/55 leading-relaxed mb-5">
              Desde 1999 acompañamos tu pasión por la lectura con una cuidada selección de libros y productos para todas las edades.
            </p>
            <div className="flex gap-3 text-white/60">
              <button className="hover:text-white transition-colors"><IconInstagram /></button>
              <button className="hover:text-white transition-colors"><IconFacebook /></button>
              <button className="hover:text-white transition-colors"><IconWhatsApp /></button>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-bold text-[13px] mb-4">{title}</h4>
              <ul className="space-y-2">
                {items.map(item => (
                  <li key={item}>
                    <a href="#" className="text-[12px] text-white/55 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-bold text-[13px] mb-4">Medios de pago</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {['VISA', 'Mastercard', 'MercadoPago'].map(m => (
                <span key={m} className="px-2.5 py-1 bg-white rounded text-[11px] font-bold" style={{ color: '#345457' }}>
                  {m}
                </span>
              ))}
            </div>
            <p className="text-[12px] text-white/55">Transferencia bancaria</p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-[12px] text-white/35">© 2026 Marli Libros. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { books, novedades, authors, categoryCounts, loading } = useStoreData();

  return (
    <main style={{ backgroundImage: 'url(/bgGreen.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      <Navbar />
      <Hero />
      <Categories categoryCounts={categoryCounts} />
      <Novedades books={novedades} loading={loading} />
      <AllBooks books={books} loading={loading} />
      <Benefits />
      <FeaturedAuthors authors={authors} loading={loading} />
      <AboutMarli />
      <Newsletter />
      <Footer />
    </main>
  );
}
