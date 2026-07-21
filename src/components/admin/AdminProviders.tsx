'use client';

import { type ReactNode } from 'react';
import { AdminOrdersProvider } from '@/contexts/AdminOrdersContext';
import { AdminProductsProvider } from '@/contexts/AdminProductsContext';
import { AdminAuthorsProvider } from '@/contexts/AdminAuthorsContext';
import { AdminExpensesProvider } from '@/contexts/AdminExpensesContext';
import { AdminStatsProvider } from '@/contexts/AdminStatsContext';

export function AdminProviders({ children }: { children: ReactNode }) {
  return (
    <AdminOrdersProvider>
      <AdminProductsProvider>
        <AdminAuthorsProvider>
          <AdminExpensesProvider>
            <AdminStatsProvider>
              {children}
            </AdminStatsProvider>
          </AdminExpensesProvider>
        </AdminAuthorsProvider>
      </AdminProductsProvider>
    </AdminOrdersProvider>
  );
}
