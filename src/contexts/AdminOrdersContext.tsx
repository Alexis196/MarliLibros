'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { invalidateAdminStats } from './AdminStatsContext';

type OrderItem = { title: string; author_name: string; price: number; quantity: number };

export type AdminOrder = {
  id: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: string;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  address_reference?: string | null;
  total_amount: number;
  shipped: boolean;
  created_at: string;
  order_items: OrderItem[];
};

export type FetchOrdersParams = {
  dispatchOnly?: boolean;
  search?: string;
  status?: string;
  dateFilter?: string;
  minAmount?: number | null;
  maxAmount?: number | null;
  province?: string;
  limit?: number;
  offset?: number;
};

export type OrdersResult = { orders: AdminOrder[]; total: number };

type CacheEntry = { data: AdminOrder[]; total: number; fetchedAt: number };
type OrdersCache = { all: CacheEntry | null; dispatch: CacheEntry | null };

const TTL = 2 * 60 * 1000;
let cache: OrdersCache = { all: null, dispatch: null };

type Ctx = {
  getOrders: (params: FetchOrdersParams) => Promise<OrdersResult>;
  markShipped: (id: string) => Promise<boolean>;
  updateStatus: (id: string, status: string) => Promise<boolean>;
  bulkUpdateStatus: (ids: string[], status: string) => Promise<boolean>;
  bulkMarkShipped: (ids: string[]) => Promise<boolean>;
};

const AdminOrdersCtx = createContext<Ctx | null>(null);

export function AdminOrdersProvider({ children }: { children: ReactNode }) {
  const getOrders = useCallback(async (params: FetchOrdersParams): Promise<OrdersResult> => {
    const { dispatchOnly, search, status, dateFilter, minAmount, maxAmount, province, limit = 25, offset = 0 } = params;

    const isDefault = !search && !status && !dateFilter && minAmount == null && maxAmount == null && !province && offset === 0;

    if (isDefault) {
      const now = Date.now();
      const key = dispatchOnly ? 'dispatch' : 'all';
      const entry = cache[key];
      if (entry && now - entry.fetchedAt < TTL) return { orders: entry.data, total: entry.total };
    }

    const qs = new URLSearchParams();
    if (dispatchOnly) qs.set('dispatch', '1');
    if (search) qs.set('search', search);
    if (status) qs.set('status', status);
    if (dateFilter) qs.set('date', dateFilter);
    if (minAmount != null) qs.set('min_amount', String(minAmount));
    if (maxAmount != null) qs.set('max_amount', String(maxAmount));
    if (province) qs.set('province', province);
    qs.set('limit', String(limit));
    qs.set('offset', String(offset));

    const res = await fetch(`/api/admin/orders?${qs.toString()}`);
    const data = await res.json();
    const orders: AdminOrder[] = data.orders ?? [];
    const total: number = data.total ?? orders.length;

    if (isDefault) {
      const key = dispatchOnly ? 'dispatch' : 'all';
      cache = { ...cache, [key]: { data: orders, total, fetchedAt: Date.now() } };
    }

    return { orders, total };
  }, []);

  const markShipped = useCallback(async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipped: true }),
    });
    if (res.ok) {
      if (cache.all) cache = { ...cache, all: { ...cache.all, data: cache.all.data.map(o => o.id === id ? { ...o, shipped: true } : o) } };
      if (cache.dispatch) cache = { ...cache, dispatch: { ...cache.dispatch, data: cache.dispatch.data.filter(o => o.id !== id), total: cache.dispatch.total - 1 } };
      invalidateAdminStats();
    }
    return res.ok;
  }, []);

  const updateStatus = useCallback(async (id: string, status: string): Promise<boolean> => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const apply = (list: AdminOrder[]) => list.map(o => o.id === id ? { ...o, status } : o);
      if (cache.all) cache = { ...cache, all: { ...cache.all, data: apply(cache.all.data) } };
      if (cache.dispatch) cache = { ...cache, dispatch: { ...cache.dispatch, data: apply(cache.dispatch.data) } };
      invalidateAdminStats();
    }
    return res.ok;
  }, []);

  const bulkUpdateStatus = useCallback(async (ids: string[], status: string): Promise<boolean> => {
    const results = await Promise.all(
      ids.map(id =>
        fetch(`/api/admin/orders/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }).then(r => r.ok)
      )
    );
    cache = { all: null, dispatch: null };
    invalidateAdminStats();
    return results.every(Boolean);
  }, []);

  const bulkMarkShipped = useCallback(async (ids: string[]): Promise<boolean> => {
    const results = await Promise.all(
      ids.map(id =>
        fetch(`/api/admin/orders/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shipped: true }),
        }).then(r => r.ok)
      )
    );
    cache = { all: null, dispatch: null };
    invalidateAdminStats();
    return results.every(Boolean);
  }, []);

  return (
    <AdminOrdersCtx.Provider value={{ getOrders, markShipped, updateStatus, bulkUpdateStatus, bulkMarkShipped }}>
      {children}
    </AdminOrdersCtx.Provider>
  );
}

export function useAdminOrders() {
  const ctx = useContext(AdminOrdersCtx);
  if (!ctx) throw new Error('useAdminOrders must be used within AdminOrdersProvider');
  return ctx;
}
