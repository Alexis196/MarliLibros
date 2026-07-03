'use client';

import { useEffect } from 'react';

export function PrintLabelButton() {
  useEffect(() => {
    window.print();
  }, []);

  return (
    <button
      onClick={() => window.print()}
      className="print:hidden px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      style={{ backgroundColor: '#345457' }}
    >
      Imprimir
    </button>
  );
}
