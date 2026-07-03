import { supabaseAdmin } from './supabase-admin';
import { sendOrderConfirmationEmail } from './resend';
import { registerCouponUsage } from './coupons';

// Idempotente: si el pedido ya tiene email_sent=true (por una notificación duplicada
// del webhook, o porque ya se procesó sincrónicamente), no vuelve a enviar ni a contar el cupón.
export async function finalizeApprovedOrder(orderId: string) {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (!order || order.status !== 'approved' || order.email_sent) return;

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('title, author_name, price, quantity')
    .eq('order_id', orderId);

  try {
    await sendOrderConfirmationEmail(order, items ?? []);
  } catch (err) {
    console.error('sendOrderConfirmationEmail failed for order', orderId, err);
  }
  await supabaseAdmin.from('orders').update({ email_sent: true }).eq('id', orderId);

  if (order.coupon_code) {
    await registerCouponUsage(order.coupon_code);
  }
}
