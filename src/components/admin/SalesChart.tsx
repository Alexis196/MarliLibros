'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from 'recharts';
import { useAdminStats, type MonthlyPoint, type AnnualPoint } from '@/contexts/AdminStatsContext';

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
}

function pillClass(active: boolean) {
  return `px-4 py-1.5 rounded-full text-sm font-medium border transition-colors duration-300 cursor-pointer ${
    active
      ? 'bg-[#345457] text-white border-[#345457]'
      : 'bg-white text-gray-500 border-gray-200 hover:border-[#345457]/30 hover:text-[#345457]'
  }`;
}

function tooltipFormatter(value: unknown, name: unknown) {
  const num = Number(value);
  if (name === 'Envíos') return [String(num), name as React.ReactNode] as [string, React.ReactNode];
  return [formatPrice(num), name as React.ReactNode] as [string, React.ReactNode];
}

function ChartSkeleton() {
  return (
    <div className="h-72 animate-pulse">
      <div className="flex items-end justify-around h-full gap-2 px-4 pb-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col gap-1 items-center justify-end h-full">
            <div
              className="w-full rounded-t-md bg-gray-100"
              style={{ height: `${20 + Math.random() * 60}%` }}
            />
            <div className="w-4 h-2 bg-gray-100 rounded mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SalesChart() {
  const currentYear = new Date().getFullYear();
  const { getMonthlyStats, getAnnualStats } = useAdminStats();
  const [view, setView] = useState<'mensual' | 'anual'>('mensual');
  const [year, setYear] = useState(currentYear);
  const [monthlyData, setMonthlyData] = useState<MonthlyPoint[]>([]);
  const [annualData, setAnnualData] = useState<AnnualPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (view === 'mensual') {
      getMonthlyStats(year).then(data => {
        setMonthlyData(data);
        setLoading(false);
      });
    } else {
      getAnnualStats().then(data => {
        setAnnualData(data);
        setLoading(false);
      });
    }
  }, [view, year, getMonthlyStats, getAnnualStats]);

  const allPoints = view === 'mensual' ? monthlyData : annualData;
  const hasData = allPoints.some(p => p.ventas > 0 || p.gastos > 0 || p.envios > 0);

  // For monthly view: only show months up to current month (no future empty bars)
  const filteredMonthly = view === 'mensual' && year === currentYear
    ? monthlyData.filter((_, i) => i <= new Date().getMonth())
    : monthlyData;

  const chartData =
    view === 'mensual'
      ? filteredMonthly.map(p => ({ label: MONTH_LABELS[p.month - 1], Ventas: p.ventas, Gastos: p.gastos, Envíos: p.envios }))
      : annualData.map(p => ({ label: String(p.year), Ventas: p.ventas, Gastos: p.gastos, Envíos: p.envios }));

  return (
    <div className="rounded-2xl bg-white p-5 sm:p-6" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-base font-bold" style={{ color: '#345457' }}>Ventas, gastos y envíos</h2>
        <div className="flex flex-wrap gap-2">
          {view === 'mensual' && (
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-600 outline-none focus:border-[#345457] cursor-pointer"
            >
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
          <button onClick={() => setView('mensual')} className={pillClass(view === 'mensual')}>Mensual</button>
          <button onClick={() => setView('anual')} className={pillClass(view === 'anual')}>Anual</button>
        </div>
      </div>

      {loading ? (
        <ChartSkeleton />
      ) : !hasData ? (
        <div className="h-72 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(52,84,87,0.06)' }}>
            <span className="text-lg">📊</span>
          </div>
          <p className="text-sm text-gray-400">Todavía no hay datos para este período.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F1" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9AA6A4' }} axisLine={{ stroke: '#EEF2F1' }} tickLine={false} />
            <YAxis
              yAxisId="money"
              tick={{ fontSize: 11, fill: '#9AA6A4' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => new Intl.NumberFormat('es-AR', { notation: 'compact' }).format(v)}
            />
            <YAxis yAxisId="count" orientation="right" tick={{ fontSize: 11, fill: '#9AA6A4' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip formatter={tooltipFormatter} contentStyle={{ borderRadius: 12, border: '1px solid #EEF2F1', fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="money" dataKey="Ventas" fill="#345457" radius={[6, 6, 0, 0]} />
            <Bar yAxisId="money" dataKey="Gastos" fill="#C8A86B" radius={[6, 6, 0, 0]} />
            <Line yAxisId="count" type="monotone" dataKey="Envíos" stroke="#B85C5C" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
