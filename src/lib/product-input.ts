// Validación y saneo del payload de productos del admin (POST y PATCH).
// - Solo deja pasar columnas conocidas (una clave inesperada rompería el UPDATE con un 500 confuso).
// - Los null son válidos: significan "limpiar el campo" (quitar promo, stock sin control, etc.).

export type ProductInput = {
  title?: string;
  author_name?: string;
  category?: string;
  price?: number;
  cost_price?: number | null;
  promotional_price?: number | null;
  description?: string | null;
  cover_url?: string | null;
  pages?: number | null;
  year?: number | null;
  rating?: number | null;
  isNew?: boolean;
  featured?: boolean;
  stock?: number | null;
  isbn?: string | null;
  publisher?: string | null;
  language?: string | null;
  sku?: string | null;
  binding?: string | null;
  edition?: string | null;
  tags?: string[];
  status?: string;
};

const STRING_FIELDS = ['title', 'author_name', 'category', 'description', 'cover_url', 'isbn', 'publisher', 'language', 'sku', 'binding', 'edition'] as const;
const NUMBER_FIELDS = ['price', 'cost_price', 'promotional_price', 'pages', 'year', 'rating', 'stock'] as const;
const BOOL_FIELDS   = ['isNew', 'featured'] as const;
const VALID_STATUSES = ['published', 'draft'];

export function sanitizeProductInput(body: ProductInput): { value: ProductInput } | { error: string } {
  const out: Record<string, unknown> = {};

  for (const k of STRING_FIELDS) {
    if (!(k in body)) continue;
    const v = body[k];
    if (v !== null && typeof v !== 'string') return { error: `Valor inválido en ${k}.` };
    out[k] = v;
  }

  for (const k of NUMBER_FIELDS) {
    if (!(k in body)) continue;
    const v = body[k];
    if (v === null) { out[k] = null; continue; }
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return { error: `Valor inválido en ${k}.` };
    out[k] = v;
  }

  for (const k of BOOL_FIELDS) {
    if (!(k in body)) continue;
    if (typeof body[k] !== 'boolean') return { error: `Valor inválido en ${k}.` };
    out[k] = body[k];
  }

  if ('tags' in body) {
    if (!Array.isArray(body.tags) || body.tags.some(t => typeof t !== 'string')) {
      return { error: 'Valor inválido en tags.' };
    }
    out.tags = body.tags;
  }

  if ('status' in body) {
    if (typeof body.status !== 'string' || !VALID_STATUSES.includes(body.status)) {
      return { error: 'Estado inválido.' };
    }
    out.status = body.status;
  }

  const price = out.price as number | undefined;
  const promo = out.promotional_price as number | null | undefined;
  if (typeof price === 'number' && typeof promo === 'number' && promo >= price) {
    return { error: 'El precio promocional debe ser menor al precio de venta.' };
  }
  if ('stock' in out && out.stock !== null && !Number.isInteger(out.stock)) {
    return { error: 'El stock debe ser un número entero.' };
  }

  return { value: out as ProductInput };
}
