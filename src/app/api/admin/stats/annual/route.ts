import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAnnualSummary } from '@/lib/admin-stats';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const yearsParam = req.nextUrl.searchParams.get('years');
  const years = yearsParam ? Number(yearsParam) : 5;

  const data = await getAnnualSummary(years);
  return NextResponse.json({ data });
}
