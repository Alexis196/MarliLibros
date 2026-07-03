'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type FavoritesContextValue = {
  favoriteIds: string[];
  isFavorite: (bookId: string) => boolean;
  toggleFavorite: (bookId: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const STORAGE_KEY = 'marli_favorites';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFavoriteIds(JSON.parse(stored));
    } catch {
      // localStorage no disponible o JSON inválido — arrancamos sin favoritos
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds, hydrated]);

  const isFavorite = (bookId: string) => favoriteIds.includes(bookId);

  const toggleFavorite = (bookId: string) => {
    setFavoriteIds(prev => (prev.includes(bookId) ? prev.filter(id => id !== bookId) : [...prev, bookId]));
  };

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites debe usarse dentro de <FavoritesProvider>');
  return ctx;
}
