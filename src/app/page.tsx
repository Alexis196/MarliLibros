'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect, RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BookCard, type Book } from '@/components/BookCard';
import { useStore } from '@/contexts/StoreContext';
import { useAuthors, type Author } from '@/contexts/AuthorsContext';
import { CATEGORY_NAMES } from '@/lib/categories';

function BookCarousel({ books, loading }: { books: Book[]; loading: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <button onClick={() => scroll('left')} className="hidden sm:flex absolute -left-4 top-[45%] -translate-y-1/2 z-10 w-9 h-9 bg-[#FCFBF8] rounded-full shadow-md items-center justify-center text-gray-500 hover:text-[#345457] transition-colors border border-gray-100">
        <ChevronLeftIcon />
      </button>
      <div ref={scrollRef} className="overflow-x-auto scrollbar-hide pb-2">
        <div className="flex gap-3 sm:gap-4" style={{ width: 'max-content' }}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-40 sm:w-52 flex-shrink-0 bg-[#FCFBF8] rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-52 sm:h-64 bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            : books.map(book => (
                <div key={book.id} className="w-40 sm:w-52 flex-shrink-0">
                  <BookCard book={book} />
                </div>
              ))
          }
        </div>
      </div>
      <button onClick={() => scroll('right')} className="hidden sm:flex absolute -right-4 top-[45%] -translate-y-1/2 z-10 w-9 h-9 bg-[#FCFBF8] rounded-full shadow-md items-center justify-center text-gray-500 hover:text-[#345457] transition-colors border border-gray-100">
        <ChevronRightIcon />
      </button>
    </div>
  );
}

// ─── Base Icons ───────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

// ─── Category Icons ───────────────────────────────────────────────────────────

function IconBook() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconBrain() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-3.16A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-3.16A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
  );
}

function IconPuzzle() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 2c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z" />
    </svg>
  );
}

function IconDice() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <path d="M16 8h.01" /><path d="M8 8h.01" /><path d="M8 16h.01" />
      <path d="M16 16h.01" /><path d="M12 12h.01" />
    </svg>
  );
}

function IconNotebook() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6h4" /><path d="M2 10h4" /><path d="M2 14h4" /><path d="M2 18h4" />
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <path d="M16 2v20" />
    </svg>
  );
}

function IconWand() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" />
      <path d="m14 7 3 3" /><path d="M5 6v4" /><path d="M19 14v4" /><path d="M10 2v2" /><path d="M7 8H3" /><path d="M21 16h-4" /><path d="M11 3H9" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
    </svg>
  );
}

function IconGhost() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 10h.01" /><path d="M15 10h.01" />
      <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" />
    </svg>
  );
}

function IconRocket() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function IconLandmark() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" x2="21" y1="22" y2="22" /><line x1="6" x2="6" y1="18" y2="11" /><line x1="10" x2="10" y1="18" y2="11" />
      <line x1="14" x2="14" y1="18" y2="11" /><line x1="18" x2="18" y1="18" y2="11" /><polygon points="12 2 20 7 4 7" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </svg>
  );
}

function IconGraduationCap() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </svg>
  );
}

// ─── Benefit Icons ────────────────────────────────────────────────────────────

function IconTruck() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
      <rect width="7" height="7" x="14" y="10" rx="1" />
      <path d="M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0" />
      <path d="M17 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="1" fill="white" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// ─── Fade-up hook ─────────────────────────────────────────────────────────────

function useFadeUp(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Categorías', href: '/catalogo', dropdown: true },
  { label: 'Novedades', href: '/catalogo?novedades=1' },
];

const CATEGORY_ICONS: Record<string, () => React.ReactElement> = {
  'Ficción': IconBook,
  'Fantasía': IconWand,
  'Romance': IconHeart,
  'Terror y Suspenso': IconGhost,
  'Ciencia Ficción': IconRocket,
  'Clásicos': IconLandmark,
  'Infantil y Juvenil': IconStar,
  'Autoayuda': IconBrain,
  'No Ficción': IconGraduationCap,
  'Tarot y Oráculos': IconSparkles,
  'Rompecabezas': IconPuzzle,
  'Juegos Didácticos': IconDice,
  'Agendas y Cuadernos': IconNotebook,
};

const CATEGORIES = CATEGORY_NAMES.map(name => ({ name, Icon: CATEGORY_ICONS[name] }));


