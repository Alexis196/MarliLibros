'use client';

import { type ReactNode } from 'react';
import { AdminOrdersProvider } from '@/contexts/AdminOrdersContext';
import { AdminProductsProvider } from '@/contexts/AdminProductsContext';
import { AdminExpensesProvider } from '@/contexts/AdminExpensesContext';
import { AdminStatsProvider } from '@/contexts/AdminStatsContext';

export function AdminProviders({ children }: { children: ReactNode }) {
  return (
    <AdminOrdersProvider>
      <AdminProductsProvider>
        <AdminExpensesProvider>
          <AdminStatsProvider>
            {children}
          </AdminStatsProvider>
        </AdminExpensesProvider>
      </AdminProductsProvider>
    </AdminOrdersProvider>
  );
}
