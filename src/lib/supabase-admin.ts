import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-only: nunca importar este archivo desde un componente de cliente.
export const supabaseAdmin = createClient(url, serviceRoleKey);
