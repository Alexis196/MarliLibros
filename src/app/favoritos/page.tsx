'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useBooks } from '@/contexts/BooksContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BookCard, type Book } from '@/components/BookCard';

export default function FavoritosPage() {
  const { favoriteIds } = useFavorites();
  const { getBooks } = useBooks();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (favoriteIds.length === 0) {
      setBooks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getBooks(favoriteIds).then(fetched => {
      const byId = new Map(fetched.map(b => [b.id, b]));
      // Keep the order consistent with favoriteIds
      setBooks(favoriteIds.map(id => byId.get(id)).filter(Boolean) as Book[]);
      setLoading(false);
    });
  }, [favoriteIds, getBooks]);

  return (
    <>
      <Navbar />
      <main style={{ background: '#F7F6F2', minHeight: '70vh' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center gap-2 mb-6 text-sm">
            <Link href="/" className="text-gray-400 hover:text-[#345457] transition-colors duration-300">Inicio</Link>
            <span className="text-gray-300">/</span>
            <span className="font-medium text-gray-500">Favoritos</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-8" style={{ color: '#1E3134', fontFamily: 'var(--font-playfair)' }}>
            Tus favoritos
          </h1>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-[18px] bg-white animate-pulse" style={{ paddingTop: '145%' }} />
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-4xl mb-4">♡</p>
              <p className="text-gray-500 text-lg font-medium mb-2">Todavía no tenés favoritos</p>
              <p className="text-sm text-gray-400 mb-6">Tocá el corazón en cualquier libro para guardarlo acá.</p>
              <Link
                href="/catalogo"
                className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#345457' }}
              >
                Ver catálogo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {books.map(book => <BookCard key={book.id} book={book} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
