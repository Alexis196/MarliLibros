import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getTopSellers } from '@/lib/admin-stats';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const from = req.nextUrl.searchParams.get('from');
  const to = req.nextUrl.searchParams.get('to');
  if (!from || !to) {
    return NextResponse.json({ error: 'Faltan los parámetros from/to.' }, { status: 400 });
  }

  const data = await getTopSellers(from, to);
  return NextResponse.json(data);
}
