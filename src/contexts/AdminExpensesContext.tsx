'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';

export type AdminExpense = {
  id: string;
  amount: number;
  description: string;
  expense_date: string;
  created_at: string;
  category?: string | null;
  supplier?: string | null;
  payment_method?: string | null;
  invoice_number?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  receipt_url?: string | null;
  currency?: string;
};

export type ExpenseStats = {
  totalThisMonth: number;
  totalLastMonth: number;
  totalThisYear: number;
  avgMonthly: number;
  countThisMonth: number;
  topCategory: string | null;
  noReceiptCount: number;
  monthly: { month: string; total: number }[];
};

export type FetchExpensesParams = {
  search?: string;
  category?: string;
  payment?: string;
  receipt?: 'with' | 'without';
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};

export type ExpensesResult = { expenses: AdminExpense[]; total: number };

export type SaveExpenseInput = Omit<AdminExpense, 'id' | 'created_at'>;
export type SaveExpenseResult = { ok: boolean; expense?: AdminExpense; error?: string };

type Ctx = {
  getExpenses: (params?: FetchExpensesParams) => Promise<ExpensesResult>;
  getStats: () => Promise<ExpenseStats>;
  getSuppliers: () => Promise<string[]>;
  saveExpense: (input: SaveExpenseInput, id?: string) => Promise<SaveExpenseResult>;
  deleteExpense: (id: string) => Promise<boolean>;
  duplicateExpense: (expense: AdminExpense) => Promise<SaveExpenseResult>;
};

const AdminExpensesCtx = createContext<Ctx | null>(null);

export function AdminExpensesProvider({ children }: { children: ReactNode }) {
  const getExpenses = useCallback(async (params: FetchExpensesParams = {}): Promise<ExpensesResult> => {
    const qs = new URLSearchParams();
    if (params.search)   qs.set('search',    params.search);
    if (params.category) qs.set('category',  params.category);
    if (params.payment)  qs.set('payment',   params.payment);
    if (params.receipt)  qs.set('receipt',   params.receipt);
    if (params.dateFrom) qs.set('date_from', params.dateFrom);
    if (params.dateTo)   qs.set('date_to',   params.dateTo);
    if (params.sort)     qs.set('sort',      params.sort);
    if (params.order)    qs.set('order',     params.order);
    if (params.limit)    qs.set('limit',     String(params.limit));
    if (params.offset)   qs.set('offset',    String(params.offset));

    const res  = await fetch(`/api/admin/expenses?${qs}`);
    const data = await res.json();
    return { expenses: data.expenses ?? [], total: data.total ?? 0 };
  }, []);

  const getStats = useCallback(async (): Promise<ExpenseStats> => {
    const res  = await fetch('/api/admin/expenses?stats=1');
    const data = await res.json();
    return data as ExpenseStats;
  }, []);

  const getSuppliers = useCallback(async (): Promise<string[]> => {
    const res  = await fetch('/api/admin/expenses?suppliers=1');
    const data = await res.json();
    return (data.suppliers as string[]) ?? [];
  }, []);

  const saveExpense = useCallback(async (input: SaveExpenseInput, id?: string): Promise<SaveExpenseResult> => {
    const isEdit = Boolean(id);
    const res = await fetch(isEdit ? `/api/admin/expenses/${id}` : '/api/admin/expenses', {
      method:  isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: (data.error as string) ?? 'Error al guardar.' };
    return { ok: true, expense: data.expense as AdminExpense };
  }, []);

  const deleteExpense = useCallback(async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/admin/expenses/${id}`, { method: 'DELETE' });
    return res.ok;
  }, []);

  const duplicateExpense = useCallback(async (expense: AdminExpense): Promise<SaveExpenseResult> => {
    const input: SaveExpenseInput = {
      description:    `${expense.description} (copia)`,
      amount:         expense.amount,
      expense_date:   new Date().toISOString().slice(0, 10),
      category:       expense.category       ?? null,
      supplier:       expense.supplier       ?? null,
      payment_method: expense.payment_method ?? null,
      invoice_number: null,
      notes:          expense.notes          ?? null,
      tags:           expense.tags           ?? [],
      receipt_url:    null,
      currency:       expense.currency       ?? 'ARS',
    };
    const res  = await fetch('/api/admin/expenses', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: (data.error as string) ?? 'Error al duplicar.' };
    return { ok: true, expense: data.expense as AdminExpense };
  }, []);

  return (
    <AdminExpensesCtx.Provider value={{ getExpenses, getStats, getSuppliers, saveExpense, deleteExpense, duplicateExpense }}>
      {children}
    </AdminExpensesCtx.Provider>
  );
}

export function useAdminExpenses() {
  const ctx = useContext(AdminExpensesCtx);
  if (!ctx) throw new Error('useAdminExpenses must be used within AdminExpensesProvider');
  return ctx;
}
