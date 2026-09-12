import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // order e items solo dependen de `id` (no uno del otro): se piden en paralelo.
  // En el caso raro de pedido inexistente se pide items de más, pero se gana
  // latencia en el camino normal (que es el que importa acá).
  const [{ data: order, error }, { data: items }] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('id, status, customer_name, total_amount, shipping_address, created_at')
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('order_items')
      .select('title, author_name, price, quantity')
      .eq('order_id', id),
  ]);

  if (error || !order) {
    return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
  }

  return NextResponse.json({ order, items: items ?? [] });
}
