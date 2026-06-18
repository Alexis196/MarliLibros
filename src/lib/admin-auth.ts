import { NextResponse } from 'next/server';
import { getAdminUser } from './supabase-server';

type RequireAdminResult =
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof getAdminUser>>> }
  | { ok: false; response: NextResponse };

// El proxy ya bloquea /api/admin/*, pero los Route Handlers no deben confiar
// solo en eso (recomendación explícita de los docs de Next sobre Proxy):
// cada uno vuelve a verificar el rol de admin acá.
export async function requireAdmin(): Promise<RequireAdminResult> {
  const user = await getAdminUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'No autorizado.' }, { status: 401 }) };
  }
  return { ok: true, user };
}
