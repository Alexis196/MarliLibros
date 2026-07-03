'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminStats, type TopSeller } from '@/contexts/AdminStatsContext';

const PERIODS = [
  { label: 'Esta semana', key: 'week' },
  { label: 'Este mes', key: 'month' },
  { label: 'Este año', key: 'year' },
] as const;

type PeriodKey = (typeof PERIODS)[number]['key'];

function getPeriodRange(key: PeriodKey): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (key === 'week') {
    const day = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);
    return { from: iso(monday), to: iso(sunday) };
  }
  if (key === 'month') {
    const from = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    const to = iso(new Date(now.getFullYear(), now.getMonth() + 1, 1));
    return { from, to };
  }
  // year
  return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear() + 1}-01-01` };
}

const MEDALS = ['🥇', '🥈', '🥉'];

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="w-4 h-3 rounded bg-gray-100 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="h-3 bg-gray-100 rounded w-32" />
          <div className="h-3 bg-gray-100 rounded w-6 shrink-0" />
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 w-full" />
      </div>
    </div>
  );
}

function RankedList({ title, items, loading }: { title: string; items: TopSeller[]; loading: boolean }) {
  const max = items.length > 0 ? items[0].quantity : 0;

  return (
    <div>
      <h3 className="text-sm font-bold mb-3" style={{ color: '#345457' }}>{title}</h3>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-400">Sin ventas en este período.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item, i) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-sm w-4 shrink-0 text-center">
                {i < 3 ? MEDALS[i] : <span className="text-[12px] text-gray-400">{i + 1}</span>}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[13px] text-gray-700 truncate">{item.label}</span>
                  <span className="text-[12px] font-bold shrink-0" style={{ color: '#345457' }}>
                    {item.quantity}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${max > 0 ? (item.quantity / max) * 100 : 0}%`,
                      backgroundColor: i === 0 ? '#C8A86B' : i === 1 ? '#9AB8BB' : '#C8D5D6',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TopSellersPanel() {
  const { getTopSellers } = useAdminStats();
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [result, setResult] = useState<{ categories: TopSeller[]; titles: TopSeller[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (key: PeriodKey) => {
    setLoading(true);
    setError(null);
    const { from, to } = getPeriodRange(key);
    const data = await getTopSellers(from, to);
    if (!data) {
      setError('No pudimos cargar el ranking.');
      setResult(null);
    } else {
      setResult(data);
    }
    setLoading(false);
  }, [getTopSellers]);

  useEffect(() => {
    loadData(period);
  }, [period, loadData]);

  return (
    <div className="rounded-2xl bg-white p-5 sm:p-6" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-base font-bold" style={{ color: '#345457' }}>Más vendidos</h2>
        <div className="flex items-center gap-1.5">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200"
              style={
                period === p.key
                  ? { backgroundColor: '#345457', color: '#fff' }
                  : { backgroundColor: 'transparent', color: '#9AA6A4', border: '1px solid #E5E7EB' }
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="grid sm:grid-cols-2 gap-8">
        <RankedList
          title="Por género"
          items={result?.categories ?? []}
          loading={loading}
        />
        <RankedList
          title="Por título"
          items={result?.titles ?? []}
          loading={loading}
        />
      </div>
    </div>
  );
}
