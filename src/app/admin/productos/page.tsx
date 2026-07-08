'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAdminProducts, type AdminProduct, type ProductsPageStats } from '@/contexts/AdminProductsContext';
import { CATEGORY_NAMES as CATEGORIES } from '@/lib/categories';

const BRAND = '#345457';
const GOLD  = '#C8A86B';
const LIMIT = 40;

function fmtPrice(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

// ─── Stock chip ──────────────────────────────────────────────────────────────
function StockChip({ stock, onClick }: { stock: number | null | undefined; onClick: () => void }) {
  if (stock == null) return (
    <button onClick={onClick} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors">∞</button>
  );
  if (stock === 0) return (
    <button onClick={onClick} className="text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors" style={{ background: 'rgba(184,92,92,0.12)', color: '#B85C5C' }}>✗ Sin stock</button>
  );
  if (stock <= 5) return (
    <button onClick={onClick} className="text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors" style={{ background: 'rgba(200,168,107,0.15)', color: '#9A7840' }}>⚠ {stock} ud.</button>
  );
  return (
    <button onClick={onClick} className="text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors" style={{ background: 'rgba(74,155,111,0.12)', color: '#3D8A5C' }}>{stock} ud.</button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-100 first:border-0 animate-pulse">
      <div className="w-4 h-4 rounded bg-gray-200 shrink-0" />
      <div className="w-10 h-14 rounded-lg bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-48" />
        <div className="h-2.5 bg-gray-100 rounded w-32" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-16" />
      <div className="h-5 bg-gray-100 rounded-full w-16" />
      <div className="h-5 bg-gray-100 rounded-full w-20" />
    </div>
  );
}

// ─── Delete popover ───────────────────────────────────────────────────────────
function DeletePopover({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onCancel(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onCancel]);
  return (
    <div ref={ref} className="absolute right-0 top-full mt-1 z-50 w-72 rounded-xl bg-white border border-gray-200 shadow-xl p-4" style={{ boxShadow: '0 8px 32px rgba(52,84,87,0.15)' }}>
      <p className="text-sm text-gray-700 mb-3">¿Eliminar <span className="font-semibold">"{title}"</span>? Esta acción no se puede deshacer.</p>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-1.5 rounded-lg text-sm text-gray-500 border border-gray-200 hover:border-gray-300 transition-colors">Cancelar</button>
        <button onClick={onConfirm} className="flex-1 py-1.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: '#B85C5C' }}>Eliminar</button>
      </div>
    </div>
  );
}

// ─── Inline stock editor ──────────────────────────────────────────────────────
function StockEditor({ value, onSave, onCancel }: { value: number | null | undefined; onSave: (v: number | null) => void; onCancel: () => void }) {
  const [val, setVal] = useState(value == null ? '' : String(value));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.select(); }, []);
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(val === '' ? null : Number(val)); }} className="flex items-center gap-1">
      <input ref={ref} type="number" min="0" value={val} onChange={e => setVal(e.target.value)}
        className="w-20 rounded-lg border px-2 py-0.5 text-xs outline-none focus:border-[#345457]"
        onKeyDown={e => e.key === 'Escape' && onCancel()} />
      <button type="submit" className="text-[11px] font-semibold px-2 py-0.5 rounded-lg text-white" style={{ background: BRAND }}>✓</button>
    </form>
  );
}

// ─── Product row ──────────────────────────────────────────────────────────────
type RowProps = {
  book: AdminProduct;
  now: string;
  selected: boolean;
  onSelect: (id: string) => void;
  editingStockId: string | null;
  onStockClick: (id: string) => void;
  onStockSave: (id: string, v: number | null) => void;
  onStockCancel: () => void;
  onFeaturedToggle: (id: string, val: boolean) => void;
  onDuplicate: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  deleteConfirmId: string | null;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
  updatingId: string | null;
};

