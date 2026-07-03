import { supabaseAdmin } from './supabase-admin';

export const BOOK_COVERS_BUCKET = 'book-covers';
export const RECEIPTS_BUCKET    = 'receipts';

let bookCoversBucketEnsured = false;
let receiptsBucketEnsured   = false;

export async function ensureBookCoversBucket() {
  if (bookCoversBucketEnsured) return;
  const { data: bucket } = await supabaseAdmin.storage.getBucket(BOOK_COVERS_BUCKET);
  if (!bucket) await supabaseAdmin.storage.createBucket(BOOK_COVERS_BUCKET, { public: true });
  bookCoversBucketEnsured = true;
}

export async function ensureReceiptsBucket() {
  if (receiptsBucketEnsured) return;
  const { data: bucket } = await supabaseAdmin.storage.getBucket(RECEIPTS_BUCKET);
  if (!bucket) await supabaseAdmin.storage.createBucket(RECEIPTS_BUCKET, { public: true });
  receiptsBucketEnsured = true;
}
