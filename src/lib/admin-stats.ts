import { supabaseAdmin } from './supabase-admin';

export type RecentOrder = {
  id: string;
  customer_name: string;
  status: string;
  total_amount: number;
  shipped: boolean;
  created_at: string;
};

export type DashboardInsight = {
  icon: string;
  text: string;
  severity: 'info' | 'warning' | 'success';
};

export async function getPendingDispatchCount() {
  const { count } = await supabaseAdmin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved')
    .eq('shipped', false);
  return count ?? 0;
}

export async function getDashboardStats() {
  const now = new Date();

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [
    { data: allApproved },
    { data: thisMonthOrders },
    { data: lastMonthOrders },
    { data: recentOrders },
    pendingDispatch,
    { count: pendingApproval },
  ] = await Promise.all([
    supabaseAdmin.from('orders').select('total_amount').eq('status', 'approved'),
    supabaseAdmin.from('orders').select('total_amount, created_at').eq('status', 'approved').gte('created_at', thisMonthStart),
    supabaseAdmin.from('orders').select('total_amount').eq('status', 'approved').gte('created_at', lastMonthStart).lt('created_at', lastMonthEnd),
    supabaseAdmin.from('orders').select('id, customer_name, status, total_amount, shipped, created_at').order('created_at', { ascending: false }).limit(10),
    getPendingDispatchCount(),
    supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'in_process']),
  ]);

  const totalRevenue = (allApproved ?? []).reduce((s, o) => s + Number(o.total_amount), 0);
  const totalOrders = (allApproved ?? []).length;

  const revenueThisMonth = (thisMonthOrders ?? []).reduce((s, o) => s + Number(o.total_amount), 0);
  const ordersThisMonth = (thisMonthOrders ?? []).length;
  const averageTicketThisMonth = ordersThisMonth > 0 ? revenueThisMonth / ordersThisMonth : 0;

  const revenueLastMonth = (lastMonthOrders ?? []).reduce((s, o) => s + Number(o.total_amount), 0);
  const ordersLastMonth = (lastMonthOrders ?? []).length;
  const averageTicketLastMonth = ordersLastMonth > 0 ? revenueLastMonth / ordersLastMonth : 0;

  const ordersToday = (thisMonthOrders ?? []).filter(o => o.created_at >= todayStart).length;

  const revenueDelta = revenueLastMonth > 0 ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100) : null;
  const ordersDelta = ordersLastMonth > 0 ? Math.round(((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100) : null;
  const ticketDelta = averageTicketLastMonth > 0 ? Math.round(((averageTicketThisMonth - averageTicketLastMonth) / averageTicketLastMonth) * 100) : null;

  const insights: DashboardInsight[] = [];

  if (pendingDispatch > 0) {
    insights.push({
      icon: '⚠️',
      text: `${pendingDispatch} pedido${pendingDispatch === 1 ? '' : 's'} aprobado${pendingDispatch === 1 ? '' : 's'} sin despachar`,
      severity: pendingDispatch >= 5 ? 'warning' : 'info',
    });
  }

  if ((pendingApproval ?? 0) > 0) {
    insights.push({
      icon: '📋',
      text: `${pendingApproval} pedido${pendingApproval === 1 ? '' : 's'} esperando aprobación`,
      severity: 'warning',
    });
  }

  if (revenueDelta !== null && revenueDelta > 0) {
    insights.push({
      icon: '📈',
      text: `Las ventas de este mes crecieron ${revenueDelta}% vs. el mes anterior`,
      severity: 'success',
    });
  } else if (revenueDelta !== null && revenueDelta < -10) {
    insights.push({
      icon: '📉',
      text: `Las ventas bajaron ${Math.abs(revenueDelta)}% vs. el mes anterior`,
      severity: 'warning',
    });
  }

  if (ordersToday > 0) {
    insights.push({
      icon: '🛍️',
      text: `${ordersToday} pedido${ordersToday === 1 ? '' : 's'} nuevo${ordersToday === 1 ? '' : 's'} hoy`,
      severity: 'info',
    });
  }

  if (ticketDelta !== null && ticketDelta > 15) {
    insights.push({
      icon: '🎯',
      text: `Ticket promedio récord este mes (+${ticketDelta}% vs. mes anterior)`,
      severity: 'success',
    });
  }

  return {
    totalRevenue,
    totalOrders,
    revenueThisMonth,
    ordersThisMonth,
    averageTicketThisMonth,
    revenueDelta,
    ordersDelta,
    ticketDelta,
    ordersToday,
    pendingDispatch,
    pendingApproval: pendingApproval ?? 0,
    insights,
    recentOrders: (recentOrders ?? []) as RecentOrder[],
  };
}

export type MonthlyPoint = { month: number; ventas: number; gastos: number; envios: number };

export async function getMonthlySummary(year: number): Promise<MonthlyPoint[]> {
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;

  const [{ data: orders }, { data: expenses }, { data: shippedOrders }] = await Promise.all([
    supabaseAdmin.from('orders').select('total_amount, created_at').eq('status', 'approved').gte('created_at', start).lt('created_at', end),
    supabaseAdmin.from('expenses').select('amount, expense_date').gte('expense_date', start).lt('expense_date', end),
    supabaseAdmin.from('orders').select('*').eq('shipped', true).gte('created_at', start).lt('created_at', end),
  ]);

  const points: MonthlyPoint[] = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, ventas: 0, gastos: 0, envios: 0 }));

  (orders ?? []).forEach(o => {
    points[new Date(o.created_at).getMonth()].ventas += Number(o.total_amount);
  });
  (expenses ?? []).forEach(e => {
    points[new Date(e.expense_date).getMonth()].gastos += Number(e.amount);
  });
  (shippedOrders ?? []).forEach((o: Record<string, unknown>) => {
    const dateStr = (o.shipped_at as string | null) ?? (o.created_at as string);
    if (!dateStr) return;
    points[new Date(dateStr).getMonth()].envios += 1;
  });

  return points;
}

