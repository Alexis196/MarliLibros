import { Resend } from 'resend';

// Lazy: el constructor de Resend tira si la key falta, y a nivel de módulo eso
// rompe el build entero (Next evalúa el módulo al recolectar page data).
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!);
  return _resend;
}

type OrderItem = {
  title: string;
  author_name: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  address_reference?: string | null;
  delivery_method?: string | null;
  total_amount: number;
  coupon_code?: string | null;
  discount_amount?: number;
  shipping_cost?: number;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
}

export async function sendOrderConfirmationEmail(order: Order, items: OrderItem[]) {
  const rows = items
    .map(
      item => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #E5E9E8;">
            <p style="margin:0;font-weight:600;color:#1E3134;">${item.title}</p>
            <p style="margin:2px 0 0;font-size:13px;color:#7A8C8A;">${item.author_name} · x${item.quantity}</p>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #E5E9E8;text-align:right;color:#345457;font-weight:600;">
            ${formatPrice(item.price * item.quantity)}
          </td>
        </tr>`
    )
    .join('');

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = order.discount_amount ?? 0;

  const isPickup = order.delivery_method === 'pickup';
  const provinceLine = [order.city, order.province, order.postal_code && `CP ${order.postal_code}`].filter(Boolean).join(', ');
  const addressLines = isPickup
    ? 'Retirás tu pedido en el local. Te contactamos para coordinar día y horario.'
    : [
        order.shipping_address,
        provinceLine,
        order.address_reference ? `Referencia: ${order.address_reference}` : '',
      ]
        .filter(Boolean)
        .join('<br/>');

  const discountRow = discountAmount > 0
    ? `<tr>
        <td style="font-size:13px;color:#7A8C8A;padding-top:8px;">Subtotal</td>
        <td style="text-align:right;font-size:13px;color:#7A8C8A;padding-top:8px;">${formatPrice(subtotal)}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#C8A86B;padding-top:4px;">Cupón ${order.coupon_code ?? ''}</td>
        <td style="text-align:right;font-size:13px;color:#C8A86B;padding-top:4px;">−${formatPrice(discountAmount)}</td>
      </tr>`
    : '';

  const shippingCost = order.shipping_cost ?? 0;
  const shippingRow = `<tr>
      <td style="font-size:13px;color:#7A8C8A;padding-top:4px;">Envío</td>
      <td style="text-align:right;font-size:13px;color:#7A8C8A;padding-top:4px;">${shippingCost > 0 ? formatPrice(shippingCost) : 'Gratis'}</td>
    </tr>`;

  const html = `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#FCFBF8;">
      <div style="background:#345457;padding:28px 32px;text-align:center;">
        <h1 style="color:#fff;font-size:20px;margin:0;letter-spacing:0.5px;">MARLI LIBROS</h1>
      </div>
      <div style="padding:32px;">
        <p style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#C8A86B;margin:0 0 8px;">✦ Compra confirmada</p>
        <h2 style="color:#1E3134;font-size:22px;margin:0 0 16px;">¡Gracias por tu compra, ${order.customer_name}!</h2>
        <p style="color:#5b6b69;font-size:14px;line-height:1.6;margin:0 0 24px;">
          Recibimos tu pago y ya estamos preparando tu pedido. Te dejamos el resumen:
        </p>
        <table style="width:100%;border-collapse:collapse;">${rows}</table>
        <div style="padding-top:8px;">
          <table style="width:100%;">
            ${discountRow}
            ${shippingRow}
            <tr style="font-weight:700;color:#345457;">
              <td style="font-size:15px;padding-top:12px;">Total</td>
              <td style="text-align:right;font-size:15px;padding-top:12px;">${formatPrice(order.total_amount)}</td>
            </tr>
          </table>
        </div>
        <p style="color:#5b6b69;font-size:13px;line-height:1.6;margin:24px 0 0;">
          <strong style="color:#1E3134;">${isPickup ? 'Retiro' : 'Envío a'}:</strong><br/>${addressLines}
        </p>
        <p style="color:#9aa6a4;font-size:11px;margin:24px 0 0;">N° de pedido: ${order.id}</p>
      </div>
    </div>
  `;

  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY no configurada: no se envió el email de confirmación del pedido', order.id);
    return;
  }

  await getResend().emails.send({
    from: process.env.EMAIL_FROM!,
    to: order.customer_email,
    subject: 'Confirmación de tu compra — Marli Libros',
    html,
  });
}
