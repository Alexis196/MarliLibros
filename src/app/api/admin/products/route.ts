import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sanitizeProductInput, type ProductInput } from '@/lib/product-input';

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;

  // Stats-only mode
  if (sp.get('stats') === '1') {
    const now = new Date().toISOString();
    const [
      { count: total },
      { count: published },
      { count: outOfStock },
      { count: newProducts },
      { count: drafts },
    ] = await Promise.all([
      supabaseAdmin.from('books').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('books').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabaseAdmin.from('books').select('*', { count: 'exact', head: true }).eq('stock', 0),
      supabaseAdmin.from('books').select('*', { count: 'exact', head: true }).gt('new_until', now),
      supabaseAdmin.from('books').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    ]);
    return NextResponse.json({
      total: total ?? 0,
      published: published ?? 0,
      outOfStock: outOfStock ?? 0,
      newProducts: newProducts ?? 0,
      drafts: drafts ?? 0,
    });
  }

  const search      = sp.get('search')?.trim() ?? '';
  const category    = sp.get('category')?.trim() ?? '';
  const stockFilter = sp.get('stock') ?? '';
  const featured    = sp.get('featured');
  const isNew       = sp.get('is_new');
  const status      = sp.get('status') ?? '';
  const validSorts  = ['title', 'price', 'stock', 'created_at', 'updated_at', 'author_name'];
  const sort        = validSorts.includes(sp.get('sort') ?? '') ? (sp.get('sort') as string) : 'created_at';
  const ascending   = sp.get('order') === 'asc';
  const limit       = Math.min(Number(sp.get('limit') ?? '40'), 100);
  const offset      = Number(sp.get('offset') ?? '0');

  let query = supabaseAdmin
    .from('books')
    .select('*', { count: 'exact' })
    .order(sort, { ascending })
    .range(offset, offset + limit - 1);

  if (search) {
    // Comas y paréntesis rompen la sintaxis del filtro or() de PostgREST
    const safe = search.replace(/[,()]/g, ' ').trim();
    if (safe) {
      const parts = [
        `title.ilike.%${safe}%`,
        `author_name.ilike.%${safe}%`,
        `isbn.ilike.%${safe}%`,
        `publisher.ilike.%${safe}%`,
        `sku.ilike.%${safe}%`,
        `category.ilike.%${safe}%`,
      ];
      query = query.or(parts.join(','));
    }
  }

  if (category) query = query.eq('category', category);

  if (stockFilter === 'out')      query = query.eq('stock', 0);
  else if (stockFilter === 'low') query = query.gte('stock', 1).lte('stock', 5);
  else if (stockFilter === 'in')  query = query.gt('stock', 5);
  else if (stockFilter === 'untracked') query = query.is('stock', null);

  if (featured === 'true')  query = query.eq('featured', true);
  if (isNew === 'true')     query = query.gt('new_until', new Date().toISOString());
  if (status)               query = query.eq('status', status);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: 'No pudimos cargar los productos.' }, { status: 500 });
  }
  return NextResponse.json({ books: data ?? [], total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as ProductInput;

    if (!body.title || !body.author_name || !body.category || typeof body.price !== 'number') {
      return NextResponse.json({ error: 'Faltan datos obligatorios.' }, { status: 400 });
    }

    const sanitized = sanitizeProductInput(body);
    if ('error' in sanitized) {
      return NextResponse.json({ error: sanitized.error }, { status: 400 });
    }
    const { isNew, ...rest } = sanitized.value;

    const { data, error } = await supabaseAdmin
      .from('books')
      .insert({
        ...rest,
        new_until: isNew ? new Date(Date.now() + NEW_WINDOW_MS).toISOString() : null,
        status: rest.status ?? 'published',
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
