import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const dispatchOnly = req.nextUrl.searchParams.get('dispatch') === '1';

  let query = supabaseAdmin
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (dispatchOnly) {
    query = query.eq('status', 'approved').eq('shipped', false);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'No pudimos cargar los pedidos.' }, { status: 500 });
  }
  return NextResponse.json({ orders: data ?? [] });
}
