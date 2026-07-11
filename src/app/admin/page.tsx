import Link from 'next/link';
import { getDashboardStats, type DashboardInsight } from '@/lib/admin-stats';
import { SalesChart } from '@/components/admin/SalesChart';
import { TopSellersPanel } from '@/components/admin/TopSellersPanel';

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
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

function TrendBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const up = delta >= 0;
  return (
    <span
      className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
      style={{
        backgroundColor: up ? 'rgba(52,84,87,0.10)' : 'rgba(184,92,92,0.10)',
        color: up ? '#345457' : '#B85C5C',
      }}
    >
      {up ? '↑' : '↓'} {Math.abs(delta)}%
    </span>
  );
}

function InsightsSection({ insights }: { insights: DashboardInsight[] }) {
  if (insights.length === 0) return null;
  return (
    <div className="rounded-2xl overflow-hidden mb-8" style={{ border: '1px solid rgba(52,84,87,0.10)' }}>
      {insights.map((insight, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 text-sm"
          style={{
            backgroundColor:
              insight.severity === 'warning'
                ? 'rgba(200,168,107,0.08)'
                : insight.severity === 'success'
                ? 'rgba(52,84,87,0.05)'
                : 'rgba(52,84,87,0.03)',
            borderTop: i > 0 ? '1px solid rgba(52,84,87,0.06)' : undefined,
          }}
        >
          <span className="text-base shrink-0">{insight.icon}</span>
          <span
            style={{
              color: insight.severity === 'warning' ? '#9A7A3A' : insight.severity === 'success' ? '#345457' : '#5A7274',
            }}
          >
            {insight.text}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    {
      label: 'Por despachar',
      value: String(stats.pendingDispatch),
      delta: null,
      accent: stats.pendingDispatch > 0,
      urgent: stats.pendingDispatch >= 5,
      href: '/admin/pedidos?dispatch=1',
      sub: stats.pendingDispatch > 0 ? 'Requieren envío' : 'Al día ✓',
    },
    {
      label: 'Pedidos de hoy',
      value: String(stats.ordersToday),
      delta: null,
      accent: false,
      urgent: false,
      href: null,
      sub: `${stats.ordersThisMonth} este mes`,
    },
    {
      label: 'Facturación del mes',
      value: formatPrice(stats.revenueThisMonth),
      delta: stats.revenueDelta,
      accent: false,
      urgent: false,
      href: null,
      sub: 'vs. mes anterior',
    },
    {
      label: 'Ticket promedio',
      value: formatPrice(stats.averageTicketThisMonth),
      delta: stats.ticketDelta,
      accent: false,
      urgent: false,
      href: null,
      sub: `${stats.ordersThisMonth} pedidos aprobados`,
    },
    {
      label: 'Facturación total',
      value: formatPrice(stats.totalRevenue),
      delta: null,
      accent: false,
      urgent: false,
      href: null,
      sub: `${stats.totalOrders} pedidos históricos`,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#345457', fontFamily: 'var(--font-playfair)' }}>
        Dashboard
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {cards.map(card => {
          const inner = (
            <div
              className="rounded-2xl bg-white p-4 sm:p-5 h-full flex flex-col transition-all duration-200 hover:-translate-y-0.5"
              style={{
                boxShadow: card.urgent
                  ? '0 4px 20px rgba(200,168,107,0.18)'
                  : '0 4px 20px rgba(52,84,87,0.06)',
                border: card.urgent
                  ? '1px solid rgba(200,168,107,0.35)'
                  : card.accent
                  ? '1px solid rgba(52,84,87,0.12)'
                  : '1px solid transparent',
                cursor: card.href ? 'pointer' : 'default',
              }}
            >
              <p className="text-[12px] font-medium text-gray-400 mb-2">{card.label}</p>
              <p
                className="text-xl sm:text-2xl font-bold leading-none mb-2"
                style={{ color: card.urgent ? '#C8A86B' : '#345457' }}
              >
                {card.value}
              </p>
              <div className="flex items-center gap-1.5 mt-auto">
                {card.delta !== null && <TrendBadge delta={card.delta} />}
                {card.sub && (
                  <p className="text-[11px] text-gray-400 truncate">{card.sub}</p>
                )}
              </div>
            </div>
          );

          return card.href ? (
            <Link key={card.label} href={card.href} className="block">
              {inner}
            </Link>
          ) : (
            <div key={card.label}>{inner}</div>
          );
        })}
      </div>

      <InsightsSection insights={stats.insights} />

      <div className="mb-8">
        <SalesChart />
      </div>

      <div className="mb-8">
        <TopSellersPanel />
      </div>

      <div className="rounded-2xl bg-white p-5 sm:p-6" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold" style={{ color: '#345457' }}>Pedidos recientes</h2>
          <Link href="/admin/pedidos" className="text-[12px] font-semibold" style={{ color: '#345457' }}>
            Ver todos →
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(52,84,87,0.06)' }}>
              <span className="text-xl">📦</span>
            </div>
            <p className="text-sm font-semibold text-gray-600">Sin pedidos aún</p>
            <p className="text-xs text-gray-400">Cuando lleguen los primeros pedidos aparecerán aquí</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wide">
                  <th className="pb-3 font-semibold px-1">Cliente</th>
                  <th className="pb-3 font-semibold px-1">Estado</th>
                  <th className="pb-3 font-semibold px-1">Despacho</th>
                  <th className="pb-3 font-semibold px-1 text-right">Total</th>
                  <th className="pb-3 font-semibold px-1 text-right">Cuándo</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map(order => (
                  <tr
                    key={order.id}
                    className="border-t border-gray-100 group transition-colors duration-150 hover:bg-[rgba(52,84,87,0.02)]"
                  >
                    <td className="py-3 px-1">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
                          style={{ backgroundColor: '#345457' }}
                        >
                          {initials(order.customer_name)}
                        </div>
                        <span className="text-gray-700 font-medium">{order.customer_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-1">
                      <span
                        className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${STATUS_COLOR[order.status] ?? '#9AA6A4'}1A`,
                          color: STATUS_COLOR[order.status] ?? '#9AA6A4',
                        }}
                      >
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="py-3 px-1">
                      {order.status === 'approved' ? (
                        order.shipped ? (
                          <span className="text-[12px] font-semibold" style={{ color: '#345457' }}>
                            <span className="mr-1">✓</span>Despachado
                          </span>
                        ) : (
                          <span className="text-[12px] font-semibold" style={{ color: '#C8A86B' }}>
                            <span className="mr-1">📦</span>Pendiente
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400 text-[12px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-1 text-right font-bold" style={{ color: '#345457' }}>
                      {formatPrice(order.total_amount)}
                    </td>
                    <td className="py-3 px-1 text-right text-[12px] text-gray-400 whitespace-nowrap">
                      {formatRelative(order.created_at)}
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
