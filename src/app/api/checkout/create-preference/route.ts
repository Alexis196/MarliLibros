import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { mpPreference } from '@/lib/mercadopago';
import { resolveOrder, buildDiscountedPreferenceItems, type CartItemInput } from '@/lib/checkout-helpers';

export async function POST(req: NextRequest) {
  try {
    const { customer, items, couponCode } = (await req.json()) as {
      customer: {
        name: string;
        email: string;
        phone?: string;
        address: string;
        city: string;
        province: string;
        postalCode: string;
        reference: string;
      };
      items: CartItemInput[];
      couponCode?: string;
    };

    if (!customer?.name || !customer?.email || !customer?.address || !customer?.city || !customer?.province || !customer?.postalCode || !customer?.reference) {
      return NextResponse.json({ error: 'Faltan datos del cliente.' }, { status: 400 });
    }

    const resolved = await resolveOrder(items, couponCode);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    const { orderItems, subtotal, discountAmount, couponCode: appliedCoupon, totalAmount } = resolved.order;

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone || null,
        shipping_address: customer.address,
        city: customer.city,
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
      return NextResponse.json({ error: 'No pudimos crear el pedido.' }, { status: 500 });
    }

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems.map(i => ({ ...i, order_id: order.id })));

    if (itemsError) {
      return NextResponse.json({ error: 'No pudimos guardar los items del pedido.' }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const isProd = !!process.env.NEXT_PUBLIC_SITE_URL && !siteUrl.includes('localhost');
    const notificationUrl = isProd ? `${siteUrl}/api/webhooks/mercadopago` : undefined;

    const preference = await mpPreference.create({
      body: {
        items: buildDiscountedPreferenceItems(orderItems, subtotal, totalAmount).map(i => ({
          ...i,
          currency_id: 'ARS',
        })),
        payer: { name: customer.name, email: customer.email },
        back_urls: {
          success: `${siteUrl}/checkout/success?order_id=${order.id}`,
          failure: `${siteUrl}/checkout/failure?order_id=${order.id}`,
          pending: `${siteUrl}/checkout/pending?order_id=${order.id}`,
        },
        ...(isProd && { auto_return: 'approved' }),
        external_reference: order.id,
        ...(notificationUrl && { notification_url: notificationUrl }),
      },
    });

    await supabaseAdmin.from('orders').update({ mp_preference_id: preference.id }).eq('id', order.id);

    return NextResponse.json({ init_point: preference.init_point });
  } catch (err) {
    console.error('create-preference error', err);
    return NextResponse.json({ error: 'Ocurrió un error al iniciar el pago.' }, { status: 500 });
  }
}
