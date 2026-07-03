import { NextRequest, NextResponse } from 'next/server';
import { subscribeToNewsletter, getSubscriberCount } from '@/lib/newsletter';

export async function GET() {
  const count = await getSubscriberCount();
  return NextResponse.json({ count });
}

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };
    if (!email) {
      return NextResponse.json({ success: false, message: 'Falta el email.' }, { status: 400 });
    }

    const result = await subscribeToNewsletter(email);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    console.error('newsletter subscribe error', err);
    return NextResponse.json({ success: false, message: 'No pudimos procesar la suscripción.' }, { status: 500 });
  }
}
