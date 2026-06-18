'use client';

import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
}

export function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, removeItem, updateQuantity, totalPrice } = useCart();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className={`fixed inset-0 bg-black/30 z-[100] transition-opacity duration-300 ${
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#FCFBF8] z-[101] shadow-2xl flex flex-col transition-transform duration-300 ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <h2 className="text-base font-bold" style={{ color: '#345457', fontFamily: 'var(--font-playfair)' }}>
            Tu carrito
          </h2>
          <button onClick={closeDrawer} aria-label="Cerrar carrito" className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <p className="text-3xl mb-3">🛒</p>
            <p className="text-gray-500 text-sm font-medium mb-1">Tu carrito está vacío</p>
            <p className="text-gray-400 text-[12px]">Agregá algún libro para empezar.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              {items.map((item, i) => (
                <div key={item.bookId} className={`flex items-center gap-3 py-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                  <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                    {item.cover_url ? (
                      <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" style={{ background: 'linear-gradient(145deg, #345457, #587F82)' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-gray-800 leading-tight line-clamp-2">{item.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{item.author_name}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.bookId, item.quantity - 1)}
                          className="w-5 h-5 rounded-full border border-gray-200 text-gray-500 text-xs hover:border-[#345457] hover:text-[#345457] transition-colors duration-300"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-[12px] text-gray-700">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.bookId, item.quantity + 1)}
                          className="w-5 h-5 rounded-full border border-gray-200 text-gray-500 text-xs hover:border-[#345457] hover:text-[#345457] transition-colors duration-300"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[12px] font-bold" style={{ color: '#345457' }}>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.bookId)}
                    aria-label="Quitar del carrito"
                    className="text-gray-300 hover:text-red-400 transition-colors duration-300 text-sm shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="px-5 py-5 border-t border-gray-100">
              <div className="flex items-center justify-between text-base font-bold mb-4" style={{ color: '#1E3134' }}>
                <span>Total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <Link
                href="/carrito"
                onClick={closeDrawer}
                className="block text-center px-5 py-3 rounded-xl text-sm font-semibold mb-2 transition-colors duration-300 border"
                style={{ color: '#345457', borderColor: '#345457' }}
              >
                Ver carrito
              </Link>
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="block text-center px-5 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#345457' }}
              >
                Finalizar compra
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
