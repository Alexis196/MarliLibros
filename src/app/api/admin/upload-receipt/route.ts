import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { RECEIPTS_BUCKET, ensureReceiptsBucket } from '@/lib/storage';

const MAX_SIZE     = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Solo se aceptan JPG, PNG, WebP o PDF.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'El archivo no puede superar los 10 MB.' }, { status: 400 });
    }

    await ensureReceiptsBucket();

    const ext  = file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1].replace('jpeg', 'jpg');
    const path = `${randomUUID()}.${ext}`;
    const buf  = Buffer.from(await file.arrayBuffer());

    const { error } = await supabaseAdmin.storage
      .from(RECEIPTS_BUCKET)
      .upload(path, buf, { contentType: file.type });

    if (error) {
      console.error('receipt upload error', error);
      return NextResponse.json({ error: 'No pudimos subir el comprobante.' }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage.from(RECEIPTS_BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error('receipt upload error', err);
    return NextResponse.json({ error: 'Ocurrió un error al subir el comprobante.' }, { status: 500 });
  }
}
