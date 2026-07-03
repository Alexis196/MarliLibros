import { supabaseAdmin } from './supabase-admin';

export type ReviewInput = {
  bookId: string;
  reviewerName: string;
  rating: number;
  comment?: string;
};

export type SubmitReviewResult = { success: true } | { success: false; message: string };

export async function submitReview(input: ReviewInput): Promise<SubmitReviewResult> {
  const reviewerName = input.reviewerName.trim();
  const comment = input.comment?.trim();

  if (!input.bookId) return { success: false, message: 'Falta el libro.' };
  if (!reviewerName) return { success: false, message: 'Ingresá tu nombre.' };
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { success: false, message: 'La calificación debe ser de 1 a 5.' };
  }

  const { error } = await supabaseAdmin.from('reviews').insert({
    book_id: input.bookId,
    reviewer_name: reviewerName,
    rating: input.rating,
    comment: comment || null,
  });

  if (error) {
    console.error('submitReview error', error);
    return { success: false, message: 'No pudimos guardar tu reseña. Probá de nuevo.' };
  }

  return { success: true };
}
