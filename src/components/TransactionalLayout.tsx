'use client';

import Link from 'next/link';

export function TransactionalHeader() {
  return (
    <header className="bg-[#FCFBF8] border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        <Link href="/" className="shrink-0">
          <div
            role="img"
            aria-label="Marli Libros"
            style={{
              height: '48px',
              aspectRatio: '460 / 125',
              backgroundColor: '#345457',
              WebkitMaskImage: 'url(/logo.png)',
              maskImage: 'url(/logo.png)',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'left center',
              maskPosition: 'left center',
            }}
          />
        </Link>
        <Link href="/catalogo" className="text-sm font-medium text-gray-500 hover:text-[#345457] transition-colors duration-300 whitespace-nowrap">
          ← Seguir comprando
        </Link>
      </div>
    </header>
  );
}

export function TransactionalFooter() {
  return (
    <footer style={{ backgroundColor: '#1E3134' }} className="text-white py-6 mt-auto">
      <p className="text-center text-[12px] text-white/35">© 2026 Marli Libros. Todos los derechos reservados.</p>
    </footer>
  );
}
