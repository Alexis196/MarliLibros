'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import { useCart } from '@/contexts/CartContext';
import { TransactionalHeader, TransactionalFooter } from '@/components/TransactionalLayout';

const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
}

type AppliedCoupon = { code: string; discountAmount: number };

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice } = useCart();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [activeTab, setActiveTab] = useState<'card' | 'mercadopago'>('card');

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const finalTotal = Math.round((totalPrice - discountAmount) * 100) / 100;

  useEffect(() => {
    if (MP_PUBLIC_KEY) initMercadoPago(MP_PUBLIC_KEY, { locale: 'es-AR' });
  }, []);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const missingShippingData = () => !form.name || !form.email || !form.address;

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput, subtotal: totalPrice }),
      });
      const data = await res.json();
      if (!data.valid) {
        setCouponError(data.message || 'Cupón inválido.');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({ code: data.code, discountAmount: data.discountAmount });
      }
    } catch {
      setCouponError('No pudimos validar el cupón. Probá de nuevo.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  const redirectForStatus = (status: string, orderId: string) => {
    // El carrito se vacía en las páginas de success/pending (vía ClearCartOnMount);
    // en failure se deja intacto para que el cliente pueda reintentar el pago.
    if (status === 'approved') router.push(`/checkout/success?order_id=${orderId}`);
    else if (status === 'in_process' || status === 'pending') router.push(`/checkout/pending?order_id=${orderId}`);
    else router.push(`/checkout/failure?order_id=${orderId}`);
  };

  const handleMercadoPagoSubmit = async () => {
    if (missingShippingData()) {
      setError('Completá tus datos de envío antes de pagar.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: form,
          items: items.map(i => ({ bookId: i.bookId, quantity: i.quantity })),
          couponCode: appliedCoupon?.code,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.init_point) {
        throw new Error(data.error || 'No pudimos iniciar el pago. Intentá de nuevo.');
      }
      window.location.href = data.init_point;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
      setSubmitting(false);
    }
  };

  const handleCardSubmit = async (cardFormData: {
    token: string;
    issuer_id: string;
    payment_method_id: string;
    installments: number;
    payer: { email?: string; identification?: { type: string; number: string } };
  }) => {
    if (missingShippingData()) {
      setError('Completá tus datos de envío antes de pagar.');
      throw new Error('missing-shipping-data');
    }
    setError(null);
    try {
      const res = await fetch('/api/checkout/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: form,
          items: items.map(i => ({ bookId: i.bookId, quantity: i.quantity })),
          couponCode: appliedCoupon?.code,
          formData: cardFormData,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No pudimos procesar el pago.');
        throw new Error(data.error || 'payment-failed');
      }
      redirectForStatus(data.status, data.order_id);
    } catch (err) {
      if (!(err instanceof Error && err.message === 'missing-shipping-data')) {
        setError(prev => prev ?? 'No pudimos procesar el pago. Intentá de nuevo.');
      }
      throw err;
    }
  };

  if (items.length === 0) {
    return (
      <>
        <TransactionalHeader />
        <main style={{ background: '#F7F6F2', minHeight: '70vh' }}>
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
            <p className="text-gray-500 text-lg font-medium mb-4">Tu carrito está vacío.</p>
            <Link href="/catalogo" className="text-sm font-semibold" style={{ color: '#345457' }}>
              Ver catálogo →
            </Link>
          </div>
        </main>
        <TransactionalFooter />
      </>
    );
  }

  return (
    <>
      <TransactionalHeader />
      <main style={{ background: '#F7F6F2', minHeight: '70vh' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <h1 className="text-2xl sm:text-3xl font-bold mb-8" style={{ color: '#345457', fontFamily: 'var(--font-playfair)' }}>
            Finalizar compra
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
            {/* Datos de envío + pago */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl bg-white p-5 sm:p-7" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
                <h2 className="text-base font-bold mb-5" style={{ color: '#345457' }}>Datos de envío</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Nombre completo</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={update('name')}
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Email</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={update('email')}
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">A esta dirección te enviamos la confirmación de tu compra.</p>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Teléfono (opcional)</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={update('phone')}
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Dirección de envío</label>
                    <input
                      required
                      type="text"
                      placeholder="Calle, número, ciudad, provincia, CP"
                      value={form.address}
                      onChange={update('address')}
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 sm:p-7" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
                <h2 className="text-base font-bold mb-5" style={{ color: '#345457' }}>Medio de pago</h2>

                <div className="flex gap-2 mb-6">
                  <button
                    type="button"
                    onClick={() => setActiveTab('card')}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors duration-300 ${
                      activeTab === 'card'
                        ? 'bg-[#345457] text-white border-[#345457]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-[#345457]/30 hover:text-[#345457]'
                    }`}
                  >
                    💳 Tarjeta de crédito/débito
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('mercadopago')}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors duration-300 ${
                      activeTab === 'mercadopago'
                        ? 'bg-[#345457] text-white border-[#345457]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-[#345457]/30 hover:text-[#345457]'
                    }`}
                  >
                    Mercado Pago
                  </button>
                </div>

                {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

                {activeTab === 'card' ? (
                  MP_PUBLIC_KEY ? (
                    <CardPayment
                      key={finalTotal}
                      initialization={{ amount: finalTotal }}
                      locale="es-AR"
                      onSubmit={handleCardSubmit}
                      onError={(err) => {
                        console.error('CardPayment brick error', err);
                        setError('Hubo un problema con los datos de la tarjeta. Revisalos e intentá de nuevo.');
                      }}
                    />
                  ) : (
                    <p className="text-sm text-gray-400">
                      El pago con tarjeta todavía no está configurado. Probá con la opción Mercado Pago.
                    </p>
                  )
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={handleMercadoPagoSubmit}
                      disabled={submitting}
                      className="w-full px-5 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                      style={{ backgroundColor: '#345457' }}
                    >
                      {submitting ? 'Redirigiendo a Mercado Pago…' : 'Pagar con Mercado Pago'}
                    </button>
                    <p className="text-[11px] text-gray-400 mt-3 text-center">
                      Vas a completar el pago de forma segura en Mercado Pago. Aceptamos tarjetas de crédito, débito y saldo en cuenta.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen */}
            <div className="rounded-2xl bg-white p-5 sm:p-6" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
              <h2 className="text-base font-bold mb-4" style={{ color: '#345457' }}>Tu pedido</h2>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.bookId} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 line-clamp-1 pr-2">{item.title} <span className="text-gray-400">x{item.quantity}</span></span>
                    <span className="font-semibold shrink-0" style={{ color: '#345457' }}>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Cupón de descuento */}
              <div className="border-t border-gray-100 pt-4 mb-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ backgroundColor: 'rgba(200,168,107,0.12)' }}>
                    <span className="text-[12px] font-semibold" style={{ color: '#9C7A3F' }}>✦ Cupón {appliedCoupon.code}</span>
                    <button onClick={removeCoupon} className="text-[12px] text-gray-400 hover:text-red-400 transition-colors duration-300">
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Código de descuento"
                        value={couponInput}
                        onChange={e => setCouponInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                        className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]"
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:border-[#345457] hover:text-[#345457] transition-colors duration-300 disabled:opacity-50"
                      >
                        {couponLoading ? '…' : 'Aplicar'}
                      </button>
                    </div>
                    {couponError && <p className="text-[12px] text-red-500 mt-2">{couponError}</p>}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-100">
                {discountAmount > 0 && (
                  <>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Subtotal</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm" style={{ color: '#9C7A3F' }}>
                      <span>Descuento</span>
                      <span>−{formatPrice(discountAmount)}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between text-base font-bold pt-2" style={{ color: '#1E3134' }}>
                  <span>Total</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <TransactionalFooter />
    </>
  );
}
