import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente Supabase atado a la sesión de la request actual (vía cookies).
// Usar en Server Components, Route Handlers y Server Actions — nunca compartir
// la instancia entre requests.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Llamado desde un Server Component, que no puede escribir cookies.
          // El refresh de sesión lo termina persistiendo el proxy en la respuesta.
        }
      },
    },
  });
}

// getUser() valida el token contra el servidor de Auth de Supabase (a diferencia
// de getSession(), que solo decodifica la cookie) — es lo que corresponde usar
// para decisiones de autorización.
export async function getAdminUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'admin') return null;
  return user;
}
