'use client';

import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { formatPrice } from '@/lib/format';

export type Book = {
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
  featured?: boolean;
  stock?: number | null;
};

function CartIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#C8A86B' : 'none'} stroke={filled ? '#C8A86B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function RatingStars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <p className="text-[10px] mb-1.5 tracking-tight">
      <span style={{ color: '#C8A86B' }}>{'★'.repeat(rounded)}</span>
      <span className="text-gray-300">{'★'.repeat(5 - rounded)}</span>
      <span className="text-gray-400 ml-1">{rating.toFixed(1)}</span>
    </p>
  );
}

export function BookCard({ book }: { book: Book }) {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const now = new Date().toISOString();
  const isNew = book.new_until && book.new_until > now;
  const outOfStock = book.stock === 0;
  const lowStock = typeof book.stock === 'number' && book.stock > 0 && book.stock <= 3;
  const favorited = isFavorite(book.id);

  return (
    <div className="w-full bg-white rounded-[18px] overflow-hidden border border-black/5 shadow-[0_8px_24px_rgba(52,84,87,0.06)] hover:shadow-[0_14px_32px_rgba(52,84,87,0.13)] hover:-translate-y-1 transition-all duration-300 group">
      <Link href={`/libro/${book.id}`} className="block">
        <div className="relative w-full bg-gray-100" style={{ paddingTop: '145%' }}>
          <button
            onClick={e => { e.preventDefault(); toggleFavorite(book.id); }}
            aria-label={favorited ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200"
          >
            <HeartIcon filled={favorited} />
          </button>
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className={`absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ${outOfStock ? 'opacity-50' : ''}`}
            />
          ) : (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, #345457, #587F82)' }} />
          )}
          {isNew && !outOfStock && (
            <span
              className="absolute top-2 left-2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
              style={{ backgroundColor: '#587F82' }}
            >
              Nuevo
            </span>
          )}
          {outOfStock && (
            <span className="absolute top-2 left-2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide bg-gray-500">
              Sin stock
            </span>
          )}
          {lowStock && (
            <span className="absolute top-2 left-2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide" style={{ backgroundColor: '#C8A86B' }}>
              Últimas unidades
            </span>
          )}
        </div>
      </Link>
      <div className="p-3.5">
        <Link
          href={`/libro/${book.id}`}
          className="text-[12px] font-bold text-gray-800 leading-tight line-clamp-2 mb-1 hover:text-[#345457] transition-colors duration-300 block"
        >
          {book.title}
        </Link>
        <Link
          href={`/catalogo?autor=${encodeURIComponent(book.author_name)}`}
          className="text-[11px] text-gray-400 mb-1.5 hover:text-[#345457] transition-colors duration-300 block"
        >
          {book.author_name}
        </Link>
        <p className="text-[9px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#7A9C96' }}>{book.category}</p>
        {book.rating ? <RatingStars rating={book.rating} /> : null}
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-sm font-bold" style={{ color: '#345457' }}>{formatPrice(book.price)}</span>
          <button
            onClick={() => addItem(book)}
            disabled={outOfStock}
            aria-label="Agregar al carrito"
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#345457] hover:text-white hover:border-transparent transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
          >
            <CartIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
