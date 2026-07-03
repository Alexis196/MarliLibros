'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';

export type AdminProduct = {
  id: string;
  title: string;
  author_name: string;
  category: string;
  price: number;
  cost_price?: number | null;
  promotional_price?: number | null;
  description?: string;
  cover_url?: string;
  new_until?: string | null;
  featured?: boolean;
  stock?: number | null;
  rating?: number | null;
  pages?: number | null;
  year?: number | null;
  isbn?: string | null;
  publisher?: string | null;
  language?: string | null;
  sku?: string | null;
  binding?: string | null;
  edition?: string | null;
  tags?: string[] | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

export type ProductsPageStats = {
  total: number;
  published: number;
  outOfStock: number;
  newProducts: number;
  drafts: number;
};

export type FetchProductsParams = {
  search?: string;
  category?: string;
  stockFilter?: string;
  featured?: boolean;
  isNew?: boolean;
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};

export type ProductsResult = { products: AdminProduct[]; total: number };

type CacheEntry = { data: AdminProduct[]; total: number; fetchedAt: number };
const TTL = 5 * 60 * 1000;
let cache: CacheEntry | null = null;

type Ctx = {
  getProducts: (params?: FetchProductsParams) => Promise<ProductsResult>;
  getStats: () => Promise<ProductsPageStats>;
  updateProduct: (id: string, patch: Partial<AdminProduct> & { isNew?: boolean }) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  duplicateProduct: (id: string) => Promise<AdminProduct | null>;
  bulkDelete: (ids: string[]) => Promise<boolean>;
  bulkUpdate: (ids: string[], patch: Partial<AdminProduct> & { isNew?: boolean }) => Promise<boolean>;
  invalidate: () => void;
};

const AdminProductsCtx = createContext<Ctx | null>(null);

export function AdminProductsProvider({ children }: { children: ReactNode }) {
  const getProducts = useCallback(async (params: FetchProductsParams = {}): Promise<ProductsResult> => {
    const { search, category, stockFilter, featured, isNew, status, sort, order, limit = 40, offset = 0 } = params;
    const isDefault = !search && !category && !stockFilter && featured === undefined && isNew === undefined && !status && !sort && offset === 0;

    if (isDefault && cache && Date.now() - cache.fetchedAt < TTL) {
      return { products: cache.data, total: cache.total };
    }

    const qs = new URLSearchParams();
    if (search)       qs.set('search', search);
    if (category)     qs.set('category', category);
    if (stockFilter)  qs.set('stock', stockFilter);
    if (featured !== undefined) qs.set('featured', String(featured));
    if (isNew !== undefined)    qs.set('is_new', String(isNew));
    if (status)       qs.set('status', status);
    if (sort)         qs.set('sort', sort);
    if (order)        qs.set('order', order);
    qs.set('limit', String(limit));
    qs.set('offset', String(offset));

    const res = await fetch(`/api/admin/products?${qs}`);
    const data = await res.json();
    const products: AdminProduct[] = data.books ?? [];
    const total: number = data.total ?? products.length;

    if (isDefault) cache = { data: products, total, fetchedAt: Date.now() };

    return { products, total };
  }, []);

  const getStats = useCallback(async (): Promise<ProductsPageStats> => {
    const res = await fetch('/api/admin/products?stats=1');
    const data = await res.json();
    return {
      total: data.total ?? 0,
      published: data.published ?? 0,
      outOfStock: data.outOfStock ?? 0,
      newProducts: data.newProducts ?? 0,
      drafts: data.drafts ?? 0,
    };
  }, []);

  const updateProduct = useCallback(async (id: string, patch: Partial<AdminProduct> & { isNew?: boolean }): Promise<boolean> => {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok && cache) {
      const apply = (p: AdminProduct) => p.id === id ? { ...p, ...patch } : p;
      cache = { ...cache, data: cache.data.map(apply) };
    }
    return res.ok;
  }, []);

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok && cache) {
      cache = { ...cache, data: cache.data.filter(p => p.id !== id), total: cache.total - 1 };
    }
    return res.ok;
  }, []);

  const duplicateProduct = useCallback(async (id: string): Promise<AdminProduct | null> => {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'POST' });
    if (!res.ok) return null;
    const data = await res.json();
    const product: AdminProduct = data.book;
    if (cache) cache = { ...cache, data: [product, ...cache.data], total: cache.total + 1 };
    return product;
  }, []);

  const bulkDelete = useCallback(async (ids: string[]): Promise<boolean> => {
    const results = await Promise.all(ids.map(id =>
      fetch(`/api/admin/products/${id}`, { method: 'DELETE' }).then(r => r.ok)
    ));
    cache = null;
    return results.every(Boolean);
  }, []);

  const bulkUpdate = useCallback(async (ids: string[], patch: Partial<AdminProduct> & { isNew?: boolean }): Promise<boolean> => {
    const results = await Promise.all(ids.map(id =>
      fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }).then(r => r.ok)
    ));
    cache = null;
    return results.every(Boolean);
  }, []);

  const invalidate = useCallback(() => { cache = null; }, []);

  return (
    <AdminProductsCtx.Provider value={{ getProducts, getStats, updateProduct, deleteProduct, duplicateProduct, bulkDelete, bulkUpdate, invalidate }}>
      {children}
    </AdminProductsCtx.Provider>
  );
}

export function useAdminProducts() {
  const ctx = useContext(AdminProductsCtx);
  if (!ctx) throw new Error('useAdminProducts must be used within AdminProductsProvider');
  return ctx;
}
