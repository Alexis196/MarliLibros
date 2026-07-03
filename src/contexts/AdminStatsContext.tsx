'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';

export type MonthlyPoint = { month: number; ventas: number; gastos: number; envios: number };
export type AnnualPoint = { year: number; ventas: number; gastos: number; envios: number };
export type TopSeller = { label: string; quantity: number };
export type TopSellersResult = { categories: TopSeller[]; titles: TopSeller[] };

type Cached<T> = { data: T; fetchedAt: number };

const TTL = 10 * 60 * 1000;
const monthlyCache = new Map<number, Cached<MonthlyPoint[]>>();
let annualCache: Cached<AnnualPoint[]> | null = null;
const topSellersCache = new Map<string, Cached<TopSellersResult>>();

type Ctx = {
  getMonthlyStats: (year: number) => Promise<MonthlyPoint[]>;
  getAnnualStats: () => Promise<AnnualPoint[]>;
  getTopSellers: (from: string, to: string) => Promise<TopSellersResult | null>;
};

const AdminStatsCtx = createContext<Ctx | null>(null);

export function AdminStatsProvider({ children }: { children: ReactNode }) {
  const getMonthlyStats = useCallback(async (year: number): Promise<MonthlyPoint[]> => {
    const now = Date.now();
    const cached = monthlyCache.get(year);
    if (cached && now - cached.fetchedAt < TTL) return cached.data;

    const res = await fetch(`/api/admin/stats/monthly?year=${year}`);
    const data = await res.json();
    const points: MonthlyPoint[] = data.data ?? [];
    monthlyCache.set(year, { data: points, fetchedAt: now });
    return points;
  }, []);

  const getAnnualStats = useCallback(async (): Promise<AnnualPoint[]> => {
    const now = Date.now();
    if (annualCache && now - annualCache.fetchedAt < TTL) return annualCache.data;

    const res = await fetch('/api/admin/stats/annual?years=5');
    const data = await res.json();
    const points: AnnualPoint[] = data.data ?? [];
    annualCache = { data: points, fetchedAt: now };
    return points;
  }, []);

  const getTopSellers = useCallback(async (from: string, to: string): Promise<TopSellersResult | null> => {
    const now = Date.now();
    const key = `${from}:${to}`;
    const cached = topSellersCache.get(key);
    if (cached && now - cached.fetchedAt < TTL) return cached.data;

    const res = await fetch(`/api/admin/stats/top-sellers?from=${from}&to=${to}`);
    const data = await res.json();
    if (!res.ok) return null;
    topSellersCache.set(key, { data, fetchedAt: now });
    return data as TopSellersResult;
  }, []);

  return (
    <AdminStatsCtx.Provider value={{ getMonthlyStats, getAnnualStats, getTopSellers }}>
      {children}
    </AdminStatsCtx.Provider>
  );
}

export function useAdminStats() {
  const ctx = useContext(AdminStatsCtx);
  if (!ctx) throw new Error('useAdminStats must be used within AdminStatsProvider');
  return ctx;
}
