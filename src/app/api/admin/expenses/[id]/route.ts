import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { updateExpense, deleteExpense } from '@/lib/expenses';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const body = await req.json();
    const { data, error } = await updateExpense(id, body);
    if (error) {
      console.error('update expense error', error);
      return NextResponse.json({ error: 'No pudimos actualizar el gasto.' }, { status: 500 });
    }
    return NextResponse.json({ expense: data });
  } catch (err) {
    console.error('update expense error', err);
    return NextResponse.json({ error: 'Ocurrió un error inesperado.' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error } = await deleteExpense(id);
  if (error) {
    return NextResponse.json({ error: 'No pudimos eliminar el gasto.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
