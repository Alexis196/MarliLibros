import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseAdmin
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'No pudimos cargar los productos.' }, { status: 500 });
  }
  return NextResponse.json({ books: data ?? [] });
}

type ProductInput = {
  title: string;
  author_name: string;
  category: string;
  price: number;
  description?: string;
  cover_url?: string;
  pages?: number;
  year?: number;
  rating?: number;
  isNew?: boolean;
};

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as ProductInput;

    if (!body.title || !body.author_name || !body.category || typeof body.price !== 'number') {
      return NextResponse.json({ error: 'Faltan datos obligatorios.' }, { status: 400 });
    }

    const { isNew, ...rest } = body;

    const { data, error } = await supabaseAdmin
      .from('books')
      .insert({
        ...rest,
        new_until: isNew ? new Date(Date.now() + NEW_WINDOW_MS).toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ya existe un libro con ese título.' }, { status: 400 });
      }
      console.error('admin create product error', error);
      return NextResponse.json({ error: 'No pudimos crear el producto.' }, { status: 500 });
    }

    return NextResponse.json({ book: data });
  } catch (err) {
    console.error('admin create product error', err);
    return NextResponse.json({ error: 'Ocurrió un error al crear el producto.' }, { status: 500 });
  }
}
