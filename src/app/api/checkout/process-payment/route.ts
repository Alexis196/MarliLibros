import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { mpPayment } from '@/lib/mercadopago';
import { finalizeApprovedOrder } from '@/lib/order-fulfillment';
import { resolveOrder, type CartItemInput } from '@/lib/checkout-helpers';

const STATUS_MAP: Record<string, string> = {
  approved: 'approved',
  rejected: 'rejected',
  in_process: 'in_process',
  pending: 'pending',
  cancelled: 'cancelled',
  refunded: 'cancelled',
};

type CardFormData = {
  token: string;
  issuer_id: string;
  payment_method_id: string;
  installments: number;
  payer: {
    email?: string;
    identification?: { type: string; number: string };
  };
};

export async function POST(req: NextRequest) {
  try {
    const { customer, items, couponCode, formData } = (await req.json()) as {
      customer: {
        name: string;
        email: string;
        phone?: string;
        address: string;
        province: string;
        postalCode: string;
        reference: string;
      };
      items: CartItemInput[];
      couponCode?: string;
      formData: CardFormData;
    };

    if (!customer?.name || !customer?.email || !customer?.address || !customer?.province || !customer?.postalCode || !customer?.reference) {
      return NextResponse.json({ error: 'Faltan datos del cliente.' }, { status: 400 });
    }
    if (!formData?.token) {
      return NextResponse.json({ error: 'Faltan datos de la tarjeta.' }, { status: 400 });
    }

    const resolved = await resolveOrder(items, couponCode);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    const { orderItems, discountAmount, couponCode: appliedCoupon, totalAmount } = resolved.order;

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone || null,
        shipping_address: customer.address,
        province: customer.province,
        postal_code: customer.postalCode,
        address_reference: customer.reference,
        total_amount: totalAmount,
        coupon_code: appliedCoupon,
        discount_amount: discountAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('orders insert error', orderError);
      return NextResponse.json({ error: `No pudimos crear el pedido: ${orderError?.message}` }, { status: 500 });
    }

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems.map(i => ({ ...i, order_id: order.id })));

    if (itemsError) {
      console.error('order_items insert error', itemsError);
      return NextResponse.json({ error: `No pudimos guardar los items: ${itemsError.message}` }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const notificationUrl = siteUrl && !siteUrl.includes('localhost')
      ? `${siteUrl}/api/webhooks/mercadopago`
      : undefined;

    const payment = await mpPayment.create({
      body: {
        transaction_amount: totalAmount,
        token: formData.token,
        description: 'Compra en Marli Libros',
        installments: formData.installments,
        payment_method_id: formData.payment_method_id,
        issuer_id: formData.issuer_id ? Number(formData.issuer_id) : undefined,
        payer: {
          email: formData.payer?.email || customer.email,
          identification: formData.payer?.identification,
        },
        external_reference: order.id,
        ...(notificationUrl && { notification_url: notificationUrl }),
      },
    });

    const status = STATUS_MAP[payment.status ?? ''] ?? 'pending';

    await supabaseAdmin
      .from('orders')
      .update({
        status,
        mp_payment_id: payment.id ? String(payment.id) : null,
        mp_status_detail: payment.status_detail ?? null,
      })
      .eq('id', order.id);

    if (status === 'approved') {
      await finalizeApprovedOrder(order.id);
    }

    return NextResponse.json({ status, status_detail: payment.status_detail, order_id: order.id });
  } catch (err) {
    console.error('process-payment error', err);
    const message =
      err instanceof Error
        ? err.message
        : typeof (err as { message?: string })?.message === 'string'
          ? (err as { message: string }).message
          : JSON.stringify(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
