'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';

export type AdminAuthor = {
  id: string;
  name: string;
  nationality?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  featured?: boolean;
  created_at?: string;
};

export type AuthorPayload = {
  name: string;
  nationality?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  featured?: boolean;
};

const TTL = 5 * 60 * 1000;
type CacheEntry = { data: AdminAuthor[]; fetchedAt: number };
let cache: CacheEntry | null = null;

type Ctx = {
  getAuthors: (search?: string) => Promise<AdminAuthor[]>;
  createAuthor: (payload: AuthorPayload) => Promise<{ author?: AdminAuthor; error?: string }>;
  updateAuthor: (id: string, patch: Partial<AuthorPayload>) => Promise<{ author?: AdminAuthor; error?: string }>;
  deleteAuthor: (id: string) => Promise<boolean>;
  invalidate: () => void;
};

const AdminAuthorsCtx = createContext<Ctx | null>(null);

export function AdminAuthorsProvider({ children }: { children: ReactNode }) {
  const getAuthors = useCallback(async (search?: string): Promise<AdminAuthor[]> => {
    if (!search && cache && Date.now() - cache.fetchedAt < TTL) {
      return cache.data;
    }
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`/api/admin/authors${qs}`);
    const data = await res.json();
    const authors: AdminAuthor[] = data.authors ?? [];
    if (!search) cache = { data: authors, fetchedAt: Date.now() };
    return authors;
  }, []);

  const createAuthor = useCallback(async (payload: AuthorPayload) => {
    const res = await fetch('/api/admin/authors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? 'No pudimos crear el autor.' };
    cache = null;
    return { author: data.author as AdminAuthor };
  }, []);

  const updateAuthor = useCallback(async (id: string, patch: Partial<AuthorPayload>) => {
    const res = await fetch(`/api/admin/authors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? 'No pudimos actualizar el autor.' };
    cache = null;
    return { author: data.author as AdminAuthor };
  }, []);

  const deleteAuthor = useCallback(async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/admin/authors/${id}`, { method: 'DELETE' });
    if (res.ok) cache = null;
    return res.ok;
  }, []);

  const invalidate = useCallback(() => { cache = null; }, []);

  return (
    <AdminAuthorsCtx.Provider value={{ getAuthors, createAuthor, updateAuthor, deleteAuthor, invalidate }}>
      {children}
    </AdminAuthorsCtx.Provider>
  );
}

export function useAdminAuthors() {
  const ctx = useContext(AdminAuthorsCtx);
  if (!ctx) throw new Error('useAdminAuthors must be used within AdminAuthorsProvider');
  return ctx;
}
