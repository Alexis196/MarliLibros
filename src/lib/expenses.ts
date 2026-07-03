import { supabaseAdmin } from './supabase-admin';

export type Expense = {
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

export type ListExpensesParams = {
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

export async function listExpenses(
  params: ListExpensesParams = {}
): Promise<{ expenses: Expense[]; total: number }> {
  const {
    search, category, payment, receipt, dateFrom, dateTo,
    sort = 'expense_date', order = 'desc', limit = 40, offset = 0,
  } = params;

  let query = supabaseAdmin.from('expenses').select('*', { count: 'exact' });

  if (search) {
    query = query.or(
      `description.ilike.%${search}%,supplier.ilike.%${search}%,category.ilike.%${search}%,invoice_number.ilike.%${search}%,notes.ilike.%${search}%`
    );
  }
  if (category) query = query.eq('category', category);
  if (payment)  query = query.eq('payment_method', payment);
  if (receipt === 'with')    query = query.not('receipt_url', 'is', null);
  if (receipt === 'without') query = query.is('receipt_url', null);
  if (dateFrom) query = query.gte('expense_date', dateFrom);
  if (dateTo)   query = query.lte('expense_date', dateTo);

  const validSorts = ['expense_date', 'amount', 'category', 'supplier', 'created_at'];
  const col = validSorts.includes(sort) ? sort : 'expense_date';
  query = query.order(col, { ascending: order === 'asc' }).range(offset, offset + limit - 1);

  const { data, count } = await query;
  return { expenses: data ?? [], total: count ?? 0 };
}

export async function getExpenseStats(): Promise<ExpenseStats> {
  const now = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;
  const pad   = (n: number) => String(n).padStart(2, '0');

  const thisMonthStart = `${year}-${pad(month)}-01`;
  const nextMonth      = month === 12 ? 1 : month + 1;
  const nextMonthYear  = month === 12 ? year + 1 : year;
  const nextMonthStart = `${nextMonthYear}-${pad(nextMonth)}-01`;
  const prevMonth      = month === 1 ? 12 : month - 1;
  const prevMonthYear  = month === 1 ? year - 1 : year;
  const prevMonthStart = `${prevMonthYear}-${pad(prevMonth)}-01`;
  const thisYearStart  = `${year}-01-01`;

  // 6-month window for chart
  const chartStart = new Date(year, month - 7, 1);
  const chartStartStr = `${chartStart.getFullYear()}-${pad(chartStart.getMonth() + 1)}-01`;

  const [thisMonthRes, lastMonthRes, yearRes, noReceiptRes, chartRes] = await Promise.all([
    supabaseAdmin.from('expenses').select('amount').gte('expense_date', thisMonthStart).lt('expense_date', nextMonthStart),
    supabaseAdmin.from('expenses').select('amount').gte('expense_date', prevMonthStart).lt('expense_date', thisMonthStart),
    supabaseAdmin.from('expenses').select('amount, category').gte('expense_date', thisYearStart),
    supabaseAdmin.from('expenses').select('id', { count: 'exact', head: true }).is('receipt_url', null),
    supabaseAdmin.from('expenses').select('expense_date, amount').gte('expense_date', chartStartStr).order('expense_date', { ascending: true }),
  ]);

  const totalThisMonth  = (thisMonthRes.data ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const countThisMonth  = (thisMonthRes.data ?? []).length;
  const totalLastMonth  = (lastMonthRes.data ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const yearRows        = yearRes.data ?? [];
  const totalThisYear   = yearRows.reduce((s, e) => s + Number(e.amount), 0);
  const avgMonthly      = month > 0 ? totalThisYear / month : 0;
  const noReceiptCount  = noReceiptRes.count ?? 0;

  // Top category by total amount this year
  const catTotals: Record<string, number> = {};
  for (const e of yearRows) {
    if (e.category) catTotals[e.category] = (catTotals[e.category] ?? 0) + Number(e.amount);
  }
  const topCategory = Object.keys(catTotals).length > 0
    ? Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  // Monthly chart: last 6 months including current
  const chartTotals: Record<string, number> = {};
  for (const e of chartRes.data ?? []) {
    const key = e.expense_date.slice(0, 7);
    chartTotals[key] = (chartTotals[key] ?? 0) + Number(e.amount);
  }
  const monthly: { month: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d   = new Date(year, month - 1 - i, 1);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    monthly.push({ month: key, total: chartTotals[key] ?? 0 });
  }

  return { totalThisMonth, totalLastMonth, totalThisYear, avgMonthly, countThisMonth, topCategory, noReceiptCount, monthly };
}

export async function getDistinctSuppliers(): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('expenses')
    .select('supplier')
    .not('supplier', 'is', null)
    .order('supplier', { ascending: true });
  const seen = new Set<string>();
  for (const row of data ?? []) if (row.supplier) seen.add(row.supplier);
  return Array.from(seen);
}

export async function createExpense(input: Omit<Expense, 'id' | 'created_at'>) {
  return supabaseAdmin
    .from('expenses')
    .insert({
      amount:         input.amount,
      description:    input.description,
      expense_date:   input.expense_date,
      category:       input.category       ?? null,
      supplier:       input.supplier       ?? null,
      payment_method: input.payment_method ?? null,
      invoice_number: input.invoice_number ?? null,
      notes:          input.notes          ?? null,
      tags:           input.tags           ?? [],
      receipt_url:    input.receipt_url    ?? null,
      currency:       input.currency       ?? 'ARS',
    })
    .select()
    .single();
}

export async function updateExpense(
  id: string,
  patch: Partial<Omit<Expense, 'id' | 'created_at'>>
) {
  return supabaseAdmin
    .from('expenses')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
}

export async function deleteExpense(id: string) {
  return supabaseAdmin.from('expenses').delete().eq('id', id);
}
