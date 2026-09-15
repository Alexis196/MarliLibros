import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { BOOK_COVERS_BUCKET, ensureBookCoversBucket } from '@/lib/storage';
import { convertImageBufferToWebp } from '@/lib/image-server';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB (antes de convertir)

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No se recibió ninguna imagen.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'La imagen no puede superar los 10MB.' }, { status: 400 });
    }

    await ensureBookCoversBucket();

    const path = `${randomUUID()}.webp`;
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    let buffer: Buffer;
    try {
      buffer = await convertImageBufferToWebp(inputBuffer, { maxWidth: 1000, quality: 82 });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'No pudimos procesar esa imagen.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.storage
      .from(BOOK_COVERS_BUCKET)
      .upload(path, buffer, { contentType: 'image/webp' });

    if (error) {
      console.error('storage upload error', error);
      return NextResponse.json({ error: 'No pudimos subir la imagen.' }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage.from(BOOK_COVERS_BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error('admin upload error', err);
    return NextResponse.json({ error: 'Ocurrió un error al subir la imagen.' }, { status: 500 });
  }
}
