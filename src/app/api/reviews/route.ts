import { NextRequest, NextResponse } from 'next/server';
import { submitReview } from '@/lib/reviews';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { bookId?: string; reviewerName?: string; rating?: number; comment?: string };

    if (!body.bookId || !body.reviewerName || typeof body.rating !== 'number') {
      return NextResponse.json({ success: false, message: 'Faltan datos.' }, { status: 400 });
    }

    const result = await submitReview({
      bookId: body.bookId,
      reviewerName: body.reviewerName,
      rating: body.rating,
      comment: body.comment,
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    console.error('reviews POST error', err);
    return NextResponse.json({ success: false, message: 'Ocurrió un error inesperado.' }, { status: 500 });
  }
}
