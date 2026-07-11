import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PrintLabelButton } from '@/components/admin/PrintLabelButton';

export default async function EtiquetaEnvioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: order } = await supabaseAdmin.from('orders').select('*').eq('id', id).single();

  if (!order) notFound();

  const shortId = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="max-w-xl">
      <div className="print:hidden flex items-center justify-between mb-6">
        <Link href="/admin/pedidos" className="text-sm font-semibold" style={{ color: '#345457' }}>
          ← Volver a pedidos
        </Link>
        <PrintLabelButton />
      </div>

      <div
        className="rounded-2xl bg-white p-8 print:p-6 print:shadow-none print:rounded-none"
        style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)', border: '2px solid #345457' }}
      >
        <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: '#C8A86B' }}>
          Marli Libros · Pedido #{shortId}
        </p>
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#345457', fontFamily: 'var(--font-playfair)' }}>
          {order.customer_name}
        </h1>

        <div className="space-y-3 text-lg text-gray-800">
          <p>{order.shipping_address}</p>
          {(order.city || order.province || order.postal_code) && (
            <p>{[order.city, order.province, order.postal_code && `CP ${order.postal_code}`].filter(Boolean).join(' — ')}</p>
          )}
          {order.customer_phone && <p>Tel: {order.customer_phone}</p>}
        </div>

        {order.address_reference && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-[12px] font-semibold text-gray-400 mb-1">Referencia</p>
            <p className="text-base text-gray-700">{order.address_reference}</p>
          </div>
        )}
      </div>
    </div>
  );
}
