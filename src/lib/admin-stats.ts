import { supabaseAdmin } from './supabase-admin';

export type RecentOrder = {
  id: string;
  customer_name: string;
  status: string;
  total_amount: number;
  shipped: boolean;
  created_at: string;
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
  const { data: approvedOrders } = await supabaseAdmin
    .from('orders')
    .select('total_amount, created_at')
    .eq('status', 'approved');

  const orders = approvedOrders ?? [];
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const totalOrders = orders.length;
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const ordersToday = orders.filter(o => new Date(o.created_at) >= todayStart).length;

  const pendingDispatch = await getPendingDispatchCount();

  const { data: recentOrders } = await supabaseAdmin
    .from('orders')
    .select('id, customer_name, status, total_amount, shipped, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    totalRevenue,
    totalOrders,
    averageTicket,
    ordersToday,
    pendingDispatch,
    recentOrders: (recentOrders ?? []) as RecentOrder[],
  };
}
