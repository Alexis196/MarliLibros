import Link from 'next/link';
import { getDashboardStats } from '@/lib/admin-stats';

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
}

const STATUS_LABEL: Record<string, string> = {
  approved: 'Aprobado',
  pending: 'Pendiente',
  in_process: 'En proceso',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
};

const STATUS_COLOR: Record<string, string> = {
  approved: '#345457',
  pending: '#C8A86B',
  in_process: '#C8A86B',
  rejected: '#B85C5C',
  cancelled: '#9AA6A4',
};

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    { label: 'Facturación total', value: formatPrice(stats.totalRevenue) },
    { label: 'Pedidos aprobados', value: String(stats.totalOrders) },
    { label: 'Ticket promedio', value: formatPrice(stats.averageTicket) },
    { label: 'Pedidos de hoy', value: String(stats.ordersToday) },
    { label: 'Por despachar', value: String(stats.pendingDispatch), accent: stats.pendingDispatch > 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#345457', fontFamily: 'var(--font-playfair)' }}>
        Dashboard
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {cards.map(card => (
          <div key={card.label} className="rounded-2xl bg-white p-4 sm:p-5" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
            <p className="text-[11px] font-medium text-gray-400 mb-1.5">{card.label}</p>
            <p className="text-xl sm:text-2xl font-bold" style={{ color: card.accent ? '#C8A86B' : '#345457' }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-5 sm:p-6" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold" style={{ color: '#345457' }}>Pedidos recientes</h2>
          <Link href="/admin/pedidos" className="text-[12px] font-semibold" style={{ color: '#345457' }}>
            Ver todos →
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">Todavía no hay pedidos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wide">
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium">Despacho</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map(order => (
                  <tr key={order.id} className="border-t border-gray-100">
                    <td className="py-3 text-gray-700">{order.customer_name}</td>
                    <td className="py-3">
                      <span
                        className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${STATUS_COLOR[order.status] ?? '#9AA6A4'}1A`, color: STATUS_COLOR[order.status] ?? '#9AA6A4' }}
                      >
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 text-[13px]">
                      {order.status === 'approved' ? (order.shipped ? 'Despachado' : 'Pendiente') : '—'}
                    </td>
                    <td className="py-3 text-right font-semibold" style={{ color: '#345457' }}>
                      {formatPrice(order.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
