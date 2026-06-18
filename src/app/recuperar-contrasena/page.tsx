'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-contrasena`,
    });

    // Mismo mensaje exista o no la cuenta, para no revelar qué emails están registrados.
    setSent(true);
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: '#FCFBF8' }}>
      <div className="w-full max-w-sm">
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-[13px] font-medium text-gray-400 hover:text-[#345457] transition-colors duration-300 mb-6"
        >
          ← Volver al login
        </Link>

        <div className="rounded-2xl bg-white p-6 sm:p-7" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
          <h1 className="text-lg font-bold mb-1" style={{ color: '#345457', fontFamily: 'var(--font-playfair)' }}>
            Recuperar contraseña
          </h1>

          {sent ? (
            <p className="text-sm text-gray-500 mt-4">
              Si ese correo tiene una cuenta de administrador, te enviamos instrucciones para crear una nueva contraseña.
            </p>
          ) : (
            <>
              <p className="text-[12px] text-gray-400 mb-6">Te enviamos un link para crear una nueva contraseña.</p>
              <form onSubmit={handleSubmit}>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Email</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-6 px-5 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: '#345457' }}
                >
                  {submitting ? 'Enviando…' : 'Enviar instrucciones'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
