import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ProductForm } from '@/components/admin/ProductForm';

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: book } = await supabaseAdmin.from('books').select('*').eq('id', id).single();
  if (!book) notFound();
  return <ProductForm initialBook={book} />;
}
