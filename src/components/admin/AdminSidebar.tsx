'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/productos', label: 'Productos' },
];

function isActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

async function handleLogout() {
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();
  window.location.href = '/login';
}

export function AdminSidebar({ email, pendingDispatch }: { email: string; pendingDispatch: number }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: barra superior */}
      <div className="flex sm:hidden items-center justify-between px-4 py-3 bg-[#FCFBF8] border-b border-gray-100">
        <nav className="flex gap-1 overflow-x-auto">
          {NAV_ITEMS.map(item => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors duration-300 ${
                  active ? 'bg-[#345457] text-white' : 'text-gray-500 hover:bg-[rgba(52,84,87,0.08)]'
                }`}
              >
                {item.label}
                {item.href === '/admin/pedidos' && pendingDispatch > 0 && (
                  <span className="text-[10px] font-bold px-1.5 rounded-full" style={{ backgroundColor: '#C8A86B', color: '#345457' }}>
                    {pendingDispatch}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <button onClick={handleLogout} className="text-[12px] font-medium text-gray-400 hover:text-red-400 transition-colors duration-300 shrink-0 ml-2">
          Salir
        </button>
      </div>

      {/* Desktop: sidebar */}
      <aside
        className="w-60 shrink-0 hidden sm:flex flex-col p-5"
        style={{ backgroundColor: '#FCFBF8', borderRight: '1px solid rgba(0,0,0,0.05)' }}
      >
        <Link href="/admin" className="block mb-8">
          <div
            role="img"
            aria-label="Marli Libros"
            style={{
              height: '40px',
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

        <nav className="space-y-1 flex-1">
          {NAV_ITEMS.map(item => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-300 ${
                  active ? 'bg-[#345457] text-white' : 'text-gray-500 hover:bg-[rgba(52,84,87,0.08)] hover:text-[#345457]'
                }`}
              >
                {item.label}
                {item.href === '/admin/pedidos' && pendingDispatch > 0 && (
                  <span
                    className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: active ? 'rgba(255,255,255,0.25)' : '#C8A86B', color: active ? '#fff' : '#345457' }}
                  >
                    {pendingDispatch}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 truncate mb-2">{email}</p>
          <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-red-400 transition-colors duration-300">
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
