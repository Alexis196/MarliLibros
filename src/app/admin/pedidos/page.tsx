import { getOrdersPageStats } from '@/lib/admin-stats';
import { OrdersPanel } from '@/components/admin/OrdersPanel';

export default async function AdminPedidosPage({ searchParams }: { searchParams: Promise<{ dispatch?: string }> }) {
  const { dispatch } = await searchParams;
  const stats = await getOrdersPageStats();
  return <OrdersPanel initialDispatchOnly={dispatch === '1'} stats={stats} />;
}
