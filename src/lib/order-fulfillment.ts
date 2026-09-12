import { supabaseAdmin } from './supabase-admin';
import { sendOrderConfirmationEmail } from './resend';
import { registerCouponUsage } from './coupons';

// Idempotente: si el pedido ya tiene email_sent=true (por una notificación duplicada
// del webhook, o porque ya se procesó sincrónicamente), no vuelve a enviar, no vuelve
// a contar el cupón ni a descontar stock.
export async function finalizeApprovedOrder(orderId: string) {
  // order e items solo dependen de orderId (no uno del otro), así que se piden en
  // paralelo en vez de esperar el pedido para recién ahí pedir sus items.
  const [{ data: order }, { data: items }] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('id, status, email_sent, customer_name, customer_email, shipping_address, city, province, postal_code, address_reference, delivery_method, total_amount, coupon_code, discount_amount, shipping_cost')
      .eq('id', orderId)
      .single(),
    supabaseAdmin
      .from('order_items')
      .select('title, author_name, price, quantity, book_id')
      .eq('order_id', orderId),
  ]);

  if (!order || order.status !== 'approved' || order.email_sent) return;

  const insufficientTitles = await decrementStock(items ?? []);

  // Los pedidos en efectivo no piden email: no hay a quién mandarle la confirmación.
  if (order.customer_email) {
    try {
      await sendOrderConfirmationEmail(order, items ?? []);
    } catch (err) {
      console.error('sendOrderConfirmationEmail failed for order', orderId, err);
    }
  }
  await supabaseAdmin
    .from('orders')
    .update({
      email_sent: true,
      // Queda visible en el panel de admin si algún libro no tenía stock suficiente
      // en el momento de aprobar (se vendió de más) — null si estuvo todo bien.
      stock_warning: insufficientTitles.length > 0 ? `Sin stock suficiente: ${insufficientTitles.join(', ')}` : null,
    })
    .eq('id', orderId);

  if (order.coupon_code) {
    await registerCouponUsage(order.coupon_code);
  }
}

// Descuenta el stock vendido con una función atómica en la base (evita la condición
// de carrera de leer-restar-guardar en JS cuando dos pedidos del mismo libro se
// aprueban casi al mismo tiempo). Solo afecta libros con control de stock (stock no
// null). Devuelve los títulos que no tenían stock suficiente, si los hay.
async function decrementStock(items: { book_id?: string | null; quantity: number; title: string }[]): Promise<string[]> {
  const withBook = items.filter(i => i.book_id);
  if (withBook.length === 0) return [];

  const insufficientTitles: string[] = [];

  for (const item of withBook) {
    const { data, error } = await supabaseAdmin.rpc('decrement_book_stock', {
      p_book_id: item.book_id,
      p_quantity: item.quantity,
    });
    if (error) {
      console.error('No se pudo descontar stock del libro', item.book_id, error);
      continue;
    }
    if (data?.[0]?.was_sufficient === false) {
      insufficientTitles.push(item.title);
    }
  }

  return insufficientTitles;
}
