import { supabaseAdmin } from './supabase-admin';
import { validateCoupon } from './coupons';

export type CartItemInput = { bookId: string; quantity: number };

export type OrderLine = {
  book_id: string;
  title: string;
  author_name: string;
  price: number;
  quantity: number;
};

export type ResolvedOrder = {
  orderItems: OrderLine[];
  subtotal: number;
  discountAmount: number;
  couponCode: string | null;
  totalAmount: number;
};

export type ResolveOrderResult = { ok: true; order: ResolvedOrder } | { ok: false; error: string };

// Nunca confiamos en precios ni descuentos calculados por el cliente: todo se vuelve a
// resolver acá contra Supabase (precios reales) y el cupón (reglas reales).
export async function resolveOrder(items: CartItemInput[], couponCode?: string): Promise<ResolveOrderResult> {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: 'El carrito está vacío.' };
  }

  const bookIds = items.map(i => i.bookId);
  const { data: books, error: booksError } = await supabaseAdmin
    .from('books')
    .select('id, title, author_name, price')
    .in('id', bookIds);

  if (booksError || !books || books.length === 0) {
    return { ok: false, error: 'No pudimos validar los libros del carrito.' };
  }

  let orderItems: OrderLine[];
  try {
    orderItems = items.map(i => {
      const book = books.find(b => b.id === i.bookId);
      if (!book) throw new Error(`Libro no encontrado: ${i.bookId}`);
      return {
        book_id: book.id as string,
        title: book.title as string,
        author_name: book.author_name as string,
        price: Number(book.price),
        quantity: i.quantity,
      };
    });
  } catch {
    return { ok: false, error: 'Uno de los libros del carrito ya no está disponible.' };
  }

  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  let discountAmount = 0;
  let resolvedCouponCode: string | null = null;

  if (couponCode) {
    const result = await validateCoupon(couponCode, subtotal);
    if (!result.valid) return { ok: false, error: result.message };
    discountAmount = result.discountAmount;
    resolvedCouponCode = result.code;
  }

  return {
    ok: true,
    order: {
      orderItems,
      subtotal,
      discountAmount,
      couponCode: resolvedCouponCode,
      totalAmount: Math.round((subtotal - discountAmount) * 100) / 100,
    },
  };
}

// Escala el unit_price de cada línea para que la suma coincida con el total ya
// descontado (Mercado Pago Preference no tiene un campo de "descuento", solo suma items).
export function buildDiscountedPreferenceItems(orderItems: OrderLine[], subtotal: number, totalAmount: number) {
  if (subtotal === 0 || discountIsNegligible(subtotal, totalAmount)) {
    return orderItems.map(i => ({ id: i.book_id, title: i.title, quantity: i.quantity, unit_price: i.price }));
  }

  const ratio = totalAmount / subtotal;
  const scaled = orderItems.map(i => ({
    id: i.book_id,
    title: i.title,
    quantity: i.quantity,
    unit_price: Math.round(i.price * ratio * 100) / 100,
  }));

  // Corrige el redondeo acumulado en el último item para que la suma sea exacta.
  const scaledTotal = scaled.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const diff = Math.round((totalAmount - scaledTotal) * 100) / 100;
  if (diff !== 0) {
    const last = scaled[scaled.length - 1];
    last.unit_price = Math.round((last.unit_price + diff / last.quantity) * 100) / 100;
  }

  return scaled;
}

function discountIsNegligible(subtotal: number, totalAmount: number) {
  return Math.abs(subtotal - totalAmount) < 0.01;
}
