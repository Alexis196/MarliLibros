import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { resolveOrder, type CartItemInput } from '@/lib/checkout-helpers';

export async function POST(req: NextRequest) {
  try {
    const { customer, items, couponCode } = (await req.json()) as {
      customer: { firstName: string; lastName: string; address: string; phone: string };
      items: CartItemInput[];
      couponCode?: string;
    };

    if (!customer?.firstName || !customer?.lastName || !customer?.address || !customer?.phone) {
      return NextResponse.json({ error: 'Faltan datos del cliente.' }, { status: 400 });
    }

    const resolved = await resolveOrder(items, couponCode, 'cash');
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    const { orderItems, discountAmount, couponCode: appliedCoupon, totalAmount } = resolved.order;

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name: `${customer.firstName.trim()} ${customer.lastName.trim()}`.trim(),
        customer_email: null,
        customer_phone: customer.phone,
        shipping_address: customer.address,
        delivery_method: 'cash',
        payment_method: 'cash',
        shipping_cost: 0,
        total_amount: totalAmount,
        coupon_code: appliedCoupon,
        discount_amount: discountAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('cash order insert error', orderError);
      return NextResponse.json({ error: 'No pudimos registrar el pedido.' }, { status: 500 });
    }

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems.map(i => ({ ...i, order_id: order.id })));

    if (itemsError) {
      console.error('cash order_items insert error', itemsError);
      return NextResponse.json({ error: 'No pudimos guardar los items del pedido.' }, { status: 500 });
    }

    return NextResponse.json({ order_id: order.id });
  } catch (err) {
    console.error('cash checkout error', err);
    return NextResponse.json({ error: 'Ocurrió un error al registrar el pedido.' }, { status: 500 });
  }
}
