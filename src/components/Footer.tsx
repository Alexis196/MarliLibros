import Image from 'next/image';
import Link from 'next/link';
import { CATEGORY_NAMES } from '@/lib/categories';

const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/marlilibros/',
  whatsapp: 'https://wa.me/5493705217630',
};

// El logo de Mercado Pago es blanco (sin fondo propio), a diferencia de Visa/Mastercard
// que ya traen sus colores — por eso necesita un chip de color en vez del claro.
const PAYMENT_METHODS = [
  { name: 'Visa', src: '/visa.svg', width: 28, height: 28, bg: '#FCFBF8' },
  { name: 'Mastercard', src: '/mastercard.svg', width: 40, height: 28, bg: '#FCFBF8' },
  { name: 'MercadoPago', src: '/MP_RGB_HANDSHAKE_pluma_horizontal.svg', width: 52, height: 21, bg: '#009EE3' },
];

const FOOTER_CATEGORIES_LIMIT = 6;

const FOOTER_LINKS: Record<string, { label: string; href: string }[]> = {
  Categorías: [
    ...CATEGORY_NAMES.slice(0, FOOTER_CATEGORIES_LIMIT).map(cat => ({ label: cat, href: `/catalogo?categoria=${encodeURIComponent(cat)}` })),
    { label: 'Ver todas →', href: '/catalogo' },
  ],
};

export function Footer() {
  return (
    <footer style={{ backgroundColor: '#1E3134' }} className="text-white pt-9 sm:pt-10 pb-5 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1fr] gap-x-10 gap-y-8 lg:gap-x-[60px] mb-6">
          <div className="sm:col-span-2 lg:col-span-1 max-w-xs">
            <Image
              src="/logo.png"
              alt="Marli Libros"
              width={140}
              height={46}
              style={{ objectFit: 'contain', height: '34px', width: 'auto', filter: 'brightness(0) invert(1)' }}
              className="mb-3"
            />
            <div className="w-8 h-px mb-3" style={{ backgroundColor: '#C8A86B', opacity: 0.5 }} />
            <p className="text-[12px] text-white/55 leading-relaxed max-w-[260px] mb-3.5">
              Desde 1999 acompañamos tu pasión por la lectura con una cuidada selección de libros y productos para todas las edades.
            </p>
            {(SOCIAL_LINKS.whatsapp || SOCIAL_LINKS.instagram) && (
              <div className="flex gap-2.5">
                {SOCIAL_LINKS.whatsapp && (
                  <a
                    href={SOCIAL_LINKS.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Escribinos por WhatsApp"
                    className="flex items-center justify-center w-9 h-9 hover:opacity-85 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Image src="/whatsapp.svg" alt="WhatsApp" width={36} height={36} />
                  </a>
                )}
                {SOCIAL_LINKS.instagram && (
                  <a
                    href={SOCIAL_LINKS.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Seguinos en Instagram"
                    className="flex items-center justify-center w-9 h-9 hover:opacity-85 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Image src="/instagram.svg" alt="Instagram" width={36} height={36} />
                  </a>
                )}
              </div>
            )}
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-bold text-[13px] mb-3">{title}</h4>
              <ul className="space-y-1.5">
                {items.map(item => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-[12px] text-white/55 hover:text-[#C8A86B] transition-colors duration-200">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-bold text-[13px] mb-3">Medios de pago</h4>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {PAYMENT_METHODS.map(({ name, src, width, height, bg }) => (
                <span key={name} aria-label={name} title={name} className="flex items-center justify-center px-2.5 py-1.5 rounded" style={{ backgroundColor: bg }}>
                  <Image src={src} alt={name} width={width} height={height} style={{ objectFit: 'contain', height: '18px', width: 'auto' }} />
                </span>
              ))}
            </div>
            <p className="text-[12px] text-white/55">Transferencia bancaria</p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 text-center">
          <p className="text-[12px] text-white/50">© 2026 Marli Libros. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
