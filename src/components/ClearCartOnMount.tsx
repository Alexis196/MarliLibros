'use client';

import { useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';

export function ClearCartOnMount() {
  const { clear } = useCart();

  useEffect(() => {
    clear();
    // Solo al montar: `clear` cambia de identidad en cada render del provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