const BENEFITS = [
  { Icon: IconTruck, title: 'Envíos en 24–48 hs', desc: 'A todo el país' },
  { Icon: IconLock, title: 'Compra 100% segura', desc: 'Tus datos siempre protegidos' },
  { Icon: IconBox, title: 'Stock garantizado', desc: 'Solo vendemos lo que tenemos' },
  { Icon: IconChat, title: 'Atención personalizada', desc: 'Respondemos en menos de 1 hora' },
];

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ bookCount, hasNovedades }: { bookCount: number; hasNovedades: boolean }) {
  const [query, setQuery] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/catalogo?search=${encodeURIComponent(trimmed)}` : '/catalogo');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const section = canvas.parentElement as HTMLElement;

    const resize = () => {
      canvas.width = section.offsetWidth;
      canvas.height = section.offsetHeight;
    };
    resize();

    type P = { x: number; y: number; vx: number; vy: number; alpha: number; decay: number; size: number; rot: number; rotSpeed: number };
    const particles: P[] = [];

    const spawn = (x: number, y: number) => {
      for (let i = 0; i < 2; i++) {
        particles.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -(Math.random() * 1.4 + 0.4),
          alpha: Math.random() * 0.15 + 0.85,
          decay: Math.random() * 0.013 + 0.010,
          size: Math.random() * 2.5 + 1.5,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.12,
        });
      }
    };

    const star = (x: number, y: number, r: number, angle: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        const b = a + Math.PI / 4;
        ctx.lineTo(Math.cos(b) * r * 0.3, Math.sin(b) * r * 0.3);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.alpha -= p.decay; p.rot += p.rotSpeed;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = '#C8A86B';
        ctx.shadowColor = '#C8A86B';
        ctx.shadowBlur = 10;
        star(p.x, p.y, p.size, p.rot);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      const r = section.getBoundingClientRect();
      spawn(e.clientX - r.left, e.clientY - r.top);
    };

    section.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(tick);
    return () => { section.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section
      className="relative overflow-hidden md:min-h-[580px] flex flex-col md:flex-row"
      style={{
        background: '#F7F6F2',
        width: '95%',
        margin: '0 auto',
        borderRadius: '10px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
      }}
    >
      {/* Columna izquierda: texto */}
      <div className="relative z-20 flex-1 flex items-center px-4 sm:px-10 py-12 md:py-20">
        <div className="max-w-lg space-y-5 sm:space-y-6">
          {hasNovedades && (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest px-3 py-1 rounded border uppercase"
              style={{ color: '#C8A86B', borderColor: '#C8A86B', backgroundColor: '#F7F6F2' }}
            >
              ✦ Novedades
            </span>
          )}

          <h1
            className="font-black tracking-tight leading-[1.12]"
            style={{ color: '#345457', fontSize: 'clamp(32px, 4.2vw, 56px)' }}
          >
            Encontrá tu próxima historia
          </h1>

          <p className="text-gray-600 text-[16px] leading-relaxed max-w-sm">
            Libros, juegos didácticos, agendas, tarot, rompecabezas y mucho más para inspirar tu día a día.
          </p>

          <div className="space-y-2">
            <form onSubmit={handleSearch} className="flex rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-[#FCFBF8]">
              <div className="flex items-center gap-2 flex-1 px-3 sm:px-4 text-gray-400 min-w-0">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Buscar libros, autores..."
                  className="flex-1 py-3 text-sm outline-none bg-transparent text-gray-600 placeholder-gray-400 min-w-0"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="px-4 sm:px-5 py-3 text-sm font-semibold text-white shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
                style={{ backgroundColor: '#345457' }}
              >
                Buscar
              </button>
            </form>
            <p className="text-[12px] text-gray-400 pl-1">
              ✦ <strong className="text-gray-500">{bookCount.toLocaleString('es-AR')} títulos</strong> disponibles
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <Link
              href="/catalogo"
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#345457' }}
            >
              📖 Explorar catálogo
            </Link>
            {hasNovedades && (
              <Link
                href="/catalogo?novedades=1"
                className="flex items-center gap-1 text-sm font-medium transition-all hover:gap-2"
                style={{ color: '#345457' }}
              >
                Ver novedades <span>→</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Columna derecha: imagen sin caja visible */}
      <div className="relative hidden md:block md:w-[63%] shrink-0">
        <Image
          src="/bgGreen.jpeg"
          alt=""
          fill
          style={{ objectFit: 'cover', objectPosition: '42% center' }}
          priority
        />
        {/* Sombra sutil para dar profundidad debajo del libro principal */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            bottom: '14%',
            width: '38%',
            height: '14%',
            transform: 'translateX(-50%)',
            background: 'radial-gradient(ellipse at center, rgba(30,49,52,0.16) 0%, rgba(30,49,52,0) 72%)',
            filter: 'blur(4px)',
          }}
        />
        {/* Fade izquierdo para fundir con el fondo del hero sin corte visible */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, #F7F6F2 0%, rgba(247,246,242,0.8) 8%, rgba(247,246,242,0.45) 16%, rgba(247,246,242,0.18) 24%, rgba(247,246,242,0) 32%)',
          }}
        />
      </div>

      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 30 }} />
    </section>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────

function Categories({ categoryCounts }: { categoryCounts: Record<string, number> }) {
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  return (
    <section
      ref={ref}
      className="py-9 sm:py-12 bg-[#E9EDEB]"
      style={{ opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#345457' }}>Explorá por categoría</h2>
          <Link href="/catalogo" className="text-sm text-gray-400 hover:text-[#345457] transition-colors duration-300 whitespace-nowrap">
            Ver todas →
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {CATEGORIES
            .map(cat => ({ ...cat, count: categoryCounts[cat.name] ?? 0 }))
            .sort((a, b) => b.count - a.count)
            .map(cat => {
              const Icon = cat.Icon;
              if (cat.count === 0) {
                return (
                  <div
                    key={cat.name}
                    className="flex flex-col items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-white/60 rounded-2xl border border-transparent opacity-60 cursor-not-allowed"
                  >
                    <div className="text-[#345457]/40 [&_svg]:w-5 [&_svg]:h-5 sm:[&_svg]:w-6 sm:[&_svg]:h-6">
                      <Icon />
                    </div>
                    <span className="text-[13px] sm:text-[15px] font-bold text-center leading-tight text-gray-400" style={{ fontFamily: 'var(--font-playfair)' }}>{cat.name}</span>
                    <span className="text-[10px] sm:text-[11px] text-gray-400 tracking-wide uppercase">Próximamente</span>
                  </div>
                );
              }
              return (
                <Link
                  href={`/catalogo?categoria=${encodeURIComponent(cat.name)}`}
                  key={cat.name}
                  className="group flex flex-col items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-white rounded-2xl border border-transparent shadow-sm hover:shadow-[0_12px_28px_rgba(52,84,87,0.14)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
                >
                  <div className="text-[#345457]/70 group-hover:text-[#C8A86B] transition-colors duration-300 [&_svg]:w-5 [&_svg]:h-5 sm:[&_svg]:w-6 sm:[&_svg]:h-6">
                    <Icon />
                  </div>
                  <span className="text-[13px] sm:text-[15px] font-bold text-center leading-tight" style={{ color: '#345457', fontFamily: 'var(--font-playfair)' }}>{cat.name}</span>
                  <span className="text-[10px] sm:text-[11px] text-gray-400 tracking-wide group-hover:text-[#C8A86B] transition-colors duration-300">{cat.count} títulos</span>
                </Link>
              );
            })}
        </div>
      </div>
    </section>
  );
}

// ─── Novedades ────────────────────────────────────────────────────────────────

function Novedades({ books, loading }: { books: Book[]; loading: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  if (!loading && books.length === 0) return null;

  return (
    <section
      ref={ref}
      className="py-9 sm:py-12"
      style={{
        opacity: 0,
        transform: 'translateY(24px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        backgroundColor: '#E9EDEB',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 sm:mb-10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#345457' }}>Novedades</h2>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border"
              style={{ color: '#C8A86B', borderColor: '#C8A86B' }}
            >
              Últimos 7 días
            </span>
          </div>
          <Link href="/catalogo?novedades=1" className="text-sm text-gray-400 hover:text-[#345457] transition-colors duration-300 whitespace-nowrap">
            Ver todas →
          </Link>
        </div>
        <BookCarousel books={books} loading={loading} />
      </div>
    </section>
  );
}

// ─── All Books ────────────────────────────────────────────────────────────────

function AllBooks({ books, loading }: { books: Book[]; loading: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  return (
    <section
      ref={ref}
      className="py-9 sm:py-12 bg-[#F2ECE3]"
      style={{ opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-8 sm:mb-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#345457' }}>Catálogo destacado</h2>
            <p className="text-[13px] sm:text-[14px] text-gray-500 mt-1.5">Una selección especial de nuestros títulos más elegidos.</p>
          </div>
          <Link href="/catalogo" className="text-sm text-gray-400 hover:text-[#345457] transition-colors duration-300 whitespace-nowrap mt-1">
            Ver catálogo completo →
          </Link>
        </div>
        <BookCarousel books={books} loading={loading} />
      </div>
    </section>
  );
}

// ─── Benefits ─────────────────────────────────────────────────────────────────

function Benefits() {
  return (
    <section className="py-10 sm:py-12" style={{ backgroundColor: '#345457' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {BENEFITS.map((b, i) => {
            const Icon = b.Icon;
            return (
              <div
                key={i}
                className={`flex items-center gap-4 text-white ${i > 0 ? 'sm:border-t-0 lg:border-l lg:border-white/10 lg:pl-6' : ''}`}
              >
                <div className="shrink-0 opacity-90">
                  <Icon />
                </div>
                <div>
                  <p className="font-semibold text-[13px]">{b.title}</p>
                  <p className="text-[12px]" style={{ color: '#D7E1DE' }}>{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Featured Authors ─────────────────────────────────────────────────────────

function FeaturedAuthors({ authors, loading }: { authors: Author[]; loading: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useFadeUp(ref);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' });
  };

  return (
    <section
      ref={ref}
      className="py-12 sm:py-16 bg-white"
      style={{ opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#345457' }}>Autores destacados</h2>
          <Link href="/autores" className="text-sm text-gray-400 hover:text-[#345457] transition-colors duration-300 whitespace-nowrap">
            Ver todos →
          </Link>
        </div>

        <div className="relative">
          <button onClick={() => scroll('left')} className="hidden sm:flex absolute -left-4 top-[45%] -translate-y-1/2 z-10 w-9 h-9 bg-[#FCFBF8] rounded-full shadow-md items-center justify-center text-gray-500 hover:text-[#345457] transition-colors duration-300 border border-gray-100 cursor-pointer">
            <ChevronLeftIcon />
          </button>

          <div ref={scrollRef} className="flex gap-6 sm:gap-10 overflow-x-auto scrollbar-hide pb-2 px-1">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 flex-shrink-0 animate-pulse">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gray-200" />
                    <div className="space-y-1.5">
                      <div className="h-2.5 bg-gray-200 rounded w-16" />
                      <div className="h-2 bg-gray-100 rounded w-12 mx-auto" />
                    </div>
                  </div>
                ))
              : authors.map(author => (
                  <Link
                    key={author.id}
                    href={`/catalogo?autor=${encodeURIComponent(author.name)}`}
                    className="flex flex-col items-center gap-3 flex-shrink-0 cursor-pointer group"
                  >
                    <div
                      className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden group-hover:ring-2 group-hover:ring-offset-2 transition-all duration-300 group-hover:scale-105"
                      style={{ ringColor: '#C8A86B' } as React.CSSProperties}
                    >
                      {author.photo_url ? (
                        <img src={author.photo_url} alt={author.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: '#345457' }}>
                          {author.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-[12px] font-semibold leading-tight transition-colors duration-300" style={{ color: '#1E3134' }}>
                        <span className="group-hover:text-[#C8A86B] transition-colors duration-300">{author.name}</span>
                      </p>
                      {author.nationality && (
                        <p className="text-[11px] text-gray-400 mt-0.5">{author.nationality}</p>
                      )}
                    </div>
                  </Link>
                ))
            }
          </div>

          <button onClick={() => scroll('right')} className="hidden sm:flex absolute -right-4 top-[45%] -translate-y-1/2 z-10 w-9 h-9 bg-[#FCFBF8] rounded-full shadow-md items-center justify-center text-gray-500 hover:text-[#345457] transition-colors duration-300 border border-gray-100 cursor-pointer">
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── About Marli ──────────────────────────────────────────────────────────────

function IconHeartOutline() {
  return (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}
function IconBookOpenOutline() {
  return (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}
function IconUsersOutline() {
  return (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}
function IconCompassOutline() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12Z" />
    </svg>
  );
}

const ABOUT_PILLARS = [
  { Icon: IconHeartOutline, label: 'Pasión\npor los libros' },
  { Icon: IconBookOpenOutline, label: 'Lecturas que\ntransforman' },
  { Icon: IconUsersOutline, label: 'Comunidad que\nacompaña' },
];

function AboutMarli() {
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  return (
    <section
      ref={ref}
      className="py-16 sm:py-24"
      style={{
        opacity: 0,
        transform: 'translateY(24px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        background: '#EFE7DB',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-start">

          {/* ── Columna izquierda: foto + pilares ── */}
          <div className="flex flex-col gap-8">
            <div className="flex justify-center" style={{ backgroundColor: '#EFE7DB' }}>
              <Image
                src="/marli-sin-fondo.png"
                alt="Marli"
                width={460}
                height={460}
                className="w-full object-contain"
                style={{ height: 'auto' }}
              />
            </div>

            {/* 3 pillar cards */}
            <div className="grid grid-cols-3 gap-3">
              {ABOUT_PILLARS.map(({ Icon, label }) => (
                <div
                  key={label}
                  className="bg-[#FCFBF8] rounded-2xl py-4 px-2 flex flex-col items-center text-center gap-2 shadow-sm"
                >
                  <span style={{ color: '#C8A86B' }}><Icon /></span>
                  <span className="text-[11px] text-gray-500 leading-tight whitespace-pre-line">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Columna derecha: texto ── */}
          <div className="relative">
            {/* Sparkles decorativos */}
            <svg width="18" height="18" viewBox="0 0 16 16" fill="#C8A86B" className="absolute -top-2 right-10 opacity-70">
              <path d="M8 0L9.2 6.8L16 8L9.2 9.2L8 16L6.8 9.2L0 8L6.8 6.8Z" />
            </svg>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="#C8A86B" className="absolute top-6 right-2 opacity-50">
              <path d="M8 0L9.2 6.8L16 8L9.2 9.2L8 16L6.8 9.2L0 8L6.8 6.8Z" />
            </svg>

            {/* Badge */}
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest px-4 py-1.5 rounded-full border uppercase mb-5"
              style={{ color: '#C8A86B', borderColor: '#C8A86B' }}
            >
              ✦ Sobre Marli
            </span>

            {/* Título */}
            <h2
              className="text-3xl sm:text-4xl font-bold leading-tight mb-3"
              style={{ color: '#1E3134', fontFamily: 'var(--font-playfair)' }}
            >
              Más que libros,<br />un camino compartido
            </h2>
            {/* Línea dorada bajo el título */}
            <div
              style={{
                width: '110px', height: '3px', borderRadius: '2px',
                background: 'linear-gradient(to right, #C8A86B, rgba(200,168,107,0.1))',
                marginBottom: '28px',
              }}
            />

            <p className="text-gray-600 text-[15px] leading-relaxed mb-4">
              Marlilibros es el reflejo de mi viaje personal. A lo largo de los años, descubrí en la lectura una forma de transformar mi vida y, hoy, mi mayor deseo es compartir ese legado contigo.
            </p>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-4">
              Entiendo la selección de cada libro como un acto de cuidado: elijo títulos que invitan a mirar hacia adentro y que actúan como faros en momentos de búsqueda. Marlilibros es mi manera de sembrar luz y construir una comunidad donde cada lectura sea una oportunidad de crecimiento.
            </p>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-4">
              Te invito a recorrer este espacio como lo que es: un lugar donde las palabras se convierten en herramientas para sanar y evolucionar.
            </p>

            {/* CTA box */}
            <Link
              href="/catalogo"
              className="flex items-center gap-4 bg-[#FCFBF8] rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div
                className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center border-2"
                style={{ borderColor: '#1E3134', color: '#1E3134' }}
              >
                <IconCompassOutline />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px]" style={{ color: '#1E3134' }}>
                  ¿Qué libro te está buscando hoy?
                </p>
                <p className="text-[12px] text-gray-400">Quizás ya esté aquí, esperándote.</p>
              </div>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: '#C8A86B', flexShrink: 0 }}>
                <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4.167 10h11.666M10 4.167 15.833 10 10 15.833" />
              </svg>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { novedades, featuredBooks, totalBooks, categoryCounts, loading: storeLoading } = useStore();
  const { authors, loading: authorsLoading } = useAuthors();
  const loading = storeLoading || authorsLoading;

  return (
    <main style={{ backgroundColor: '#F7F6F2' }}>
      <Navbar />
      <Hero bookCount={totalBooks} hasNovedades={novedades.length > 0} />
      <Categories categoryCounts={categoryCounts} />
      <Novedades books={novedades} loading={loading} />
      <AllBooks books={featuredBooks} loading={loading} />
      <Benefits />
      <FeaturedAuthors authors={authors} loading={loading} />
      <AboutMarli />
      <Footer />
    </main>
  );
}
