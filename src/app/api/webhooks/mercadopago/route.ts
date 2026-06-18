import { NextRequest, NextResponse } from 'next/server';
import { mpPayment } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { finalizeApprovedOrder } from '@/lib/order-fulfillment';

const STATUS_MAP: Record<string, string> = {
  approved: 'approved',
  rejected: 'rejected',
  in_process: 'in_process',
  pending: 'pending',
  cancelled: 'cancelled',
  refunded: 'cancelled',
};

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    let type = url.searchParams.get('type') ?? url.searchParams.get('topic') ?? undefined;
    let paymentId = url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? undefined;

    if (!type || !paymentId) {
      const body = await req.json().catch(() => null) as { type?: string; data?: { id?: string } } | null;
      type = type ?? body?.type;
      paymentId = paymentId ?? body?.data?.id;
    }

    if (type !== 'payment' || !paymentId) {
      return NextResponse.json({ received: true });
    }

    // Nunca confiamos en el payload de la notificación: volvemos a pedirle el pago a la API de Mercado Pago.
    const payment = await mpPayment.get({ id: paymentId });
    const orderId = payment.external_reference;
    if (!orderId) return NextResponse.json({ received: true });

    const status = STATUS_MAP[payment.status ?? ''] ?? 'pending';

    await supabaseAdmin
      .from('orders')
      .update({
        status,
        mp_payment_id: String(payment.id),
        mp_status_detail: payment.status_detail ?? null,
      })
      .eq('id', orderId);

    if (status === 'approved') {
      await finalizeApprovedOrder(orderId);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('mercadopago webhook error', err);
    // Respondemos 200 igual: ya quedó logueado, y evitamos reintentos infinitos de MP por errores nuestros.
    return NextResponse.json({ received: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
