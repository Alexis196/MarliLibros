import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export type AuthorInput = {
  name: string;
  nationality?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  featured?: boolean;
};

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const search = req.nextUrl.searchParams.get('search')?.trim() ?? '';

  let query = supabaseAdmin.from('authors').select('*').order('name');
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'No pudimos cargar los autores.' }, { status: 500 });
  }
  return NextResponse.json({ authors: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as AuthorInput;
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('authors')
      .insert({
        name: body.name.trim(),
        nationality: body.nationality || null,
        bio: body.bio || null,
        photo_url: body.photo_url || null,
        featured: body.featured ?? false,
      })
      .select()
      .single();

    if (error || !data) {
      if (error?.code === '23505') {
        return NextResponse.json({ error: 'Ya existe un autor con ese nombre.' }, { status: 400 });
      }
      console.error('admin create author error', error);
      return NextResponse.json({ error: 'No pudimos crear el autor.' }, { status: 500 });
    }

    return NextResponse.json({ author: data });
  } catch (err) {
    console.error('admin create author error', err);
    return NextResponse.json({ error: 'Ocurrió un error al crear el autor.' }, { status: 500 });
  }
}
