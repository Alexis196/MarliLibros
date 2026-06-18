'use client';

import { useEffect, useState } from 'react';

type OrderItem = { title: string; author_name: string; price: number; quantity: number };

type Order = {
  id: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: string;
  total_amount: number;
  shipped: boolean;
  created_at: string;
  order_items: OrderItem[];
};

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

function pillClass(active: boolean) {
  return `px-4 py-1.5 rounded-full text-sm font-medium border transition-colors duration-300 ${
    active
      ? 'bg-[#345457] text-white border-[#345457]'
      : 'bg-white text-gray-500 border-gray-200 hover:border-[#345457]/30 hover:text-[#345457]'
  }`;
}

export function OrdersPanel({ initialDispatchOnly }: { initialDispatchOnly: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatchOnly, setDispatchOnly] = useState(initialDispatchOnly);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/orders${dispatchOnly ? '?dispatch=1' : ''}`)
      .then(res => res.json())
      .then(data => setOrders(data.orders ?? []))
      .finally(() => setLoading(false));
  }, [dispatchOnly]);

  const selectFilter = (value: boolean) => {
    setLoading(true);
    setDispatchOnly(value);
  };

  const markShipped = async (id: string) => {
    setUpdatingId(id);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipped: true }),
    });
    if (res.ok) {
      setOrders(prev =>
        dispatchOnly ? prev.filter(o => o.id !== id) : prev.map(o => (o.id === id ? { ...o, shipped: true } : o))
      );
    }
    setUpdatingId(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#345457', fontFamily: 'var(--font-playfair)' }}>
          Pedidos
        </h1>
        <div className="flex gap-2">
          <button onClick={() => selectFilter(false)} className={pillClass(!dispatchOnly)}>
            Todos
          </button>
          <button onClick={() => selectFilter(true)} className={pillClass(dispatchOnly)}>
            Por despachar
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Cargando…</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No hay pedidos para mostrar.</div>
        ) : (
          orders.map((order, i) => (
            <div key={order.id} className={i > 0 ? 'border-t border-gray-100' : ''}>
              <button
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                className="w-full flex items-center justify-between gap-3 text-left p-5 hover:bg-[rgba(52,84,87,0.03)] transition-colors duration-300"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{order.customer_name}</p>
                  <p className="text-[12px] text-gray-400">{new Date(order.created_at).toLocaleString('es-AR')}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className="text-[12px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                      backgroundColor: `${STATUS_COLOR[order.status] ?? '#9AA6A4'}1A`,
                      color: STATUS_COLOR[order.status] ?? '#9AA6A4',
                    }}
                  >
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                  <span className="text-sm font-bold whitespace-nowrap" style={{ color: '#345457' }}>
                    {formatPrice(order.total_amount)}
                  </span>
                </div>
              </button>

              {expandedId === order.id && (
                <div className="px-5 pb-5 grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[11px] font-medium text-gray-400 mb-1">Contacto</p>
                    <p className="text-gray-600">{order.customer_email}</p>
                    {order.customer_phone && <p className="text-gray-600">{order.customer_phone}</p>}
                    <p className="text-[11px] font-medium text-gray-400 mt-3 mb-1">Envío</p>
                    <p className="text-gray-600">{order.shipping_address}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-gray-400 mb-1">Items</p>
                    <ul className="space-y-1">
                      {order.order_items.map((item, idx) => (
                        <li key={idx} className="flex justify-between gap-3 text-gray-600">
                          <span className="truncate">{item.title} x{item.quantity}</span>
                          <span className="font-medium shrink-0">{formatPrice(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    {order.status === 'approved' &&
                      (order.shipped ? (
                        <p className="text-[12px] mt-3 font-semibold" style={{ color: '#345457' }}>
                          ✓ Despachado
                        </p>
                      ) : (
                        <button
                          onClick={() => markShipped(order.id)}
                          disabled={updatingId === order.id}
                          className="mt-3 px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                          style={{ backgroundColor: '#345457' }}
                        >
                          {updatingId === order.id ? 'Marcando…' : 'Marcar como despachado'}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
