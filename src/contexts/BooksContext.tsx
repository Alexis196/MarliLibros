'use client';

import { createContext, useContext, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Book } from '@/components/BookCard';

const TTL = 5 * 60 * 1000;

type Cached<T> = { data: T; fetchedAt: number };

function isStale<T>(entry: Cached<T> | undefined): boolean {
  return !entry || Date.now() - entry.fetchedAt > TTL;
}

// Module-level caches — all keyed so they survive navigation
const singleCache = new Map<string, Cached<Book>>();
const relatedCache = new Map<string, Cached<Book[]>>();
const authorCache = new Map<string, Cached<Book[]>>();

type BooksContextValue = {
  /** Fetch a single book by id (cache-first). */
  getBook: (id: string) => Promise<Book | null>;
  /** Fetch multiple books by id (cache-first, only fetches misses). */
  getBooks: (ids: string[]) => Promise<Book[]>;
  /** Fetch related books by category, excluding the given id. */
  getRelatedBooks: (category: string, excludeId: string) => Promise<Book[]>;
  /** Fetch all books for an author (cache-first). */
  getBooksByAuthor: (authorName: string) => Promise<Book[]>;
  /** Manually update a cached book (e.g., after a stock change). */
  invalidateBook: (id: string) => void;
};

const BooksContext = createContext<BooksContextValue | null>(null);

export function BooksProvider({ children }: { children: ReactNode }) {
  const getBook = useCallback(async (id: string): Promise<Book | null> => {
    const cached = singleCache.get(id);
    if (!isStale(cached)) return cached!.data;
    const { data } = await supabase.from('books').select('*').eq('id', id).single();
    if (data) singleCache.set(id, { data: data as Book, fetchedAt: Date.now() });
    return (data as Book | null) ?? null;
  }, []);

  const getBooks = useCallback(async (ids: string[]): Promise<Book[]> => {
    if (ids.length === 0) return [];
    const now = Date.now();
    const hits: Book[] = [];
    const misses: string[] = [];

    for (const id of ids) {
      const c = singleCache.get(id);
      if (!isStale(c)) hits.push(c!.data);
      else misses.push(id);
    }

    if (misses.length > 0) {
      const { data } = await supabase.from('books').select('*').in('id', misses);
      for (const b of (data ?? []) as Book[]) {
        singleCache.set(b.id, { data: b, fetchedAt: now });
        hits.push(b);
      }
    }

    return hits;
  }, []);

  const getRelatedBooks = useCallback(async (category: string, excludeId: string): Promise<Book[]> => {
    const key = `${category}:${excludeId}`;
    const cached = relatedCache.get(key);
    if (!isStale(cached)) return cached!.data;
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('category', category)
      .neq('id', excludeId)
      .limit(6);
    const books = (data ?? []) as Book[];
    relatedCache.set(key, { data: books, fetchedAt: Date.now() });
    return books;
  }, []);

  const getBooksByAuthor = useCallback(async (authorName: string): Promise<Book[]> => {
    const cached = authorCache.get(authorName);
    if (!isStale(cached)) return cached!.data;
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('author_name', authorName)
      .order('created_at', { ascending: false });
    const books = (data ?? []) as Book[];
    authorCache.set(authorName, { data: books, fetchedAt: Date.now() });
    // Populate single-book cache as a side effect
    for (const b of books) {
      if (isStale(singleCache.get(b.id))) {
        singleCache.set(b.id, { data: b, fetchedAt: Date.now() });
      }
    }
    return books;
  }, []);

  const invalidateBook = useCallback((id: string) => {
    singleCache.delete(id);
    // Also clear related/author caches since they may contain this book
    relatedCache.clear();
    authorCache.clear();
  }, []);

  return (
    <BooksContext.Provider value={{ getBook, getBooks, getRelatedBooks, getBooksByAuthor, invalidateBook }}>
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  const ctx = useContext(BooksContext);
  if (!ctx) throw new Error('useBooks debe usarse dentro de <BooksProvider>');
  return ctx;
}
