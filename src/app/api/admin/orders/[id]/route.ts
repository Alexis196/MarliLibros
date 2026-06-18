import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const body = (await req.json()) as { shipped?: boolean };
  const shipped = body.shipped ?? true;

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ shipped, shipped_at: shipped ? new Date().toISOString() : null })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'No pudimos actualizar el pedido.' }, { status: 500 });
  }
  return NextResponse.json({ order: data });
}
