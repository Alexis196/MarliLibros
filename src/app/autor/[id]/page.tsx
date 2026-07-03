'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BookCard, type Book } from '@/components/BookCard';
import { useAuthors, fetchAuthorById, type Author } from '@/contexts/AuthorsContext';
import { useBooks } from '@/contexts/BooksContext';

export default function AuthorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getAuthorById } = useAuthors();
  const { getBooksByAuthor } = useBooks();
  const [author, setAuthor] = useState<Author | null>(() => getAuthorById(id));
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getAuthorById(id);
    if (cached) {
      setAuthor(cached);
      return;
    }
    fetchAuthorById(id).then(data => setAuthor(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!author) return;
    getBooksByAuthor(author.name).then(data => {
      setBooks(data);
      setLoading(false);
    });
  }, [author, getBooksByAuthor]);

  if (!loading && !author) {
    return (
      <>
        <Navbar />
        <main style={{ background: '#F7F6F2', minHeight: '70vh' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
            <p className="text-4xl mb-4">📖</p>
            <p className="text-gray-500 text-lg font-medium mb-2">No encontramos este autor</p>
            <Link href="/autores" className="text-sm font-semibold" style={{ color: '#345457' }}>
              Volver a autores →
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ background: '#F7F6F2', minHeight: '70vh' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center gap-2 mb-8 text-sm">
            <Link href="/" className="text-gray-400 hover:text-[#345457] transition-colors duration-300">Inicio</Link>
            <span className="text-gray-300">/</span>
            <Link href="/autores" className="text-gray-400 hover:text-[#345457] transition-colors duration-300">Autores</Link>
            <span className="text-gray-300">/</span>
            <span className="font-medium text-gray-500">{author?.name ?? 'Cargando…'}</span>
          </div>

          {author && (
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-12">
              <div className="w-28 h-28 rounded-full overflow-hidden shrink-0" style={{ boxShadow: '0 8px 24px rgba(52,84,87,0.12)' }}>
                {author.photo_url ? (
                  <img src={author.photo_url} alt={author.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold" style={{ backgroundColor: '#345457' }}>
                    {author.name[0]}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#1E3134', fontFamily: 'var(--font-playfair)' }}>
                  {author.name}
                </h1>
                {author.nationality && <p className="text-sm text-gray-400 mb-3">{author.nationality}</p>}
                {author.bio && <p className="text-gray-600 text-[14px] leading-relaxed max-w-2xl">{author.bio}</p>}
              </div>
            </div>
          )}

          <h2 className="text-xl font-bold mb-5" style={{ color: '#345457' }}>
            Libros de {author?.name ?? 'este autor'}
          </h2>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-[18px] bg-white animate-pulse" style={{ paddingTop: '145%' }} />
              ))}
            </div>
          ) : books.length === 0 ? (
            <p className="text-sm text-gray-400">Todavía no tenemos libros de este autor en catálogo.</p>
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
