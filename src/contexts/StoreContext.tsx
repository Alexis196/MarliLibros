'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Book } from '@/components/BookCard';

const CATEGORY_NAMES = [
  'Libros',
  'Desarrollo Personal',
  'Tarot y Oráculos',
  'Rompecabezas',
  'Juegos Didácticos',
  'Agendas y Cuadernos',
];

const NOVEDADES_LIMIT = 12;
const FEATURED_LIMIT = 12;
const TTL = 5 * 60 * 1000;

type StoreData = {
  novedades: Book[];
  featuredBooks: Book[];
  totalBooks: number;
  categoryCounts: Record<string, number>;
  fetchedAt: number;
};

type StoreContextValue = {
  novedades: Book[];
  featuredBooks: Book[];
  totalBooks: number;
  categoryCounts: Record<string, number>;
  loading: boolean;
};

const StoreContext = createContext<StoreContextValue | null>(null);

// Module-level cache — survives client-side navigation (provider stays mounted in layout)
let cache: StoreData | null = null;

export function StoreProvider({ children }: { children: ReactNode }) {
  const isFresh = cache && Date.now() - cache.fetchedAt < TTL;
  const [data, setData] = useState<StoreData | null>(isFresh ? cache : null);
  const [loading, setLoading] = useState(!isFresh);

  useEffect(() => {
    if (cache && Date.now() - cache.fetchedAt < TTL) {
      setData(cache);
      setLoading(false);
      return;
    }

    const now = new Date().toISOString();

    Promise.all([
      supabase.from('books').select('*').gt('new_until', now).order('created_at', { ascending: false }).limit(NOVEDADES_LIMIT),
      supabase.from('books').select('*').eq('featured', true).order('created_at', { ascending: false }).limit(FEATURED_LIMIT),
      supabase.from('books').select('id', { count: 'exact', head: true }),
      Promise.all(
        CATEGORY_NAMES.map(name =>
          supabase
            .from('books')
            .select('id', { count: 'exact', head: true })
            .eq('category', name)
            .then(({ count }) => [name, count ?? 0] as const)
        )
      ),
    ]).then(async ([novedadesRes, featuredRes, countRes, categoryPairs]) => {
      let featured = featuredRes.data ?? [];
      if (featured.length === 0) {
        const { data: recent } = await supabase
          .from('books')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(FEATURED_LIMIT);
        featured = recent ?? [];
      }

      const newData: StoreData = {
        novedades: novedadesRes.data ?? [],
        featuredBooks: featured,
        totalBooks: countRes.count ?? 0,
        categoryCounts: Object.fromEntries(categoryPairs),
        fetchedAt: Date.now(),
      };
      cache = newData;
      setData(newData);
      setLoading(false);
    });
  }, []);

  return (
    <StoreContext.Provider
      value={{
        novedades: data?.novedades ?? [],
        featuredBooks: data?.featuredBooks ?? [],
        totalBooks: data?.totalBooks ?? 0,
        categoryCounts: data?.categoryCounts ?? {},
        loading,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>');
  return ctx;
}
