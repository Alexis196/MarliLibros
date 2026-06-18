import Image from 'next/image';

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

const FOOTER_LINKS: Record<string, string[]> = {
  Institucional: ['Nosotros', 'Preguntas frecuentes', 'Formas de pago', 'Envíos', 'Cambios y devoluciones', 'Contacto'],
  Categorías: ['Libros', 'Desarrollo Personal', 'Tarot y Oráculos', 'Rompecabezas', 'Juegos Didácticos', 'Agendas y Cuadernos'],
  Información: ['Términos y condiciones', 'Política de privacidad', 'Libro de quejas'],
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
            <div className="flex gap-3 text-white/60">
              <button className="hover:text-white transition-colors"><IconInstagram /></button>
              <button className="hover:text-white transition-colors"><IconFacebook /></button>
              <button className="hover:text-white transition-colors"><IconWhatsApp /></button>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-bold text-[13px] mb-4">{title}</h4>
              <ul className="space-y-2">
                {items.map(item => (
                  <li key={item}>
                    <a href="#" className="text-[12px] text-white/55 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-bold text-[13px] mb-4">Medios de pago</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {['VISA', 'Mastercard', 'MercadoPago'].map(m => (
                <span key={m} className="px-2.5 py-1 bg-[#FCFBF8] rounded text-[11px] font-bold" style={{ color: '#345457' }}>
                  {m}
                </span>
              ))}
            </div>
            <p className="text-[12px] text-white/55">Transferencia bancaria</p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-[12px] text-white/35">© 2026 Marli Libros. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
