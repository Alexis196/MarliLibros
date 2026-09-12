'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import { useCart } from '@/contexts/CartContext';
import { TransactionalHeader, TransactionalFooter } from '@/components/TransactionalLayout';
import { MarliLoader } from '@/components/MarliLoader';
import { shippingCostFor } from '@/lib/shipping';

const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

const PROVINCES = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Ciudad Autónoma de Buenos Aires',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
}

type AppliedCoupon = { code: string; discountAmount: number };

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, liveStock, refreshStock } = useCart();
  const hasStockIssue = items.some(i => {
    const stock = liveStock[i.bookId];
    return typeof stock === 'number' && i.quantity > stock;
  });
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    reference: '',
  });
  const [activeTab, setActiveTab] = useState<'card' | 'mercadopago' | 'cash'>('card');
  const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('shipping');

  const [cashForm, setCashForm] = useState({ firstName: '', lastName: '', address: '', phone: '' });

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mpReady, setMpReady] = useState(false);
  // Mercado Pago limita a 3 los intentos de "Secure Fields" por instancia del brick de
  // tarjeta: al cuarto intento sobre el mismo brick tira "fields_setup_failed_after_3_tries".
  // Forzamos un remount completo (brick nuevo) después de cada intento fallido para que
  // el próximo intento arranque con una sesión de Secure Fields fresca.
  const [cardAttempt, setCardAttempt] = useState(0);

  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const shippingCost = activeTab === 'cash' ? 0 : shippingCostFor(deliveryMethod);
  const finalTotal = Math.round((totalPrice - discountAmount + shippingCost) * 100) / 100;

  // El brick de tarjeta de Mercado Pago se reinicializa (recarga) cada vez que cambia
  // la referencia de `initialization`. No le pasamos el email en vivo (aunque sea con
  // debounce, una pausa al tipear ya alcanza para disparar una recarga): el email real
  // siempre se manda aparte, tomado de `form.email`, al confirmar el pago.
  const cardInitialization = useMemo(() => ({ amount: finalTotal }), [finalTotal]);

  useEffect(() => { refreshStock(); }, [refreshStock]);

  useEffect(() => {
    if (MP_PUBLIC_KEY) {
      initMercadoPago(MP_PUBLIC_KEY, { locale: 'es-AR' });
      setMpReady(true);
    }
  }, []);

  const update =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const updateCash =
    (field: keyof typeof cashForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setCashForm(prev => ({ ...prev, [field]: e.target.value }));

  const missingCashData = () =>
    !cashForm.firstName || !cashForm.lastName || !cashForm.address || !cashForm.phone;

  const missingShippingData = () =>
    deliveryMethod === 'pickup'
      ? !form.name || !form.email || !form.phone
      : !form.name || !form.email || !form.address || !form.city || !form.province || !form.postalCode || !form.reference;

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
    if (hasStockIssue) {
      setError('Ajustá las cantidades del carrito antes de pagar: algún libro ya no tiene stock suficiente.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { ...form, deliveryMethod },
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

  const handleCashSubmit = async () => {
    if (missingCashData()) {
      setError('Completá tus datos antes de confirmar el pedido.');
      return;
    }
    if (hasStockIssue) {
      setError('Ajustá las cantidades del carrito antes de confirmar: algún libro ya no tiene stock suficiente.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: cashForm,
          items: items.map(i => ({ bookId: i.bookId, quantity: i.quantity })),
          couponCode: appliedCoupon?.code,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.order_id) {
        throw new Error(data.error || 'No pudimos registrar el pedido. Intentá de nuevo.');
      }
      router.push(`/checkout/pending?order_id=${data.order_id}&method=cash`);
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
    if (hasStockIssue) {
      setError('Ajustá las cantidades del carrito antes de pagar: algún libro ya no tiene stock suficiente.');
      throw new Error('missing-shipping-data');
    }
    setError(null);
    try {
      const res = await fetch('/api/checkout/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { ...form, deliveryMethod },
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
      if (data.status === 'rejected') {
        // Mostramos el motivo acá mismo: el cliente corrige los datos o cambia de
        // tarjeta sin perder el formulario ni el carrito.
        setError(data.message || 'El pago fue rechazado. Probá con otra tarjeta.');
        throw new Error('payment-rejected');
      }
      redirectForStatus(data.status, data.order_id);
    } catch (err) {
      const isValidationError = err instanceof Error && err.message === 'missing-shipping-data';
      if (!isValidationError) {
        setError(prev => prev ?? 'No pudimos procesar el pago. Intentá de nuevo.');
        // El intento de pago llegó a tocar el brick (aprobó/rechazó/falló): el brick se
        // remonta (nuevo cardAttempt) para que el próximo intento tenga una sesión de
        // Secure Fields fresca en vez de reusar la que ya se usó.
        setCardAttempt(n => n + 1);
      }
      throw err;
    }
  };

  // El brick de tarjeta reinicializa (recarga) cada vez que `onSubmit`/`onError` cambian
  // de referencia, y handleCardSubmit se recrea en cada render porque lee form/carrito
  // actuales. Lo forwardeamos por ref para exponer una función estable sin perder los
  // datos frescos al momento del submit real.
  const handleCardSubmitRef = useRef(handleCardSubmit);
  handleCardSubmitRef.current = handleCardSubmit;
  const stableHandleCardSubmit = useCallback(
    (cardFormData: Parameters<typeof handleCardSubmit>[0]) => handleCardSubmitRef.current(cardFormData),
    []
  );

  const handleCardError = useCallback((err: unknown) => {
    console.error('CardPayment brick error', err);
    setError('Hubo un problema con los datos de la tarjeta. Revisalos e intentá de nuevo.');
    // Un error "critical" (p. ej. fields_setup_failed_after_3_tries) deja el brick
    // roto: lo remontamos ya mismo para que el usuario pueda seguir intentando.
    const isCritical = typeof err === 'object' && err !== null && 'type' in err && (err as { type?: string }).type === 'critical';
    if (isCritical) setCardAttempt(n => n + 1);
  }, []);

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
            {/* Medio de pago + datos de envío */}
            <div className="lg:col-span-2 space-y-6">
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
                    <span className="sm:hidden">💳 Tarjeta</span>
                    <span className="hidden sm:inline">💳 Tarjeta de crédito/débito</span>
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
                  <button
                    type="button"
                    onClick={() => setActiveTab('cash')}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors duration-300 ${
                      activeTab === 'cash'
                        ? 'bg-[#345457] text-white border-[#345457]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-[#345457]/30 hover:text-[#345457]'
                    }`}
                  >
                    💵 Efectivo o transferencia
                  </button>
                </div>

                {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

                {hasStockIssue ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm font-medium" style={{ color: '#B85C5C' }}>
                      Algún libro de tu carrito ya no tiene stock suficiente.
                    </p>
                    <Link href="/carrito" className="text-sm font-semibold underline" style={{ color: '#B85C5C' }}>
                      Volver al carrito para ajustarlo →
                    </Link>
                  </div>
                ) : activeTab === 'card' ? (
                  !MP_PUBLIC_KEY ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm text-amber-700">
                        El pago con tarjeta no está disponible en este momento. Podés pagar con Mercado Pago desde la otra pestaña.
                      </p>
                    </div>
                  ) : mpReady ? (
                    <CardPayment
                      key={`${finalTotal}:${cardAttempt}`}
                      initialization={cardInitialization}
                      onSubmit={stableHandleCardSubmit}
                      onError={handleCardError}
                    />
                  ) : (
                    <div className="flex items-center justify-center py-10">
                      <MarliLoader size={64} label="Cargando formulario de pago" />
                    </div>
                  )
                ) : activeTab === 'mercadopago' ? (
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
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={handleCashSubmit}
                      disabled={submitting}
                      className="w-full px-5 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                      style={{ backgroundColor: '#345457' }}
                    >
                      {submitting ? 'Registrando pedido…' : 'Confirmar pedido'}
                    </button>
                    <p className="text-[11px] text-gray-400 mt-3 text-center">
                      Te contactamos por WhatsApp para coordinar la entrega. Si te queda más cómodo, te pasamos el alias para pagar por transferencia.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white p-5 sm:p-7" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
                <h2 className="text-base font-bold mb-5" style={{ color: '#345457' }}>
                  {activeTab === 'cash' ? 'Tus datos' : 'Entrega'}
                </h2>

                {activeTab === 'cash' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Nombre</label>
                        <input
                          required
                          type="text"
                          value={cashForm.firstName}
                          onChange={updateCash('firstName')}
                          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Apellido</label>
                        <input
                          required
                          type="text"
                          value={cashForm.lastName}
                          onChange={updateCash('lastName')}
                          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Dirección</label>
                      <input
                        required
                        type="text"
                        placeholder="Calle y número"
                        value={cashForm.address}
                        onChange={updateCash('address')}
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Teléfono</label>
                      <input
                        required
                        type="tel"
                        value={cashForm.phone}
                        onChange={updateCash('phone')}
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]"
                      />
                    </div>
                    <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(52,84,87,0.06)' }}>
                      <p className="text-[13px] font-semibold" style={{ color: '#345457' }}>Pagás en efectivo o por transferencia.</p>
                      <p className="text-[12px] text-gray-500 mt-1">
                        Te vamos a contactar por WhatsApp para coordinar la entrega. Si te queda más cómodo, te pasamos el alias del negocio para que hagas una transferencia.
                      </p>
                    </div>
                  </div>
                ) : (
                <>
                <div className="flex gap-2 mb-6">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('shipping')}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors duration-300 ${
                      deliveryMethod === 'shipping'
                        ? 'bg-[#345457] text-white border-[#345457]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-[#345457]/30 hover:text-[#345457]'
                    }`}
                  >
                    📦 Envío a domicilio
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors duration-300 ${
                      deliveryMethod === 'pickup'
                        ? 'bg-[#345457] text-white border-[#345457]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-[#345457]/30 hover:text-[#345457]'
                    }`}
                  >
                    🏬 Retiro en persona
                  </button>
                </div>

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
                    <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                      Teléfono{deliveryMethod === 'pickup' ? '' : ' (opcional)'}
                    </label>
                    <input
                      required={deliveryMethod === 'pickup'}
                      type="tel"
                      value={form.phone}
                      onChange={update('phone')}
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]"
                    />
                  </div>

                  {deliveryMethod === 'pickup' ? (
                    <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(52,84,87,0.06)' }}>
                      <p className="text-[13px] font-semibold" style={{ color: '#345457' }}>Retirás tu pedido en el local.</p>
                      <p className="text-[12px] text-gray-500 mt-1">
                        Te contactamos por email o WhatsApp para coordinar día y horario apenas confirmemos tu pago.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Dirección de envío</label>
                        <input
                          required
                          type="text"
                          placeholder="Calle y número"
                          value={form.address}
                          onChange={update('address')}
                          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Barrio / Ciudad</label>
                        <input
                          required
                          type="text"
                          placeholder="Ej: Palermo, CABA"
                          value={form.city}
                          onChange={update('city')}
                          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Provincia</label>
                          <select
                            required
                            value={form.province}
                            onChange={update('province')}
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]"
                          >
                            <option value="" disabled>Elegir…</option>
                            {PROVINCES.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Código postal</label>
                          <input
                            required
                            type="text"
                            value={form.postalCode}
                            onChange={update('postalCode')}
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Referencia (piso, depto, entre calles, etc.)</label>
                        <textarea
                          required
                          rows={2}
                          value={form.reference}
                          onChange={update('reference')}
                          placeholder="Ej: Depto 4B, timbre 2, entre San Martín y Belgrano"
                          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]"
                        />
                      </div>
                    </>
                  )}
                </div>
                </>
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
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Envío</span>
                  <span>{shippingCost > 0 ? formatPrice(shippingCost) : 'Gratis'}</span>
                </div>
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
