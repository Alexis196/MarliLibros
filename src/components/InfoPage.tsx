import Link from 'next/link';
import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function InfoPage({ title, draft, children }: { title: string; draft?: boolean; children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main style={{ background: '#F7F6F2', minHeight: '70vh' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-2 mb-6 text-sm">
            <Link href="/" className="text-gray-400 hover:text-[#345457] transition-colors duration-300">Inicio</Link>
            <span className="text-gray-300">/</span>
            <span className="font-medium text-gray-500">{title}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-6" style={{ color: '#1E3134', fontFamily: 'var(--font-playfair)' }}>
            {title}
          </h1>

          {draft && (
            <div
              className="mb-8 px-4 py-3 rounded-xl text-[13px]"
              style={{ backgroundColor: '#FBF3D9', color: '#7A5B00', border: '1px solid #EAD7A1' }}
            >
              ⚠ Borrador generado automáticamente con contenido estándar. Revisar con un asesor legal antes de publicar.
            </div>
          )}

          <div className="text-gray-600 text-[14px] leading-relaxed space-y-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-1 [&_h2]:text-[#345457]">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
