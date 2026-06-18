import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

type ProductInput = {
  title?: string;
  author_name?: string;
  category?: string;
  price?: number;
  description?: string;
  cover_url?: string;
  pages?: number;
  year?: number;
  rating?: number;
  isNew?: boolean;
};

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

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
