'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

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

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
}

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addItem } = useCart();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setBook(null);
    supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setBook(data ?? null);
        setLoading(false);
      });
  }, [id]);

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
              <div className="rounded-2xl animate-pulse" style={{ aspectRatio: '2/3', backgroundColor: '#E5ECE8' }} />
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
                      className="w-7 h-7 rounded-full text-gray-500 hover:text-[#345457] transition-colors duration-300"
                      aria-label="Restar cantidad"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-medium text-gray-700">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-7 h-7 rounded-full text-gray-500 hover:text-[#345457] transition-colors duration-300"
                      aria-label="Sumar cantidad"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: added ? '#587F82' : '#345457' }}
                  >
                    {added ? '✓ Agregado' : 'Agregar al carrito'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
