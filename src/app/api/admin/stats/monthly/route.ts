import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getMonthlySummary } from '@/lib/admin-stats';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const yearParam = req.nextUrl.searchParams.get('year');
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();

  const data = await getMonthlySummary(year);
  return NextResponse.json({ data });
}
