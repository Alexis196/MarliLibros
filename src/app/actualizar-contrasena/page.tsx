'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]';

export default function ActualizarContrasenaPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    // El link del email ya dejó una sesión de recuperación activa al llegar a esta página.
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError('No pudimos actualizar la contraseña. El link puede haber vencido — pedí uno nuevo.');
      setSubmitting(false);
      return;
    }

    setDone(true);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: '#FCFBF8' }}>
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-white p-6 sm:p-7" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
          <h1 className="text-lg font-bold mb-1" style={{ color: '#345457', fontFamily: 'var(--font-playfair)' }}>
            Nueva contraseña
          </h1>

          {done ? (
            <div>
              <p className="text-sm text-gray-500 mt-4 mb-6">Tu contraseña se actualizó correctamente.</p>
              <Link
                href="/admin"
                className="inline-flex px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#345457' }}
              >
                Ir al panel
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-[12px] text-gray-400 mb-6">Elegí una nueva contraseña para tu cuenta.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Nueva contraseña</label>
                  <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Confirmar contraseña</label>
                  <input
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 px-5 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ backgroundColor: '#345457' }}
              >
                {submitting ? 'Guardando…' : 'Guardar nueva contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
