import Link from 'next/link';
import { TransactionalHeader, TransactionalFooter } from '@/components/TransactionalLayout';

export default function CheckoutFailurePage() {
  return (
    <>
      <TransactionalHeader />
      <main style={{ background: '#F7F6F2', minHeight: '70vh' }}>
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-gray-300">
            <span className="text-white text-3xl">✕</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: '#345457', fontFamily: 'var(--font-playfair)' }}>
            El pago no pudo procesarse
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            No te preocupes, no se realizó ningún cobro. Podés intentar de nuevo con otro medio de pago.
          </p>
          <Link
            href="/checkout"
            className="inline-flex px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#345457' }}
          >
            Reintentar pago
          </Link>
        </div>
      </main>
      <TransactionalFooter />
    </>
  );
}