function ProductRow({ book, now, selected, onSelect, editingStockId, onStockClick, onStockSave, onStockCancel, onFeaturedToggle, onDuplicate, onDeleteRequest, deleteConfirmId, onDeleteConfirm, onDeleteCancel, updatingId }: RowProps) {
  const isNew      = Boolean(book.new_until && book.new_until > now);
  const isLowStock = typeof book.stock === 'number' && book.stock > 0 && book.stock <= 5;
  const isNoStock  = book.stock === 0;
  const isPremium  = typeof book.price === 'number' && book.price > 50000;
  const urgent     = isNoStock || isLowStock;

  const leftBorderColor = isNoStock ? '#B85C5C' : isLowStock ? '#C8A86B' : isPremium ? GOLD : 'transparent';

  return (
    <div
      className="group/row relative flex items-center gap-3 px-4 py-2.5 border-t border-gray-100 hover:bg-[#F7F6F2] transition-colors duration-150"
      style={{ borderLeft: `3px solid ${leftBorderColor}` }}
    >
      {/* Checkbox */}
      <input type="checkbox" checked={selected} onChange={() => onSelect(book.id)}
        className="w-4 h-4 shrink-0 rounded cursor-pointer accent-[#345457]" />

      {/* Cover */}
      <div className="w-10 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        {book.cover_url
          ? <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📚</div>
        }
      </div>

      {/* Title / author / publisher */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-gray-800 truncate">{book.title}</span>
          {book.featured && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0" style={{ background: 'rgba(200,168,107,0.18)', color: '#9A7840' }}>★ Dest.</span>
          )}
          {isNew && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0" style={{ background: 'rgba(52,84,87,0.1)', color: BRAND }}>✦ Nuevo</span>
          )}
          {book.status === 'draft' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-gray-200 text-gray-500 shrink-0">Borrador</span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 truncate mt-0.5">
          {book.author_name}
          {book.publisher && <> · {book.publisher}</>}
          {book.category && <> · {book.category}</>}
          {book.isbn && <> · ISBN {book.isbn}</>}
        </p>
      </div>

      {/* Price */}
      <span className="text-sm font-bold shrink-0" style={{ color: urgent ? '#B85C5C' : isPremium ? GOLD : BRAND }}>
        {fmtPrice(book.price)}
        {book.promotional_price && (
          <span className="block text-[10px] line-through text-gray-400 font-normal">{fmtPrice(book.price)}</span>
        )}
      </span>

      {/* Stock chip / editor */}
      <div className="shrink-0">
        {editingStockId === book.id
          ? <StockEditor value={book.stock} onSave={v => onStockSave(book.id, v)} onCancel={onStockCancel} />
          : <StockChip stock={book.stock} onClick={() => onStockClick(book.id)} />
        }
      </div>

      {/* Mobile: always-visible edit link */}
      <Link href={`/admin/productos/${book.id}/editar`}
        className="sm:hidden shrink-0 w-9 h-9 flex items-center justify-center rounded-lg transition-colors active:bg-gray-100"
        style={{ color: BRAND }}
        aria-label="Editar">
        ✏
      </Link>

      {/* Desktop: hover actions */}
      <div className="hidden sm:flex absolute right-0 top-0 bottom-0 items-center pr-3 gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-150"
        style={{ background: 'linear-gradient(to right, transparent, #F7F6F2 40px, #F7F6F2)' }}>
        <Link href={`/admin/productos/${book.id}/editar`}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors hover:bg-white"
          style={{ color: BRAND }}>✏ Editar</Link>
        <button onClick={() => onFeaturedToggle(book.id, !book.featured)}
          disabled={updatingId === book.id}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg hover:bg-white transition-colors disabled:opacity-40"
          style={{ color: book.featured ? '#9A7840' : '#9AA6A4' }}>
          {book.featured ? '★ Quitar dest.' : '☆ Destacar'}
        </button>
        <button onClick={() => onDuplicate(book.id)}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg hover:bg-white transition-colors text-gray-400">
          📋 Dupl.
        </button>
        <div className="relative">
          <button onClick={() => onDeleteRequest(book.id)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg hover:bg-white transition-colors" style={{ color: '#B85C5C' }}>
            🗑
          </button>
          {deleteConfirmId === book.id && (
            <DeletePopover title={book.title} onConfirm={() => onDeleteConfirm(book.id)} onCancel={onDeleteCancel} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Bulk toolbar ──────────────────────────────────────────────────────────────
function BulkToolbar({ count, onFeature, onDraft, onPublish, onDelete, onExport, onClear }: {
  count: number; onFeature: () => void; onDraft: () => void; onPublish: () => void; onDelete: () => void; onExport: () => void; onClear: () => void;
}) {
  return (
    <div className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 rounded-2xl shadow-2xl overflow-x-auto"
      style={{ background: '#1C2B2C', color: 'white', boxShadow: '0 8px 40px rgba(0,0,0,0.35)', maxWidth: 'calc(100vw - 32px)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5 text-sm">
        <span className="text-[13px] font-semibold pr-2 border-r border-white/20 whitespace-nowrap shrink-0">{count} sel.</span>
        <button onClick={onFeature} className="px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors text-[12px] font-medium whitespace-nowrap shrink-0">★ Destacar</button>
        <button onClick={onPublish} className="px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors text-[12px] font-medium whitespace-nowrap shrink-0">● Publicar</button>
        <button onClick={onDraft}   className="px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors text-[12px] font-medium whitespace-nowrap shrink-0">○ Borrador</button>
        <button onClick={onExport}  className="px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors text-[12px] font-medium whitespace-nowrap shrink-0">↓ Exportar</button>
        <button onClick={onDelete}  className="px-3 py-1.5 rounded-xl hover:bg-red-500/30 transition-colors text-[12px] font-medium text-red-300 whitespace-nowrap shrink-0">🗑 Eliminar</button>
        <button onClick={onClear}   className="ml-1 text-white/40 hover:text-white/80 transition-colors text-lg leading-none shrink-0">×</button>
      </div>
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ type }: { type: 'none' | 'search' | 'filter' }) {
  if (type === 'none') return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <span className="text-5xl">📚</span>
      <p className="text-gray-500 font-medium">Todavía no hay productos</p>
      <Link href="/admin/productos/nuevo" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: BRAND }}>+ Crear el primero</Link>
    </div>
  );
  if (type === 'search') return (
    <div className="flex flex-col items-center justify-center py-20 gap-2">
      <span className="text-4xl">🔍</span>
      <p className="text-gray-500 font-medium">Sin resultados para esa búsqueda</p>
      <p className="text-[13px] text-gray-400">Probá con otro título, autor, ISBN o editorial</p>
    </div>
  );
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-2">
      <span className="text-4xl">⚗️</span>
      <p className="text-gray-500 font-medium">Ningún producto coincide con los filtros</p>
      <p className="text-[13px] text-gray-400">Ajustá o limpiá los filtros para ver más</p>
    </div>
  );
}

// ─── CSV export ───────────────────────────────────────────────────────────────
function exportCSV(products: AdminProduct[]) {
  const headers = ['Título','Autor','Editorial','Categoría','ISBN','SKU','Precio','Stock','Estado','Destacado'];
  const rows = products.map(p => [
    p.title, p.author_name, p.publisher ?? '', p.category, p.isbn ?? '', p.sku ?? '',
    p.price, p.stock ?? '', p.status ?? 'published', p.featured ? 'Sí' : 'No'
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  const csv = '﻿' + [headers.join(','), ...rows].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a'); a.href = url; a.download = 'productos.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function AdminProductosPage() {
  const { getProducts, getStats, updateProduct, deleteProduct, duplicateProduct, bulkUpdate, bulkDelete } = useAdminProducts();

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ProductsPageStats | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState<boolean | undefined>(undefined);
  const [isNewFilter, setIsNewFilter] = useState<boolean | undefined>(undefined);
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const now = new Date().toISOString();
  const searchRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const hasFilters = Boolean(debouncedSearch || category || stockFilter || statusFilter || featuredFilter !== undefined || isNewFilter !== undefined);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setSelectedIds(new Set());
    const { products: p, total: t } = await getProducts({
      search: debouncedSearch, category, stockFilter, featured: featuredFilter, isNew: isNewFilter,
      status: statusFilter, sort, order, limit: LIMIT, offset: 0,
    });
    setProducts(p);
    setTotal(t);
    setLoading(false);
  }, [getProducts, debouncedSearch, category, stockFilter, featuredFilter, isNewFilter, statusFilter, sort, order]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
  }, [getStats]);

  const loadMore = async () => {
    setLoadingMore(true);
    const { products: more } = await getProducts({
      search: debouncedSearch, category, stockFilter, featured: featuredFilter, isNew: isNewFilter,
      status: statusFilter, sort, order, limit: LIMIT, offset: products.length,
    });
    setProducts(prev => [...prev, ...more]);
    setLoadingMore(false);
  };

  const clearFilters = () => {
    setSearch(''); setCategory(''); setStockFilter(''); setStatusFilter('');
    setFeaturedFilter(undefined); setIsNewFilter(undefined);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape') { setDeleteConfirmId(null); setEditingStockId(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Row actions
  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleSelectAll = () => setSelectedIds(prev =>
    prev.size === products.length ? new Set() : new Set(products.map(p => p.id))
  );

  const handleFeaturedToggle = async (id: string, val: boolean) => {
    setUpdatingId(id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, featured: val } : p));
    await updateProduct(id, { featured: val });
    setUpdatingId(null);
  };

  const handleStockSave = async (id: string, val: number | null) => {
    setEditingStockId(null);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: val } : p));
    await updateProduct(id, { stock: val ?? undefined });
  };

  const handleDuplicate = async (id: string) => {
    const dup = await duplicateProduct(id);
    if (dup) setProducts(prev => [dup, ...prev]);
  };

  const handleDeleteConfirm = async (id: string) => {
    setDeleteConfirmId(null);
    const ok = await deleteProduct(id);
    if (ok) { setProducts(prev => prev.filter(p => p.id !== id)); setStats(prev => prev ? { ...prev, total: prev.total - 1 } : prev); }
  };

  const handleBulkFeature = async () => {
    const ids = Array.from(selectedIds);
    setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, featured: true } : p));
    await bulkUpdate(ids, { featured: true });
    setSelectedIds(new Set());
  };
  const handleBulkPublish = async () => {
    const ids = Array.from(selectedIds);
    setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, status: 'published' } : p));
    await bulkUpdate(ids, { status: 'published' });
    setSelectedIds(new Set());
  };
  const handleBulkDraft = async () => {
    const ids = Array.from(selectedIds);
    setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, status: 'draft' } : p));
    await bulkUpdate(ids, { status: 'draft' });
    setSelectedIds(new Set());
  };
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    await bulkDelete(ids);
    setProducts(prev => prev.filter(p => !ids.includes(p.id)));
    setSelectedIds(new Set());
  };
  const handleBulkExport = () => exportCSV(products.filter(p => selectedIds.has(p.id)));

  const selectedArr = Array.from(selectedIds);

  // Stats pills active filter
  const setStockOut    = () => { setStockFilter(f => f === 'out' ? '' : 'out'); };
  const setNewProducts = () => { setIsNewFilter(f => f === true ? undefined : true); };
  const setDraftFilter = () => { setStatusFilter(f => f === 'draft' ? '' : 'draft'); };

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND, fontFamily: 'var(--font-playfair)' }}>Productos</h1>
            {stats && (
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <button onClick={() => { setStatusFilter(''); setStockFilter(''); setIsNewFilter(undefined); }} className="text-[12px] text-gray-500 hover:text-gray-700 transition-colors">{stats.total} total</button>
                <span className="text-gray-200">·</span>
                <button onClick={() => setStatusFilter(f => f === 'published' ? '' : 'published')} className="text-[12px] transition-colors" style={{ color: statusFilter === 'published' ? BRAND : '#9AA6A4' }}>{stats.published} publicados</button>
                <span className="text-gray-200">·</span>
                <button onClick={setStockOut} className="text-[12px] transition-colors" style={{ color: stockFilter === 'out' ? '#B85C5C' : '#9AA6A4' }}>{stats.outOfStock} sin stock</button>
                <span className="text-gray-200">·</span>
                <button onClick={setNewProducts} className="text-[12px] transition-colors" style={{ color: isNewFilter ? BRAND : '#9AA6A4' }}>{stats.newProducts} novedades</button>
                {stats.drafts > 0 && <>
                  <span className="text-gray-200">·</span>
                  <button onClick={setDraftFilter} className="text-[12px] transition-colors" style={{ color: statusFilter === 'draft' ? '#9AA6A4' : '#9AA6A4' }}>{stats.drafts} borradores</button>
                </>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => exportCSV(products)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-800 transition-colors">
              ↓ Exportar
            </button>
            <Link href="/admin/productos/nuevo" className="px-5 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ background: BRAND }}>
              + Nuevo producto
            </Link>
          </div>
        </div>

        {/* ── Search + filters ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título, autor, ISBN, editorial, SKU… (⌘K)"
              className="w-full pl-9 pr-9 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)] transition-all bg-white"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            )}
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="py-2 pl-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#345457] bg-white text-gray-600 cursor-pointer">
            <option value="">Categoría</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={stockFilter} onChange={e => setStockFilter(e.target.value)}
            className="py-2 pl-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#345457] bg-white text-gray-600 cursor-pointer">
            <option value="">Stock</option>
            <option value="out">Sin stock</option>
            <option value="low">Stock bajo (1-5)</option>
            <option value="in">Con stock</option>
            <option value="untracked">Sin control</option>
          </select>
          <select value={featuredFilter === undefined ? '' : String(featuredFilter)} onChange={e => setFeaturedFilter(e.target.value === '' ? undefined : e.target.value === 'true')}
            className="py-2 pl-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#345457] bg-white text-gray-600 cursor-pointer">
            <option value="">Estado</option>
            <option value="true">Destacados</option>
          </select>
          <select value={sort + ':' + order} onChange={e => { const [s, o] = e.target.value.split(':'); setSort(s); setOrder(o as 'asc' | 'desc'); }}
            className="py-2 pl-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#345457] bg-white text-gray-600 cursor-pointer">
            <option value="created_at:desc">Más recientes</option>
            <option value="created_at:asc">Más antiguos</option>
            <option value="title:asc">Título A→Z</option>
            <option value="title:desc">Título Z→A</option>
            <option value="price:desc">Mayor precio</option>
            <option value="price:asc">Menor precio</option>
            <option value="stock:asc">Menor stock</option>
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="py-2 px-3 rounded-xl text-sm font-medium transition-colors" style={{ color: '#B85C5C' }}>× Limpiar</button>
          )}
        </div>
      </div>

      {/* ── List ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
        {/* Select all header */}
        {products.length > 0 && !loading && (
          <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 bg-gray-50/60">
            <input type="checkbox" className="w-4 h-4 rounded accent-[#345457] cursor-pointer"
              checked={selectedIds.size === products.length && products.length > 0}
              onChange={toggleSelectAll} />
            <span className="text-[11px] text-gray-400 font-medium">
              {debouncedSearch || hasFilters
                ? `${products.length} de ${total} resultado${total !== 1 ? 's' : ''}`
                : `${total} producto${total !== 1 ? 's' : ''}`}
            </span>
          </div>
        )}

        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          : products.length === 0
            ? <EmptyState type={debouncedSearch ? 'search' : hasFilters ? 'filter' : 'none'} />
            : products.map(book => (
                <ProductRow
                  key={book.id}
                  book={book}
                  now={now}
                  selected={selectedIds.has(book.id)}
                  onSelect={toggleSelect}
                  editingStockId={editingStockId}
                  onStockClick={id => setEditingStockId(id)}
                  onStockSave={handleStockSave}
                  onStockCancel={() => setEditingStockId(null)}
                  onFeaturedToggle={handleFeaturedToggle}
                  onDuplicate={handleDuplicate}
                  onDeleteRequest={id => setDeleteConfirmId(id)}
                  deleteConfirmId={deleteConfirmId}
                  onDeleteConfirm={handleDeleteConfirm}
                  onDeleteCancel={() => setDeleteConfirmId(null)}
                  updatingId={updatingId}
                />
              ))
        }

        {/* Load more */}
        {!loading && products.length < total && (
          <div className="flex justify-center py-4 border-t border-gray-100">
            <button onClick={loadMore} disabled={loadingMore}
              className="px-6 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:border-[#345457]/30 transition-colors disabled:opacity-50"
              style={{ color: BRAND }}>
              {loadingMore ? 'Cargando…' : `Cargar ${Math.min(LIMIT, total - products.length)} más`}
            </button>
          </div>
        )}
      </div>

      {/* ── Bulk toolbar ───────────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <BulkToolbar
          count={selectedIds.size}
          onFeature={handleBulkFeature}
          onPublish={handleBulkPublish}
          onDraft={handleBulkDraft}
          onDelete={handleBulkDelete}
          onExport={handleBulkExport}
          onClear={() => setSelectedIds(new Set())}
        />
      )}
    </div>
  );
}
