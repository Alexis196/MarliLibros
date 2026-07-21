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
        deliveryMethod?: 'shipping' | 'pickup';
      };
      items: CartItemInput[];
      couponCode?: string;
    };

    const isPickup = customer?.deliveryMethod === 'pickup';

    if (!customer?.name || !customer?.email || (!isPickup && (!customer?.address || !customer?.city || !customer?.province || !customer?.postalCode || !customer?.reference))) {
      return NextResponse.json({ error: 'Faltan datos del cliente.' }, { status: 400 });
    }

    const resolved = await resolveOrder(items, couponCode, isPickup ? 'pickup' : 'shipping');
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    const { orderItems, subtotal, discountAmount, couponCode: appliedCoupon, shippingCost, totalAmount } = resolved.order;

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone || null,
        shipping_address: isPickup ? 'Retiro en persona' : customer.address,
        city: isPickup ? null : customer.city,
        province: isPickup ? null : customer.province,
        postal_code: isPickup ? null : customer.postalCode,
        address_reference: isPickup ? null : customer.reference,
        delivery_method: isPickup ? 'pickup' : 'shipping',
        shipping_cost: shippingCost,
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

    const bookTotal = Math.round((subtotal - discountAmount) * 100) / 100;
    const preferenceItems = buildDiscountedPreferenceItems(orderItems, subtotal, bookTotal).map(i => ({
      ...i,
      currency_id: 'ARS',
    }));
    if (shippingCost > 0) {
      preferenceItems.push({ id: 'shipping', title: 'Envío', quantity: 1, unit_price: shippingCost, currency_id: 'ARS' });
    }

    const preference = await mpPreference.create({
      body: {
        items: preferenceItems,
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
