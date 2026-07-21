import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { AUTHOR_PHOTOS_BUCKET, ensureAuthorPhotosBucket } from '@/lib/storage';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File) || file.type !== 'image/webp') {
      return NextResponse.json({ error: 'La imagen debe estar en formato WebP.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'La imagen no puede superar los 5MB.' }, { status: 400 });
    }

    await ensureAuthorPhotosBucket();

    const path = `${randomUUID()}.webp`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabaseAdmin.storage
      .from(AUTHOR_PHOTOS_BUCKET)
      .upload(path, buffer, { contentType: 'image/webp' });

    if (error) {
      console.error('author photo upload error', error);
      return NextResponse.json({ error: 'No pudimos subir la imagen.' }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage.from(AUTHOR_PHOTOS_BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error('admin upload author photo error', err);
    return NextResponse.json({ error: 'Ocurrió un error al subir la imagen.' }, { status: 500 });
  }
}
