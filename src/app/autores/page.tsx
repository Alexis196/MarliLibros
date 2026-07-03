'use client';

import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuthors, type Author } from '@/contexts/AuthorsContext';

function AuthorCard({ author }: { author: Author }) {
  return (
    <Link
      href={`/autor/${author.id}`}
      className="flex flex-col items-center gap-3 text-center bg-white rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
    >
      <div
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden group-hover:ring-2 group-hover:ring-offset-2 transition-all duration-300"
        style={{ ringColor: '#C8A86B' } as React.CSSProperties}
      >
        {author.photo_url ? (
          <img src={author.photo_url} alt={author.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: '#345457' }}>
            {author.name[0]}
          </div>
        )}
      </div>
      <div>
        <p className="text-[13px] font-semibold leading-tight group-hover:text-[#C8A86B] transition-colors duration-300" style={{ color: '#1E3134' }}>
          {author.name}
        </p>
        {author.nationality && <p className="text-[11px] text-gray-400 mt-0.5">{author.nationality}</p>}
      </div>
    </Link>
  );
}

export default function AuthorsPage() {
  const { authors, loading } = useAuthors();

  return (
    <>
      <Navbar />
      <main style={{ background: '#F7F6F2', minHeight: '70vh' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center gap-2 mb-6 text-sm">
            <Link href="/" className="text-gray-400 hover:text-[#345457] transition-colors duration-300">Inicio</Link>
            <span className="text-gray-300">/</span>
            <span className="font-medium text-gray-500">Autores</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-8" style={{ color: '#1E3134', fontFamily: 'var(--font-playfair)' }}>
            Nuestros autores
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 bg-white rounded-2xl p-5 animate-pulse">
                    <div className="w-20 h-20 rounded-full bg-gray-200" />
                    <div className="h-2.5 bg-gray-200 rounded w-16" />
                  </div>
                ))
              : authors.map(author => <AuthorCard key={author.id} author={author} />)}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
