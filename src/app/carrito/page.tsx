'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { TransactionalHeader, TransactionalFooter } from '@/components/TransactionalLayout';

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
}

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, totalPrice, liveStock, refreshStock } = useCart();
  const hasStockIssue = items.some(i => {
    const stock = liveStock[i.bookId];
    return typeof stock === 'number' && i.quantity > stock;
  });

  useEffect(() => { refreshStock(); }, [refreshStock]);

  return (
    <>
      <TransactionalHeader />
      <main style={{ background: '#F7F6F2', minHeight: '70vh' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <h1 className="text-2xl sm:text-3xl font-bold mb-8" style={{ color: '#345457', fontFamily: 'var(--font-playfair)' }}>
            Tu carrito
          </h1>

          {items.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 sm:p-16 text-center" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
              <p className="text-4xl mb-4">🛒</p>
              <p className="text-gray-500 text-lg font-medium mb-2">Tu carrito está vacío</p>
              <p className="text-sm text-gray-400 mb-6">Explorá el catálogo y encontrá tu próxima historia.</p>
              <Link
                href="/catalogo"
                className="inline-flex px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#345457' }}
              >
                Ver catálogo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
              {/* Lista de items */}
              <div className="lg:col-span-2 rounded-2xl bg-white p-3 sm:p-5" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
                {items.map((item, i) => {
                  const stock = liveStock[item.bookId];
                  const noStock = stock === 0;
                  const atCap = typeof stock === 'number' && item.quantity >= stock;
                  return (
                  <div
                    key={item.bookId}
                    className={`flex items-center gap-4 py-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                  >
                    <div className="w-14 h-20 sm:w-16 sm:h-24 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                      {item.cover_url ? (
                        <img src={item.cover_url} alt={item.title} className={`w-full h-full object-cover ${noStock ? 'opacity-50' : ''}`} />
                      ) : (
                        <div className="w-full h-full" style={{ background: 'linear-gradient(145deg, #345457, #587F82)' }} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] sm:text-sm font-bold text-gray-800 leading-tight line-clamp-2">{item.title}</p>
                      <p className="text-[12px] text-gray-400 mt-0.5">{item.author_name}</p>
                      <p className="text-sm font-bold mt-1.5" style={{ color: '#345457' }}>{formatPrice(item.price)}</p>
                      {noStock ? (
                        <p className="text-[11px] font-semibold mt-1" style={{ color: '#B85C5C' }}>Sin stock — quitalo para continuar</p>
                      ) : typeof stock === 'number' && stock < item.quantity ? (
                        <p className="text-[11px] font-semibold mt-1" style={{ color: '#B85C5C' }}>Solo quedan {stock} unidades</p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.bookId, item.quantity - 1)}
                        className="w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:border-[#345457] hover:text-[#345457] transition-colors duration-300"
                        aria-label="Restar cantidad"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-medium text-gray-700">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.bookId, item.quantity + 1)}
                        disabled={atCap}
                        className="w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:border-[#345457] hover:text-[#345457] transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-500"
                        aria-label="Sumar cantidad"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.bookId)}
                      className="text-gray-300 hover:text-red-400 transition-colors duration-300 text-sm shrink-0"
                      aria-label="Quitar del carrito"
                    >
                      ✕
                    </button>
                  </div>
                  );
                })}
              </div>

              {/* Resumen */}
              <div className="rounded-2xl bg-white p-5 sm:p-6" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
                <h2 className="text-base font-bold mb-4" style={{ color: '#345457' }}>Resumen</h2>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Envío</span>
                  <span>A calcular</span>
                </div>
                <div className="flex items-center justify-between text-base font-bold pt-4 border-t border-gray-100 mb-6" style={{ color: '#1E3134' }}>
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                {hasStockIssue && (
                  <p className="text-[12px] font-medium text-center mb-3" style={{ color: '#B85C5C' }}>
                    Ajustá las cantidades marcadas para poder continuar.
                  </p>
                )}
                <Link
                  href="/checkout"
                  onClick={e => { if (hasStockIssue) e.preventDefault(); }}
                  aria-disabled={hasStockIssue}
                  className={`block text-center px-5 py-3 rounded-xl text-sm font-semibold text-white transition-opacity ${hasStockIssue ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'}`}
                  style={{ backgroundColor: '#345457' }}
                >
                  Continuar al pago
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <TransactionalFooter />
    </>
  );
}
