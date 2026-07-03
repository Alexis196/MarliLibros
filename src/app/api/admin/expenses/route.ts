import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import {
  listExpenses,
  createExpense,
  getExpenseStats,
  getDistinctSuppliers,
} from '@/lib/expenses';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;

  if (sp.get('stats') === '1') {
    const stats = await getExpenseStats();
    return NextResponse.json(stats);
  }

  if (sp.get('suppliers') === '1') {
    const suppliers = await getDistinctSuppliers();
    return NextResponse.json({ suppliers });
  }

  const { expenses, total } = await listExpenses({
    search:   sp.get('search')   ?? undefined,
    category: sp.get('category') ?? undefined,
    payment:  sp.get('payment')  ?? undefined,
    receipt:  (sp.get('receipt') as 'with' | 'without' | null) ?? undefined,
    dateFrom: sp.get('date_from') ?? undefined,
    dateTo:   sp.get('date_to')   ?? undefined,
    sort:     sp.get('sort')    ?? undefined,
    order:    (sp.get('order')  as 'asc' | 'desc' | null) ?? undefined,
    limit:    sp.get('limit')   ? Number(sp.get('limit'))  : undefined,
    offset:   sp.get('offset')  ? Number(sp.get('offset')) : undefined,
  });

  return NextResponse.json({ expenses, total });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json() as Record<string, unknown>;

    if (typeof body.amount !== 'number' || (body.amount as number) <= 0 || !body.description || !body.expense_date) {
      return NextResponse.json({ error: 'Completá monto, descripción y fecha.' }, { status: 400 });
    }

    const { data, error } = await createExpense({
      amount:         body.amount as number,
      description:    body.description as string,
      expense_date:   body.expense_date as string,
      category:       (body.category       as string | null) ?? null,
      supplier:       (body.supplier       as string | null) ?? null,
      payment_method: (body.payment_method as string | null) ?? null,
      invoice_number: (body.invoice_number as string | null) ?? null,
      notes:          (body.notes          as string | null) ?? null,
      tags:           (body.tags           as string[] | null) ?? [],
      receipt_url:    (body.receipt_url    as string | null) ?? null,
      currency:       (body.currency       as string) ?? 'ARS',
    });

    if (error) {
      console.error('create expense error', error);
      return NextResponse.json({ error: 'No pudimos guardar el gasto.' }, { status: 500 });
    }

    return NextResponse.json({ expense: data });
  } catch (err) {
    console.error('create expense error', err);
    return NextResponse.json({ error: 'Ocurrió un error inesperado.' }, { status: 500 });
  }
}
