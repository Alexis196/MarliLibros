'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { effectivePrice } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';

export type CartItem = {
  bookId: string;
  title: string;
  author_name: string;
  price: number;
  cover_url?: string;
  quantity: number;
};

type AddableBook = {
  id: string;
  title: string;
  author_name: string;
  price: number;
  promotional_price?: number | null;
  cover_url?: string;
  stock?: number | null;
};

// bookId -> stock actual (null = sin control de stock, siempre disponible)
export type LiveStock = Record<string, number | null>;

type CartContextValue = {
  items: CartItem[];
  addItem: (book: AddableBook) => void;
  removeItem: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clear: () => void;
  totalItems: number;
  totalPrice: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  liveStock: LiveStock;
  refreshStock: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'marli_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [liveStock, setLiveStock] = useState<LiveStock>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      // localStorage no disponible o JSON inválido — arrancamos con carrito vacío
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  // El carrito persiste en localStorage y puede quedar viejo (el usuario lo dejó
  // armado hace días): antes de mostrarlo o dejar sumar cantidad, siempre
  // reconsultamos el stock real en vez de confiar en lo que tenía al agregarlo.
  const refreshStock = useCallback(() => {
    if (items.length === 0) return;
    supabase
      .from('books')
      .select('id, stock')
      .in('id', items.map(i => i.bookId))
      .then(({ data }) => {
        if (!data) return;
        setLiveStock(prev => {
          const next = { ...prev };
          for (const b of data) next[b.id as string] = b.stock as number | null;
          return next;
        });
      });
  }, [items]);

  useEffect(() => {
    if (hydrated) refreshStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const stockCap = (bookId: string, fallback?: number | null): number | null => {
    const known = liveStock[bookId];
    return known !== undefined ? known : (fallback ?? null);
  };

  const addItem = (book: AddableBook) => {
    setItems(prev => {
      const existing = prev.find(i => i.bookId === book.id);
      const cap = stockCap(book.id, book.stock);
      const nextQty = (existing?.quantity ?? 0) + 1;
      if (typeof cap === 'number' && nextQty > cap) return prev;
      if (existing) {
        return prev.map(i => (i.bookId === book.id ? { ...i, quantity: nextQty } : i));
      }
      return [...prev, { bookId: book.id, title: book.title, author_name: book.author_name, price: effectivePrice(book), cover_url: book.cover_url, quantity: 1 }];
    });
    setIsDrawerOpen(true);
  };

  const removeItem = (bookId: string) => {
    setItems(prev => prev.filter(i => i.bookId !== bookId));
  };

  const updateQuantity = (bookId: string, quantity: number) => {
    if (quantity <= 0) return removeItem(bookId);
    const cap = stockCap(bookId);
    const clamped = typeof cap === 'number' ? Math.min(quantity, Math.max(cap, 0)) : quantity;
    setItems(prev => prev.map(i => (i.bookId === bookId ? { ...i, quantity: clamped } : i)));
  };

  const clear = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clear,
        totalItems,
        totalPrice,
        isDrawerOpen,
        openDrawer: () => { refreshStock(); setIsDrawerOpen(true); },
        closeDrawer: () => setIsDrawerOpen(false),
        liveStock,
        refreshStock,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
