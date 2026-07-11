import { supabaseAdmin } from './supabase-admin';
import { sendOrderConfirmationEmail } from './resend';
import { registerCouponUsage } from './coupons';

// Idempotente: si el pedido ya tiene email_sent=true (por una notificación duplicada
// del webhook, o porque ya se procesó sincrónicamente), no vuelve a enviar, no vuelve
// a contar el cupón ni a descontar stock.
export async function finalizeApprovedOrder(orderId: string) {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (!order || order.status !== 'approved' || order.email_sent) return;

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('title, author_name, price, quantity, book_id')
    .eq('order_id', orderId);

  await decrementStock(items ?? []);

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

// Descuenta el stock vendido. Solo afecta libros con control de stock (stock no null).
async function decrementStock(items: { book_id?: string | null; quantity: number }[]) {
  const withBook = items.filter(i => i.book_id);
  if (withBook.length === 0) return;

  const { data: books } = await supabaseAdmin
    .from('books')
    .select('id, stock')
    .in('id', withBook.map(i => i.book_id as string));

  for (const book of books ?? []) {
    if (typeof book.stock !== 'number') continue;
    const sold = withBook.filter(i => i.book_id === book.id).reduce((s, i) => s + i.quantity, 0);
    const { error } = await supabaseAdmin
      .from('books')
      .update({ stock: Math.max(0, book.stock - sold) })
      .eq('id', book.id);
    if (error) console.error('No se pudo descontar stock del libro', book.id, error);
  }
}
