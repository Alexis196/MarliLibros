// Precio efectivo de un libro: si tiene precio promocional válido (menor al precio
// de lista), es el que se muestra y se cobra. Usado por la tienda (cliente) y por
// resolveOrder (server) para que nunca difieran.
export type Priceable = { price: number; promotional_price?: number | null };

export function effectivePrice(book: Priceable): number {
  const promo = book.promotional_price;
  if (typeof promo === 'number' && promo > 0 && promo < book.price) return promo;
  return book.price;
}

export function hasPromo(book: Priceable): boolean {
  return effectivePrice(book) < book.price;
}
