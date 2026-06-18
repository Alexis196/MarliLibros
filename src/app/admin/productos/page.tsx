'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Book = {
  id: string;
  title: string;
  author_name: string;
  category: string;
  price: number;
  cover_url?: string;
  new_until?: string;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
}

export default function AdminProductosPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/products')
      .then(res => res.json())
      .then(data => setBooks(data.books ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) setBooks(prev => prev.filter(b => b.id !== id));
    setDeletingId(null);
  };

  const now = new Date().toISOString();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#345457', fontFamily: 'var(--font-playfair)' }}>
          Productos
        </h1>
        <Link
          href="/admin/productos/nuevo"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#345457' }}
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Cargando…</div>
        ) : books.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">Todavía no hay productos.</div>
        ) : (
          books.map((book, i) => {
            const isNew = Boolean(book.new_until && book.new_until > now);
            return (
              <div key={book.id} className={`flex items-center gap-4 p-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {book.cover_url && <img src={book.cover_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {book.title}{' '}
                    {isNew && (
                      <span
                        className="text-[10px] font-bold ml-1 px-1.5 py-0.5 rounded uppercase"
                        style={{ backgroundColor: '#587F82', color: 'white' }}
                      >
                        Nuevo
                      </span>
                    )}
                  </p>
                  <p className="text-[12px] text-gray-400">
                    {book.author_name} · {book.category}
                  </p>
                </div>
                <span className="text-sm font-bold shrink-0" style={{ color: '#345457' }}>
                  {formatPrice(book.price)}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <Link href={`/admin/productos/${book.id}/editar`} className="text-[12px] font-semibold" style={{ color: '#345457' }}>
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(book.id, book.title)}
                    disabled={deletingId === book.id}
                    className="text-[12px] font-semibold text-gray-400 hover:text-red-400 transition-colors duration-300 disabled:opacity-50"
                  >
                    {deletingId === book.id ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
