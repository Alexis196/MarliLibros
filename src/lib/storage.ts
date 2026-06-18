import { supabaseAdmin } from './supabase-admin';

export const BOOK_COVERS_BUCKET = 'book-covers';

let bucketEnsured = false;

// Los buckets de Storage no se crean por SQL — se gestionan vía la Storage API.
// Memoizado en el proceso para no pegarle a Supabase en cada upload.
export async function ensureBookCoversBucket() {
  if (bucketEnsured) return;

  const { data: bucket } = await supabaseAdmin.storage.getBucket(BOOK_COVERS_BUCKET);
  if (!bucket) {
    await supabaseAdmin.storage.createBucket(BOOK_COVERS_BUCKET, { public: true });
  }
  bucketEnsured = true;
}
