import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { AuthorInput } from '../route';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const body = (await req.json()) as Partial<AuthorInput>;
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio.' }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name.trim();
    if (body.nationality !== undefined) update.nationality = body.nationality || null;
    if (body.bio !== undefined) update.bio = body.bio || null;
    if (body.photo_url !== undefined) update.photo_url = body.photo_url || null;
    if (body.featured !== undefined) update.featured = body.featured;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nada para actualizar.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('authors')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      if (error?.code === '23505') {
        return NextResponse.json({ error: 'Ya existe un autor con ese nombre.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'No pudimos actualizar el autor.' }, { status: 500 });
    }

    return NextResponse.json({ author: data });
  } catch (err) {
    console.error('admin update author error', err);
    return NextResponse.json({ error: 'Ocurrió un error al actualizar el autor.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error } = await supabaseAdmin.from('authors').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: 'No pudimos eliminar el autor.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
