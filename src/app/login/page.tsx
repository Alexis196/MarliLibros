'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.46c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.86c2.26-2.08 3.6-5.16 3.6-8.66Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.86-3.01c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1C3.24 21.3 7.27 24 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.62H1.27A11.96 11.96 0 0 0 0 12c0 1.93.46 3.76 1.27 5.38l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.27 0 3.24 2.7 1.27 6.62l4 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'oauth') {
      setError('No pudimos iniciar sesión con Google. Probá de nuevo.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError('Email o contraseña incorrectos.');
      setSubmitting(false);
      return;
    }

    window.location.href = '/admin';
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/admin` },
    });
    if (oauthError) {
      setError('No pudimos iniciar sesión con Google. Probá de nuevo.');
      setGoogleLoading(false);
    }
    // Si no hay error, el navegador ya está siendo redirigido a Google.
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: '#FCFBF8' }}>
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-1.5 text-[13px] font-medium text-gray-400 hover:text-[#345457] transition-colors duration-300 mb-6">
          ← Volver al inicio
        </Link>

        <div className="flex justify-center mb-8">
          <div
            role="img"
            aria-label="Marli Libros"
            style={{
              height: '56px',
              aspectRatio: '460 / 125',
              backgroundColor: '#345457',
              WebkitMaskImage: 'url(/logo.png)',
              maskImage: 'url(/logo.png)',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
            }}
          />
        </div>

        <div className="rounded-2xl bg-white p-6 sm:p-7" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
          <h1 className="text-lg font-bold mb-1" style={{ color: '#345457', fontFamily: 'var(--font-playfair)' }}>
            Panel administrador
          </h1>
          <p className="text-[12px] text-gray-400 mb-6">Ingresá con tu cuenta de administrador.</p>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Email</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Contraseña</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]"
                />
                <div className="flex justify-end mt-1.5">
                  <Link href="/recuperar-contrasena" className="text-[12px] font-medium" style={{ color: '#345457' }}>
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 px-5 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#345457' }}
            >
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[11px] text-gray-400">o</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors duration-300 disabled:opacity-60"
          >
            <GoogleIcon />
            {googleLoading ? 'Redirigiendo…' : 'Continuar con Google'}
          </button>
        </div>
      </div>
    </main>
  );
}
