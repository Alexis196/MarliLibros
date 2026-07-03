'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export type Author = {
  id: string;
  name: string;
  nationality?: string;
  bio?: string;
  photo_url?: string;
};

const TTL = 10 * 60 * 1000;

type CachedList = { list: Author[]; byId: Map<string, Author>; fetchedAt: number };

// Module-level cache
let listCache: CachedList | null = null;
// Populated by individual fetches when the full list isn't ready yet
const singleCache = new Map<string, Author>();

type AuthorsContextValue = {
  authors: Author[];
  loading: boolean;
  getAuthorById: (id: string) => Author | null;
};

const AuthorsContext = createContext<AuthorsContextValue | null>(null);

export function AuthorsProvider({ children }: { children: ReactNode }) {
  const isFresh = listCache && Date.now() - listCache.fetchedAt < TTL;
  const [data, setData] = useState<CachedList | null>(isFresh ? listCache : null);
  const [loading, setLoading] = useState(!isFresh);

  useEffect(() => {
    if (listCache && Date.now() - listCache.fetchedAt < TTL) {
      setData(listCache);
      setLoading(false);
      return;
    }

    supabase
      .from('authors')
      .select('*')
      .order('name')
      .then(({ data: rows }) => {
        const list = (rows ?? []) as Author[];
        const byId = new Map(list.map(a => [a.id, a]));
        const newData: CachedList = { list, byId, fetchedAt: Date.now() };
        listCache = newData;
        setData(newData);
        setLoading(false);
      });
  }, []);

  const getAuthorById = (id: string): Author | null =>
    data?.byId.get(id) ?? singleCache.get(id) ?? null;

  return (
    <AuthorsContext.Provider value={{ authors: data?.list ?? [], loading, getAuthorById }}>
      {children}
    </AuthorsContext.Provider>
  );
}

export function useAuthors() {
  const ctx = useContext(AuthorsContext);
  if (!ctx) throw new Error('useAuthors debe usarse dentro de <AuthorsProvider>');
  return ctx;
}

/** Fetch a single author — checks context cache first, falls back to Supabase. */
export async function fetchAuthorById(id: string): Promise<Author | null> {
  if (listCache?.byId.has(id)) return listCache.byId.get(id)!;
  if (singleCache.has(id)) return singleCache.get(id)!;
  const { data } = await supabase.from('authors').select('*').eq('id', id).single();
  if (data) singleCache.set(data.id, data as Author);
  return (data as Author | null) ?? null;
}
