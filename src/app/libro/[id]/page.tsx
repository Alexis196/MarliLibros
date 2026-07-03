'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useBooks } from '@/contexts/BooksContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BookCard, type Book } from '@/components/BookCard';
import { formatPrice } from '@/lib/format';

type Review = {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

function ReviewStars({ rating, onPick }: { rating: number; onPick?: (n: number) => void }) {
  return (
    <span style={{ color: '#C8A86B' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={!onPick}
          onClick={() => onPick?.(n)}
          className={onPick ? 'cursor-pointer' : ''}
          aria-label={`${n} estrellas`}
        >
          {n <= rating ? '★' : '☆'}
        </button>
      ))}
    </span>
  );
}

function ReviewsSection({ bookId }: { bookId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = () => {
    setLoading(true);
    supabase
      .from('reviews')
      .select('*')
      .eq('book_id', bookId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews(data ?? []);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, reviewerName: name, rating, comment }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message ?? 'No pudimos guardar tu reseña.');
        return;
      }
      setName('');
      setRating(5);
      setComment('');
      setShowForm(false);
      loadReviews();
    } catch {
      setError('No pudimos guardar tu reseña.');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  return (
    <div className="mt-14 max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#345457' }}>Reseñas de compradores</h2>
          {avgRating !== null && (
            <p className="text-[13px] text-gray-500 mt-1">
              <ReviewStars rating={Math.round(avgRating)} /> {avgRating.toFixed(1)} · {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
            </p>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-semibold cursor-pointer"
            style={{ color: '#345457' }}
          >
            Escribir una reseña
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 mb-6 space-y-3" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1">Tu calificación</label>
            <ReviewStars rating={rating} onPick={setRating} />
          </div>
          <input
            required
            placeholder="Tu nombre"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#345457]"
          />
          <textarea
            rows={3}
            placeholder="¿Qué te pareció el libro? (opcional)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#345457]"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#345457' }}
            >
              {submitting ? 'Enviando…' : 'Publicar reseña'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Cargando reseñas…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400">Todavía no hay reseñas. ¡Sé el primero en dejar la tuya!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">{r.reviewer_name}</p>
                <ReviewStars rating={r.rating} />
              </div>
              {r.comment && <p className="text-[13px] text-gray-500 mt-1.5">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getBook, getRelatedBooks } = useBooks();
  const [book, setBook] = useState<Book | null>(null);
  const [related, setRelated] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setBook(null);
    getBook(id).then(data => {
      setBook(data);
      setLoading(false);
    });
  }, [id, getBook]);

  useEffect(() => {
    if (!book) { setRelated([]); return; }
    getRelatedBooks(book.category, book.id).then(setRelated);
  }, [book, getRelatedBooks]);

  const handleAddToCart = () => {
    if (!book) return;
    for (let i = 0; i < quantity; i++) addItem(book);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const now = new Date().toISOString();
  const isNew = book?.new_until && book.new_until > now;

  return (
    <>
      <Navbar />
      <main style={{ background: '#F7F6F2', minHeight: '70vh' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-sm">
            <Link href="/" className="text-gray-400 hover:text-[#345457] transition-colors duration-300">Inicio</Link>
            <span className="text-gray-300">/</span>
            <Link href="/catalogo" className="text-gray-400 hover:text-[#345457] transition-colors duration-300">Catálogo</Link>
            <span className="text-gray-300">/</span>
            <span className="font-medium text-gray-500 line-clamp-1">{loading ? 'Cargando…' : book?.title ?? 'Libro'}</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-8 sm:gap-12">
              <div className="max-w-[220px] sm:max-w-none mx-auto">
                <div className="rounded-2xl animate-pulse" style={{ aspectRatio: '2/3', backgroundColor: '#E5ECE8' }} />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-1/3 rounded animate-pulse" style={{ backgroundColor: '#E5ECE8' }} />
                <div className="h-8 w-3/4 rounded animate-pulse" style={{ backgroundColor: '#E5ECE8' }} />
                <div className="h-4 w-1/2 rounded animate-pulse" style={{ backgroundColor: '#EFEAE0' }} />
              </div>
            </div>
          ) : !book ? (
            <div className="rounded-2xl bg-white p-10 sm:p-16 text-center" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
              <p className="text-4xl mb-4">📕</p>
              <p className="text-gray-500 text-lg font-medium mb-2">No encontramos este libro</p>
              <Link href="/catalogo" className="text-sm font-semibold" style={{ color: '#345457' }}>
                Volver al catálogo →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-8 sm:gap-12">
              {/* Portada */}
              <div className="max-w-[220px] sm:max-w-none mx-auto">
              <div className="relative rounded-2xl overflow-hidden bg-white border border-black/5" style={{ aspectRatio: '2/3', boxShadow: '0 8px 24px rgba(52,84,87,0.08)' }}>
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, #345457, #587F82)' }} />
                )}
                {isNew && (
                  <span
                    className="absolute top-3 left-3 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide"
                    style={{ backgroundColor: '#587F82' }}
                  >
                    Nuevo
                  </span>
                )}
              </div>
              </div>

              {/* Info */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: '#7A9C96' }}>{book.category}</p>
                <h1
                  className="text-2xl sm:text-3xl font-bold mb-2"
                  style={{ color: '#1E3134', fontFamily: 'var(--font-playfair)' }}
                >
                  {book.title}
                </h1>
                <Link
                  href={`/catalogo?autor=${encodeURIComponent(book.author_name)}`}
                  className="text-sm text-gray-500 hover:text-[#345457] transition-colors duration-300"
                >
                  {book.author_name}
                </Link>

                {(book.rating || book.pages || book.year) && (
                  <div className="flex items-center gap-4 mt-4 text-[12px] text-gray-400">
                    {book.rating && <span>★ {book.rating.toFixed(1)}</span>}
                    {book.pages && <span>{book.pages} páginas</span>}
                    {book.year && <span>{book.year}</span>}
                  </div>
                )}

                <p className="text-2xl font-bold mt-6" style={{ color: '#345457' }}>{formatPrice(book.price)}</p>

                {book.description && (
                  <p className="text-gray-600 text-[14px] leading-relaxed mt-4 max-w-md">{book.description}</p>
                )}

                <div className="flex items-center gap-4 mt-8">
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-2 py-1.5 bg-white">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-9 h-9 rounded-full text-gray-500 hover:text-[#345457] transition-colors duration-300"
                      aria-label="Restar cantidad"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-medium text-gray-700">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-9 h-9 rounded-full text-gray-500 hover:text-[#345457] transition-colors duration-300"
                      aria-label="Sumar cantidad"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={book.stock === 0}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: added ? '#587F82' : '#345457' }}
                  >
                    {book.stock === 0 ? 'Sin stock' : added ? '✓ Agregado' : 'Agregar al carrito'}
                  </button>

                  <button
                    onClick={() => toggleFavorite(book.id)}
                    aria-label={isFavorite(book.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#C8A86B] transition-colors duration-300 shrink-0"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite(book.id) ? '#C8A86B' : 'none'} stroke={isFavorite(book.id) ? '#C8A86B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {book && <ReviewsSection bookId={book.id} />}

          {related.length > 0 && (
            <div className="mt-14">
              <h2 className="text-xl font-bold mb-5" style={{ color: '#345457' }}>También te puede interesar</h2>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                {related.map(r => (
                  <div key={r.id} className="w-40 sm:w-48 flex-shrink-0">
                    <BookCard book={r} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
