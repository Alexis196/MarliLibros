import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const dispatchOnly = sp.get('dispatch') === '1';
  // Comas y paréntesis rompen la sintaxis del filtro or() de PostgREST
  const search = (sp.get('search')?.trim() ?? '').replace(/[,()]/g, ' ').trim();
  const statusFilter = sp.get('status') ?? '';
  const dateFilter = sp.get('date') ?? '';
  const minAmount = sp.get('min_amount') ? Number(sp.get('min_amount')) : null;
  const maxAmount = sp.get('max_amount') ? Number(sp.get('max_amount')) : null;
  const province = sp.get('province')?.trim() ?? '';
  const limit = Math.min(Number(sp.get('limit') ?? '25'), 100);
  const offset = Number(sp.get('offset') ?? '0');

  // Pre-fetch order IDs matching book title search
  let bookOrderIds: string[] = [];
  if (search) {
    const { data: itemMatches } = await supabaseAdmin
      .from('order_items')
      .select('order_id')
      .ilike('title', `%${search}%`);
    bookOrderIds = [...new Set((itemMatches ?? []).map((i: { order_id: string }) => i.order_id))];
  }

  let query = supabaseAdmin
    .from('orders')
    .select('*, order_items(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (dispatchOnly) {
    query = query.eq('status', 'approved').eq('shipped', false);
  } else if (statusFilter) {
    const statuses = statusFilter.split(',').filter(Boolean);
    if (statuses.length === 1) {
      query = query.eq('status', statuses[0]);
    } else if (statuses.length > 1) {
      query = query.in('status', statuses);
    }
  }

  if (dateFilter) {
    const now = new Date();
    let from: string | null = null;
    let to: string | null = null;
    if (dateFilter === 'today') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    } else if (dateFilter === 'yesterday') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    } else if (dateFilter === 'week') {
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((day + 6) % 7));
      monday.setHours(0, 0, 0, 0);
      from = monday.toISOString();
      to = new Date(monday.getTime() + 7 * 86400000).toISOString();
    } else if (dateFilter === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      to = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    }
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lt('created_at', to);
  }

  if (minAmount !== null && !isNaN(minAmount)) query = query.gte('total_amount', minAmount);
  if (maxAmount !== null && !isNaN(maxAmount)) query = query.lte('total_amount', maxAmount);
  if (province) query = query.ilike('province', `%${province}%`);

  if (search) {
    const parts = [
      `customer_name.ilike.%${search}%`,
      `customer_email.ilike.%${search}%`,
      `customer_phone.ilike.%${search}%`,
    ];
    if (bookOrderIds.length > 0) {
      parts.push(`id.in.(${bookOrderIds.join(',')})`);
    }
    query = query.or(parts.join(','));
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: 'No pudimos cargar los pedidos.' }, { status: 500 });
  }
  return NextResponse.json({ orders: data ?? [], total: count ?? 0 });
}
