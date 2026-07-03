'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const NAV_SECTIONS = [
  {
    label: 'Operaciones',
    items: [
      { href: '/admin', label: 'Dashboard', icon: IconDashboard },
      { href: '/admin/pedidos', label: 'Pedidos', icon: IconOrders },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { href: '/admin/productos', label: 'Productos', icon: IconProducts },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { href: '/admin/gastos', label: 'Gastos', icon: IconExpenses },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap(s => s.items);

function isActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

async function handleLogout() {
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();
  window.location.href = '/login';
}

function IconDashboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconOrders() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 4h6a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2z" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

function IconProducts() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconExpenses() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

function IconStore() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function Avatar({ email }: { email: string }) {
  const chars = email
    .split('@')[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('') || email[0]?.toUpperCase() || 'A';

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
      style={{ backgroundColor: '#345457' }}
    >
      {chars}
    </div>
  );
}

export function AdminSidebar({ email, pendingDispatch }: { email: string; pendingDispatch: number }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: bottom navigation */}
      <div className="flex sm:hidden print:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100" style={{ boxShadow: '0 -4px 20px rgba(52,84,87,0.06)' }}>
        {ALL_NAV_ITEMS.map(item => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-colors duration-200"
              style={{ color: active ? '#345457' : '#9AA6A4' }}
            >
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ backgroundColor: '#345457' }}
                />
              )}
              <Icon />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.href === '/admin/pedidos' && pendingDispatch > 0 && (
                <span
                  className="absolute top-2 right-[calc(50%-18px)] text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: '#C8A86B', color: '#345457' }}
                >
                  {pendingDispatch > 9 ? '9+' : pendingDispatch}
                </span>
              )}
            </Link>
          );
        })}
        {/* Store link as extra item */}
        <Link
          href="/"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
          style={{ color: '#9AA6A4' }}
        >
          <IconStore />
          <span className="text-[10px] font-medium">Tienda</span>
        </Link>
      </div>

      {/* Mobile top bar (minimal — just logo + logout) */}
      <div className="flex sm:hidden print:hidden items-center justify-between px-4 py-3 bg-[#FCFBF8] border-b border-gray-100">
        <Link href="/admin">
          <div
            role="img"
            aria-label="Marli Libros"
            style={{
              height: '32px',
              aspectRatio: '460 / 125',
              backgroundColor: '#345457',
              WebkitMaskImage: 'url(/logo.png)',
              maskImage: 'url(/logo.png)',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'left center',
              maskPosition: 'left center',
            }}
          />
        </Link>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-full text-[12px] font-medium border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400 hover:bg-red-50 transition-all duration-300"
        >
          Salir
        </button>
      </div>

      {/* Desktop: sidebar */}
      <aside
        className="w-60 shrink-0 hidden sm:flex sm:fixed sm:inset-y-0 sm:left-0 flex-col overflow-y-auto z-30 print:hidden"
        style={{ backgroundColor: '#FCFBF8', borderRight: '1px solid rgba(0,0,0,0.05)' }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-gray-100">
          <Link href="/admin" className="block">
            <div
              role="img"
              aria-label="Marli Libros"
              style={{
                height: '36px',
                aspectRatio: '460 / 125',
                backgroundColor: '#345457',
                WebkitMaskImage: 'url(/logo.png)',
                maskImage: 'url(/logo.png)',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'left center',
                maskPosition: 'left center',
              }}
            />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-5">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                      style={
                        active
                          ? {
                              backgroundColor: 'rgba(52,84,87,0.08)',
                              color: '#345457',
                              borderLeft: '2.5px solid #345457',
                              paddingLeft: '10px',
                            }
                          : {
                              color: '#6B7280',
                              borderLeft: '2.5px solid transparent',
                              paddingLeft: '10px',
                            }
                      }
                      onMouseEnter={e => {
                        if (!active) {
                          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(52,84,87,0.05)';
                          (e.currentTarget as HTMLAnchorElement).style.color = '#345457';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!active) {
                          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '';
                          (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280';
                        }
                      }}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon />
                        {item.label}
                      </span>
                      {item.href === '/admin/pedidos' && pendingDispatch > 0 && (
                        <span
                          className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: active ? 'rgba(52,84,87,0.15)' : '#C8A86B',
                            color: active ? '#345457' : '#345457',
                          }}
                        >
                          {pendingDispatch}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-2.5 px-1 mb-3">
            <Avatar email={email} />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-gray-700 truncate">
                {email.split('@')[0]}
              </p>
              <p className="text-[10px] text-gray-400 truncate">{email}</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-[13px] font-medium border border-gray-200 text-gray-500 hover:border-[#345457] hover:text-[#345457] hover:bg-[rgba(52,84,87,0.04)] transition-all duration-200"
          >
            <IconStore /> Ver tienda
          </Link>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 rounded-xl text-[13px] font-medium text-gray-400 hover:text-red-400 hover:bg-red-50 transition-all duration-200 text-left"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
