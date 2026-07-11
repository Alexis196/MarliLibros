import Link from 'next/link';
import { TransactionalHeader, TransactionalFooter } from '@/components/TransactionalLayout';
import { ClearCartOnMount } from '@/components/ClearCartOnMount';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { mpPayment } from '@/lib/mercadopago';
import { finalizeApprovedOrder } from '@/lib/order-fulfillment';

async function getOrder(orderId: string | undefined, paymentId: string | undefined) {
  if (!orderId) return null;
  try {
    const { data } = await supabaseAdmin
      .from('orders')
      .select('id, status, customer_name, total_amount')
      .eq('id', orderId)
      .single();
    if (!data) return null;

    // Al volver de Checkout Pro, MP agrega payment_id a la back_url. Si el webhook
    // todavía no llegó (o no existe, p. ej. en localhost), conciliamos acá mismo
    // consultando el pago directo a la API — nunca confiamos en el status de la URL.
    if (data.status === 'pending' && paymentId) {
      try {
        const payment = await mpPayment.get({ id: paymentId });
        if (payment.external_reference === orderId && payment.status === 'approved') {
          await supabaseAdmin
            .from('orders')
            .update({ status: 'approved', mp_payment_id: String(payment.id), mp_status_detail: payment.status_detail ?? null })
            .eq('id', orderId);
          await finalizeApprovedOrder(orderId);
          return { order: { ...data, status: 'approved' } };
        }
      } catch (err) {
        console.error('No se pudo conciliar el pago al volver de Checkout Pro', orderId, err);
      }
    }

    return { order: data };
  } catch {
    return null;
  }
}

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ order_id?: string; payment_id?: string }> }) {
  const { order_id, payment_id } = await searchParams;
  const data = await getOrder(order_id, payment_id);

  return (
    <>
      <TransactionalHeader />
      <ClearCartOnMount />
      <main style={{ background: '#F7F6F2', minHeight: '70vh' }}>
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#345457' }}>
            <span className="text-white text-3xl">✓</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: '#345457', fontFamily: 'var(--font-playfair)' }}>
            ¡Gracias por tu compra!
          </h1>
          <p className="text-gray-500 text-sm mb-1">
            {data?.order ? `Pedido confirmado para ${data.order.customer_name}.` : 'Tu pago se procesó correctamente.'}
          </p>
          <p className="text-gray-400 text-[13px] mb-8">
            Te enviamos un email de confirmación con el detalle de tu compra.
          </p>
          <Link
            href="/catalogo"
            className="inline-flex px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#345457' }}
          >
            Seguir explorando
          </Link>
        </div>
      </main>
      <TransactionalFooter />
    </>
  );
}
