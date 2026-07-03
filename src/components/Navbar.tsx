'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';

const CATEGORY_NAMES = [
  'Libros',
  'Desarrollo Personal',
  'Tarot y Oráculos',
  'Rompecabezas',
  'Juegos Didácticos',
  'Agendas y Cuadernos',
];

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
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

export function Navbar() {
  const { totalItems, openDrawer } = useCart();
  const { favoriteIds } = useFavorites();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!catOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [catOpen]);

  return (
    <nav
      className="bg-[#FCFBF8] sticky top-0 z-50 transition-all duration-300"
      style={{ boxShadow: scrolled ? '0 2px 16px rgba(27,46,94,0.07)' : 'none' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-20">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <div
            role="img"
            aria-label="Marli Libros"
            style={{
              height: '55px',
              aspectRatio: '460 / 125',
              backgroundColor: '#345457',
              WebkitMaskImage: 'url(/logo.png)',
              maskImage: 'url(/logo.png)',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'left center',
              maskPosition: 'left center',
            }}
          />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-5">
          <div className="relative" ref={catRef}>
            <button
              type="button"
              onClick={() => setCatOpen(prev => !prev)}
              className="group relative flex items-center gap-1 text-base font-medium text-gray-500 hover:text-[#345457] transition-colors duration-300 whitespace-nowrap cursor-pointer"
            >
              Categorías
              <span style={{ display: 'inline-block', transform: catOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <ChevronDownIcon />
              </span>
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-[#C8A86B] transition-all duration-300 group-hover:w-[calc(100%-16px)]" />
            </button>
            {catOpen && (
              <div
                className="absolute top-full left-0 mt-1 w-52 bg-[#FCFBF8] rounded-2xl shadow-xl border border-gray-100 py-2 z-50"
              >
                <Link
                  href="/catalogo"
                  onClick={() => setCatOpen(false)}
                  className="block px-4 py-2 text-sm font-semibold text-gray-700 hover:text-[#345457] hover:bg-gray-50 transition-colors duration-300"
                >
                  Todos
                </Link>
                <div className="my-1 h-px bg-gray-100 mx-3" />
                {CATEGORY_NAMES.map(cat => (
                  <Link
                    key={cat}
                    href={`/catalogo?categoria=${encodeURIComponent(cat)}`}
                    onClick={() => setCatOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-[#345457] hover:bg-gray-50 transition-colors duration-300"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/catalogo?novedades=1"
            className="group relative text-base font-medium text-gray-500 hover:text-[#345457] transition-colors duration-300 whitespace-nowrap"
          >
            Novedades
            <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-[#C8A86B] transition-all duration-300 group-hover:w-full" />
          </Link>
        </div>

        {/* Right: icons + hamburger */}
        <div className="flex items-center gap-3 sm:gap-4" style={{ color: '#345457' }}>
          <Link href="/login" aria-label="Iniciar sesión" className="hover:opacity-60 transition-opacity"><UserIcon /></Link>
          <Link href="/favoritos" aria-label="Ver favoritos" className="relative hidden sm:block hover:opacity-60 transition-opacity">
            <HeartIcon />
            {favoriteIds.length > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 text-white text-[10px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center"
                style={{ backgroundColor: '#C8A86B' }}
              >
                {favoriteIds.length}
              </span>
            )}
          </Link>
          <button onClick={openDrawer} aria-label="Ver carrito" className="relative hover:opacity-60 transition-opacity cursor-pointer p-1.5 -m-1.5">
            <CartIcon />
            {totalItems > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 text-white text-[10px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center"
                style={{ backgroundColor: '#587F82' }}
              >
                {totalItems}
              </span>
            )}
          </button>
          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-2 -m-1 hover:opacity-60 transition-opacity"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-[#FCFBF8]">
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
                  className="block py-2 px-3 rounded-lg text-[14px] font-medium text-gray-500 hover:text-[#345457] hover:bg-gray-50 transition-colors duration-300"
                >
                  Todos
                </Link>
                {CATEGORY_NAMES.map(cat => (
                  <Link
                    key={cat}
                    href={`/catalogo?categoria=${encodeURIComponent(cat)}`}
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 px-3 rounded-lg text-[14px] text-gray-500 hover:text-[#345457] hover:bg-gray-50 transition-colors duration-300"
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
            <Link
              href="/favoritos"
              className="flex items-center w-full py-2.5 px-3 rounded-xl text-[15px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              ♡ Favoritos
            </Link>
            <div className="my-1.5 h-px bg-gray-100 mx-1" />
            <Link
              href="/admin"
              className="flex items-center w-full py-2.5 px-3 rounded-xl text-[15px] font-medium hover:bg-gray-50 transition-colors"
              style={{ color: '#345457' }}
              onClick={() => setMenuOpen(false)}
            >
              ⚙ Admin
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
