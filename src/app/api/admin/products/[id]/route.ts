import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

type ProductInput = {
  title?: string;
  author_name?: string;
  category?: string;
  price?: number;
  cost_price?: number;
  promotional_price?: number;
  description?: string;
  cover_url?: string;
  pages?: number;
  year?: number;
  rating?: number;
  isNew?: boolean;
  featured?: boolean;
  stock?: number;
  isbn?: string;
  publisher?: string;
  language?: string;
  sku?: string;
  binding?: string;
  edition?: string;
  tags?: string[];
  status?: string;
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const body = (await req.json()) as ProductInput;
    const { isNew, ...rest } = body;

    const update: Record<string, unknown> = { ...rest };
    if (isNew !== undefined) {
      update.new_until = isNew ? new Date(Date.now() + NEW_WINDOW_MS).toISOString() : null;
    }

    const { data, error } = await supabaseAdmin
      .from('books')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      if (error?.code === '23505') {
        return NextResponse.json({ error: 'Ya existe un libro con ese título.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'No pudimos actualizar el producto.' }, { status: 500 });
    }

    return NextResponse.json({ book: data });
  } catch (err) {
    console.error('admin update product error', err);
    return NextResponse.json({ error: 'Ocurrió un error al actualizar el producto.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error } = await supabaseAdmin.from('books').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: 'No pudimos eliminar el producto.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// Duplicate a product
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { data: original, error: fetchError } = await supabaseAdmin
    .from('books')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !original) {
    return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 });
  }

  const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = original as Record<string, unknown>;
  void _id; void _ca; void _ua;

  const { data, error } = await supabaseAdmin
    .from('books')
    .insert({ ...rest, title: `(Copia) ${original.title}`, featured: false, new_until: null, stock: 0 })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'No pudimos duplicar el producto.' }, { status: 500 });
  }

  return NextResponse.json({ book: data });
}
