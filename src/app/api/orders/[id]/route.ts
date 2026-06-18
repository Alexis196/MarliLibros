import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('id, status, customer_name, total_amount, shipping_address, created_at')
    .eq('id', id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
  }

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('title, author_name, price, quantity')
    .eq('order_id', id);

  return NextResponse.json({ order, items: items ?? [] });
}
