import Image from 'next/image';
import Link from 'next/link';
import { CATEGORY_NAMES } from '@/lib/categories';

function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function IconVisa() {
  return (
    <svg width="36" height="14" viewBox="0 0 72 28" aria-hidden="true">
      <text x="0" y="22" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontStyle="italic" fontSize="24" fill="#1A1F71">VISA</text>
    </svg>
  );
}

function IconMastercard() {
  return (
    <svg width="30" height="20" viewBox="0 0 30 20" aria-hidden="true">
      <circle cx="11" cy="10" r="9" fill="#EB001B" />
      <circle cx="19" cy="10" r="9" fill="#F79E1B" style={{ mixBlendMode: 'multiply' }} />
    </svg>
  );
}

function IconMercadoPago() {
  return (
    <svg width="68" height="14" viewBox="0 0 132 28" aria-hidden="true">
      <text x="0" y="21" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="20" fill="#009EE3">mercado pago</text>
    </svg>
  );
}

// TODO: completar con las URLs reales cuando existan las cuentas — mientras estén vacías, el ícono no se muestra.
const SOCIAL_LINKS = {
  instagram: '',
  facebook: '',
  whatsapp: '',
};

const PAYMENT_METHODS = [
  { name: 'Visa', Icon: IconVisa },
  { name: 'Mastercard', Icon: IconMastercard },
  { name: 'MercadoPago', Icon: IconMercadoPago },
];

const FOOTER_LINKS: Record<string, { label: string; href: string }[]> = {
  Institucional: [
    { label: 'Nosotros', href: '/nosotros' },
    { label: 'Preguntas frecuentes', href: '/faq' },
    { label: 'Formas de pago', href: '/formas-de-pago' },
    { label: 'Envíos', href: '/envios' },
    { label: 'Cambios y devoluciones', href: '/terminos' },
    { label: 'Contacto', href: '/contacto' },
  ],
  Categorías: CATEGORY_NAMES.map(cat => ({ label: cat, href: `/catalogo?categoria=${encodeURIComponent(cat)}` })),
  Información: [
    { label: 'Términos y condiciones', href: '/terminos' },
    { label: 'Política de privacidad', href: '/privacidad' },
    { label: 'Libro de quejas', href: '/libro-de-quejas' },
  ],
};

export function Footer() {
  return (
    <footer style={{ backgroundColor: '#1E3134' }} className="text-white pt-12 sm:pt-14 pb-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-3">
              <Image src="/logo.png" alt="Marli Libros" width={140} height={46} style={{ objectFit: 'contain', height: '40px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
            </div>
            <div className="w-8 h-px mb-4" style={{ backgroundColor: '#C8A86B', opacity: 0.5 }} />
            <p className="text-[12px] text-white/55 leading-relaxed mb-5">
              Desde 1999 acompañamos tu pasión por la lectura con una cuidada selección de libros y productos para todas las edades.
            </p>
            {(SOCIAL_LINKS.instagram || SOCIAL_LINKS.facebook || SOCIAL_LINKS.whatsapp) && (
              <div className="flex gap-3 text-white/60">
                {SOCIAL_LINKS.instagram && (
                  <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><IconInstagram /></a>
                )}
                {SOCIAL_LINKS.facebook && (
                  <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><IconFacebook /></a>
                )}
                {SOCIAL_LINKS.whatsapp && (
                  <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><IconWhatsApp /></a>
                )}
              </div>
            )}
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-bold text-[13px] mb-4">{title}</h4>
              <ul className="space-y-2">
                {items.map(item => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-[12px] text-white/55 hover:text-white transition-colors">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-bold text-[13px] mb-4">Medios de pago</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {PAYMENT_METHODS.map(({ name, Icon }) => (
                <span key={name} aria-label={name} title={name} className="flex items-center justify-center px-2.5 py-1.5 bg-[#FCFBF8] rounded">
                  <Icon />
                </span>
              ))}
            </div>
            <p className="text-[12px] text-white/55">Transferencia bancaria</p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-[12px] text-white/50">© 2026 Marli Libros. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
