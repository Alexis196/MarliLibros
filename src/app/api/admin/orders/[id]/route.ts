import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const ALLOWED_STATUSES = ['pending', 'in_process', 'approved', 'rejected', 'cancelled'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const body = (await req.json()) as { shipped?: boolean; status?: string };

  const update: Record<string, unknown> = {};
  if (typeof body.shipped === 'boolean') {
    update.shipped = body.shipped;
    update.shipped_at = body.shipped ? new Date().toISOString() : null;
  }
  if (body.status) {
    if (!ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 });
    }
    update.status = body.status;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada para actualizar.' }, { status: 400 });
  }

  let { data, error } = await supabaseAdmin.from('orders').update(update).eq('id', id).select().single();

  // Gracia: si todavía no se corrió el alter de shipped_at en la base real (admin_schema.sql),
  // reintentamos sin esa columna en vez de romper la acción de despachar.
  if (error && 'shipped_at' in update && error.message?.includes('shipped_at')) {
    const { shipped_at, ...fallback } = update;
    void shipped_at;
    ({ data, error } = await supabaseAdmin.from('orders').update(fallback).eq('id', id).select().single());
  }

  if (error || !data) {
    return NextResponse.json({ error: 'No pudimos actualizar el pedido.' }, { status: 500 });
  }
  return NextResponse.json({ order: data });
}
