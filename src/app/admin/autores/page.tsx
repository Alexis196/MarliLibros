'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAdminAuthors, type AdminAuthor } from '@/contexts/AdminAuthorsContext';

const BRAND = '#345457';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-100 first:border-0 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-40" />
        <div className="h-2.5 bg-gray-100 rounded w-24" />
      </div>
    </div>
  );
}

// ─── Delete popover ───────────────────────────────────────────────────────────
function DeletePopover({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onCancel(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onCancel]);
  return (
    <div ref={ref} className="absolute right-0 top-full mt-1 z-50 w-72 rounded-xl bg-white border border-gray-200 shadow-xl p-4" style={{ boxShadow: '0 8px 32px rgba(52,84,87,0.15)' }}>
      <p className="text-sm text-gray-700 mb-3">¿Eliminar <span className="font-semibold">"{name}"</span>? Esta acción no se puede deshacer.</p>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-1.5 rounded-lg text-sm text-gray-500 border border-gray-200 hover:border-gray-300 transition-colors">Cancelar</button>
        <button onClick={onConfirm} className="flex-1 py-1.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: '#B85C5C' }}>Eliminar</button>
      </div>
    </div>
  );
}

// ─── Author row ───────────────────────────────────────────────────────────────
function AuthorRow({ author, onFeaturedToggle, onDeleteRequest, deleteConfirmId, onDeleteConfirm, onDeleteCancel, updatingId }: {
  author: AdminAuthor;
  onFeaturedToggle: (id: string, val: boolean) => void;
  onDeleteRequest: (id: string) => void;
  deleteConfirmId: string | null;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
  updatingId: string | null;
}) {
  return (
    <div className="group/row relative flex items-center gap-3 px-4 py-2.5 border-t border-gray-100 hover:bg-[#F7F6F2] transition-colors duration-150">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
        {author.photo_url
          ? <img src={author.photo_url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: BRAND }}>{author.name[0]}</div>
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-gray-800 truncate">{author.name}</span>
          {author.featured && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0" style={{ background: 'rgba(200,168,107,0.18)', color: '#9A7840' }}>★ Dest.</span>
          )}
        </div>
        {author.nationality && <p className="text-[11px] text-gray-400 truncate mt-0.5">{author.nationality}</p>}
      </div>

      <Link href={`/admin/autores/${author.id}/editar`}
        className="sm:hidden shrink-0 w-9 h-9 flex items-center justify-center rounded-lg transition-colors active:bg-gray-100"
        style={{ color: BRAND }} aria-label="Editar">✏</Link>

      <div className="hidden sm:flex absolute right-0 top-0 bottom-0 items-center pr-3 gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-150"
        style={{ background: 'linear-gradient(to right, transparent, #F7F6F2 40px, #F7F6F2)' }}>
        <Link href={`/admin/autores/${author.id}/editar`}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors hover:bg-white" style={{ color: BRAND }}>✏ Editar</Link>
        <button onClick={() => onFeaturedToggle(author.id, !author.featured)}
          disabled={updatingId === author.id}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg hover:bg-white transition-colors disabled:opacity-40"
          style={{ color: author.featured ? '#9A7840' : '#9AA6A4' }}>
          {author.featured ? '★ Quitar dest.' : '☆ Destacar'}
        </button>
        <div className="relative">
          <button onClick={() => onDeleteRequest(author.id)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg hover:bg-white transition-colors" style={{ color: '#B85C5C' }}>🗑</button>
          {deleteConfirmId === author.id && (
            <DeletePopover name={author.name} onConfirm={() => onDeleteConfirm(author.id)} onCancel={onDeleteCancel} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ isSearch }: { isSearch: boolean }) {
  if (isSearch) return (
    <div className="flex flex-col items-center justify-center py-20 gap-2">
      <span className="text-4xl">🔍</span>
      <p className="text-gray-500 font-medium">Sin resultados para esa búsqueda</p>
    </div>
  );
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <span className="text-5xl">✍️</span>
      <p className="text-gray-500 font-medium">Todavía no hay autores cargados</p>
      <Link href="/admin/autores/nuevo" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: BRAND }}>+ Cargar el primero</Link>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function AdminAutoresPage() {
  const { getAuthors, updateAuthor, deleteAuthor } = useAdminAuthors();

  const [authors, setAuthors] = useState<AdminAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const fetchAuthors = useCallback(async () => {
    setLoading(true);
    const list = await getAuthors(debouncedSearch);
    setAuthors(list);
    setLoading(false);
  }, [getAuthors, debouncedSearch]);

  useEffect(() => { fetchAuthors(); }, [fetchAuthors]);

  const handleFeaturedToggle = async (id: string, val: boolean) => {
    setUpdatingId(id);
    setAuthors(prev => prev.map(a => a.id === id ? { ...a, featured: val } : a));
    await updateAuthor(id, { featured: val });
    setUpdatingId(null);
  };

  const handleDeleteConfirm = async (id: string) => {
    setDeleteConfirmId(null);
    const ok = await deleteAuthor(id);
    if (ok) setAuthors(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div>
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND, fontFamily: 'var(--font-playfair)' }}>Autores</h1>
            <p className="text-[12px] text-gray-500 mt-1">{authors.length} autor{authors.length !== 1 ? 'es' : ''}</p>
          </div>
          <Link href="/admin/autores/nuevo" className="px-5 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ background: BRAND }}>
            + Nuevo autor
          </Link>
        </div>

        <div className="relative max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre…"
            className="w-full pl-9 pr-9 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)] transition-all bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          : authors.length === 0
            ? <EmptyState isSearch={Boolean(debouncedSearch)} />
            : authors.map(author => (
                <AuthorRow
                  key={author.id}
                  author={author}
                  onFeaturedToggle={handleFeaturedToggle}
                  onDeleteRequest={id => setDeleteConfirmId(id)}
                  deleteConfirmId={deleteConfirmId}
                  onDeleteConfirm={handleDeleteConfirm}
                  onDeleteCancel={() => setDeleteConfirmId(null)}
                  updatingId={updatingId}
                />
              ))
        }
      </div>
    </div>
  );
}
