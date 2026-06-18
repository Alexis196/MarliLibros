import { OrdersPanel } from '@/components/admin/OrdersPanel';

export default async function AdminPedidosPage({ searchParams }: { searchParams: Promise<{ dispatch?: string }> }) {
  const { dispatch } = await searchParams;
  return <OrdersPanel initialDispatchOnly={dispatch === '1'} />;
}
