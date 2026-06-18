import { NextRequest, NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/coupons';

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = (await req.json()) as { code?: string; subtotal?: number };

    if (!code || typeof subtotal !== 'number') {
      return NextResponse.json({ valid: false, message: 'Faltan datos.' }, { status: 400 });
    }

    const result = await validateCoupon(code, subtotal);
    return NextResponse.json(result);
  } catch (err) {
    console.error('coupon validate error', err);
    return NextResponse.json({ valid: false, message: 'No pudimos validar el cupón.' }, { status: 500 });
  }
}