export type AnnualPoint = { year: number; ventas: number; gastos: number; envios: number };

export async function getAnnualSummary(yearsBack = 5): Promise<AnnualPoint[]> {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - yearsBack + 1;
  const start = `${startYear}-01-01`;

  const [{ data: orders }, { data: expenses }, { data: shippedOrders }] = await Promise.all([
    supabaseAdmin.from('orders').select('total_amount, created_at').eq('status', 'approved').gte('created_at', start),
    supabaseAdmin.from('expenses').select('amount, expense_date').gte('expense_date', start),
    supabaseAdmin.from('orders').select('*').eq('shipped', true).gte('created_at', start),
  ]);

  const points = new Map<number, AnnualPoint>();
  for (let y = startYear; y <= currentYear; y++) points.set(y, { year: y, ventas: 0, gastos: 0, envios: 0 });

  (orders ?? []).forEach(o => {
    const p = points.get(new Date(o.created_at).getFullYear());
    if (p) p.ventas += Number(o.total_amount);
  });
  (expenses ?? []).forEach(e => {
    const p = points.get(new Date(e.expense_date).getFullYear());
    if (p) p.gastos += Number(e.amount);
  });
  (shippedOrders ?? []).forEach((o: Record<string, unknown>) => {
    const dateStr = (o.shipped_at as string | null) ?? (o.created_at as string);
    if (!dateStr) return;
    const p = points.get(new Date(dateStr).getFullYear());
    if (p) p.envios += 1;
  });

  return Array.from(points.values());
}

export type OrdersPageStats = {
  total: number;
  pending: number;
  dispatchPending: number;
  revenueToday: number;
};

export async function getOrdersPageStats(): Promise<OrdersPageStats> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [
    { count: total },
    { count: pending },
    { count: dispatchPending },
    { data: todayOrders },
  ] = await Promise.all([
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'in_process']),
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'approved').eq('shipped', false),
    supabaseAdmin.from('orders').select('total_amount').gte('created_at', todayStart).in('status', ['approved', 'pending', 'in_process']),
  ]);

  const revenueToday = (todayOrders ?? []).reduce((s, o) => s + Number(o.total_amount), 0);

  return {
    total: total ?? 0,
    pending: pending ?? 0,
    dispatchPending: dispatchPending ?? 0,
    revenueToday,
  };
}

export type TopSeller = { label: string; quantity: number };

export async function getTopSellers(from: string, to: string): Promise<{ categories: TopSeller[]; titles: TopSeller[] }> {
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('order_items(title, quantity, book_id)')
    .eq('status', 'approved')
    .gte('created_at', from)
    .lt('created_at', to);

  type Item = { title: string; quantity: number; book_id: string | null };
  const items: Item[] = (orders ?? []).flatMap(o => (o.order_items ?? []) as Item[]);

  const titleMap = new Map<string, number>();
  const bookIds = new Set<string>();
  items.forEach(it => {
    titleMap.set(it.title, (titleMap.get(it.title) ?? 0) + it.quantity);
    if (it.book_id) bookIds.add(it.book_id);
  });

  const { data: books } =
    bookIds.size > 0
      ? await supabaseAdmin.from('books').select('id, category').in('id', Array.from(bookIds))
      : { data: [] as { id: string; category: string }[] };

  const categoryByBookId = new Map((books ?? []).map(b => [b.id, b.category]));
  const categoryMap = new Map<string, number>();
  items.forEach(it => {
    const category = (it.book_id && categoryByBookId.get(it.book_id)) || 'Sin categoría';
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + it.quantity);
  });

  const toSorted = (m: Map<string, number>): TopSeller[] =>
    Array.from(m.entries())
      .map(([label, quantity]) => ({ label, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

  return { categories: toSorted(categoryMap), titles: toSorted(titleMap) };
}
