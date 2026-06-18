import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// A diferencia de src/lib/supabase.ts, esta instancia guarda la sesión en
// cookies (no solo en memoria/localStorage) para que el server también pueda leerla.
export function createSupabaseBrowserClient() {
  return createBrowserClient(url, key);
}
