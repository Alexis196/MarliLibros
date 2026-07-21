import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { AuthorForm } from '@/components/admin/AuthorForm';

export default async function EditarAutorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: author } = await supabaseAdmin.from('authors').select('*').eq('id', id).single();
  if (!author) notFound();
  return <AuthorForm initialAuthor={author} />;
}
