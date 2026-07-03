import { supabaseAdmin } from './supabase-admin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SubscribeResult = { success: true } | { success: false; message: string };

export async function subscribeToNewsletter(rawEmail: string): Promise<SubscribeResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { success: false, message: 'Ingresá un email válido.' };

  const { error } = await supabaseAdmin.from('subscribers').insert({ email });

  if (error) {
    if (error.code === '23505') return { success: true }; // ya estaba suscripto: no es un error para el usuario
    return { success: false, message: 'No pudimos guardar tu suscripción. Probá de nuevo.' };
  }

  return { success: true };
}

export async function getSubscriberCount(): Promise<number> {
  const { count } = await supabaseAdmin.from('subscribers').select('id', { count: 'exact', head: true });
  return count ?? 0;
}
