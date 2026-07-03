'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { convertImageToWebp } from '@/lib/image-conversion';
import {
  useAdminExpenses,
  type AdminExpense,
  type ExpenseStats,
  type FetchExpensesParams,
  type SaveExpenseInput,
} from '@/contexts/AdminExpensesContext';

// ─── Brand ────────────────────────────────────────────────────────────────────
const BRAND = '#345457';

// ─── Constants ────────────────────────────────────────────────────────────────
type CategoryMeta = { slug: string; name: string; icon: string; color: string };

const CATEGORIES: CategoryMeta[] = [
  { slug: 'libros',       name: 'Libros y stock',  icon: '📦', color: '#4A7C59' },
  { slug: 'envios',       name: 'Envíos',          icon: '🚚', color: '#5B8DB8' },
  { slug: 'publicidad',   name: 'Publicidad',      icon: '📣', color: '#C8A86B' },
  { slug: 'servicios',    name: 'Servicios',       icon: '⚙️',  color: '#7A6BAB' },
  { slug: 'equipamiento', name: 'Equipamiento',    icon: '🖥️',  color: '#4A9B8E' },
  { slug: 'papeleria',    name: 'Papelería',       icon: '📋', color: '#8B7355' },
  { slug: 'impuestos',    name: 'Impuestos',       icon: '🧾', color: '#B85C5C' },
  { slug: 'sueldos',      name: 'Sueldos',         icon: '👤', color: '#345457' },
  { slug: 'alquiler',     name: 'Alquiler',        icon: '🏠', color: '#9B8A5A' },
  { slug: 'otros',        name: 'Otros',           icon: '❓', color: '#9AA6A4' },
];

const PAYMENT_METHODS = [
  { slug: 'Transferencia', label: 'Transferencia', icon: '🏦' },
  { slug: 'Tarjeta',       label: 'Tarjeta',       icon: '💳' },
  { slug: 'Efectivo',      label: 'Efectivo',      icon: '💵' },
  { slug: 'MercadoPago',   label: 'MercadoPago',   icon: '📱' },
  { slug: 'Otro',          label: 'Otro',          icon: '❓' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(n: number, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  }).format(n);
}

function formatDate(s: string) {
  const d    = new Date(s + 'T12:00:00');
  const now  = new Date();
  const diff = Math.round((now.setHours(0,0,0,0), Date.now()) - new Date(s).setHours(0,0,0,0)) / 86400000;
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return d.toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

function todayStr()     { return new Date().toISOString().slice(0, 10); }
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function getCategoryMeta(slug?: string | null): CategoryMeta {
  return CATEGORIES.find(c => c.slug === slug) ?? CATEGORIES[CATEGORIES.length - 1];
}

function formatAmountDisplay(n: number): string {
  return new Intl.NumberFormat('es-AR').format(n);
}

function parseAmount(s: string): number {
  return Number(s.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastItem = { id: string; msg: string; type: 'success' | 'error' };

function ToastList({ toasts, remove }: { toasts: ToastItem[]; remove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg"
          style={{ background: t.type === 'success' ? BRAND : '#B85C5C', animation: 'slideRight 180ms ease' }}
        >
          <span>{t.type === 'success' ? '✓' : '⚠'}</span>
          <span>{t.msg}</span>
          <button type="button" onClick={() => remove(t.id)} className="ml-1 opacity-60 hover:opacity-100 cursor-pointer leading-none">×</button>
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 animate-pulse border-l-2 border-gray-100">
      <div className="w-2.5 h-2.5 rounded-full bg-gray-200 shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-3.5 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-16 shrink-0" />
      <div className="h-5 bg-gray-100 rounded-full w-20 shrink-0" />
      <div className="w-4 h-4 bg-gray-100 rounded shrink-0" />
      <div className="h-4 bg-gray-200 rounded w-20 shrink-0 text-right" />
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
const MONTH_NAMES: Record<string, string> = {
  '01':'Ene','02':'Feb','03':'Mar','04':'Abr','05':'May','06':'Jun',
  '07':'Jul','08':'Ago','09':'Sep','10':'Oct','11':'Nov','12':'Dic',
};

function BarChart({ data }: { data: { month: string; total: number }[] }) {
  const max = Math.max(...data.map(d => d.total), 1);
  const now = new Date().toISOString().slice(0, 7);

  return (
    <div className="flex items-end gap-2" style={{ height: '96px' }}>
      {data.map(({ month, total }) => {
        const pct       = Math.max((total / max) * 100, total > 0 ? 5 : 1);
        const isCurrent = month === now;
        const mm        = month.slice(5);
        return (
          <div key={month} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="w-full flex items-end justify-center" style={{ height: '76px' }}>
              <div
                className="w-full rounded-t-md transition-all duration-500 relative"
                style={{ height: `${pct}%`, background: isCurrent ? BRAND : '#9AA6A4', opacity: isCurrent ? 1 : 0.4 }}
              >
                {total > 0 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {formatPrice(total)}
                  </div>
                )}
              </div>
            </div>
            <span className="text-[10px] text-gray-400">{MONTH_NAMES[mm] ?? mm}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({
  label, value, sub, subColor, onClick,
}: { label: string; value: string; sub?: string; subColor?: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col gap-0.5 rounded-xl bg-white px-4 py-3 text-left transition-all duration-150 ${onClick ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}`}
      style={{ boxShadow: '0 2px 12px rgba(52,84,87,0.06)' }}
    >
      <span className="text-[11px] font-medium text-gray-400">{label}</span>
      <span className="text-base font-bold" style={{ color: BRAND }}>{value}</span>
      {sub && <span className="text-[11px] font-medium" style={{ color: subColor ?? '#9AA6A4' }}>{sub}</span>}
    </button>
  );
}

// ─── Delete Popover ───────────────────────────────────────────────────────────
function DeletePopover({
  onConfirm, onCancel, loading,
}: { onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onCancel(); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onCancel]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-8 z-30 w-56 rounded-xl bg-white p-3"
      style={{ boxShadow: '0 8px 32px rgba(52,84,87,0.14)', border: '1px solid #F3F4F6' }}
    >
      <p className="text-sm font-semibold text-gray-800 mb-1">¿Eliminar este gasto?</p>
      <p className="text-[11px] text-gray-400 mb-3">Esta acción no se puede deshacer.</p>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} disabled={loading}
          className="flex-1 rounded-lg py-1.5 text-xs font-semibold text-white disabled:opacity-60 cursor-pointer hover:opacity-90 transition-opacity"
          style={{ background: '#B85C5C' }}>
          {loading ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>
    </div>
  );
}

// ─── Tags Input ───────────────────────────────────────────────────────────────
function TagsInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  function add() {
    const val = input.trim().toLowerCase();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput('');
  }
  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(t => (
            <span key={t} className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white" style={{ background: BRAND }}>
              {t}
              <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} className="opacity-70 hover:opacity-100 cursor-pointer leading-none">×</button>
            </span>
          ))}
        </div>
      )}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        placeholder="Escribí y presioná Enter para agregar"
        className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm outline-none transition-all focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]"
      />
    </div>
  );
}

// ─── Receipt Zone ─────────────────────────────────────────────────────────────
type ReceiptZoneProps = {
  url: string | null;
  file: File | null;
  preview: string | null;
  uploading: boolean;
  dragOver: boolean;
  onFile: (f: File) => void;
  onRemove: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
};

function ReceiptZone({ url, file, preview, uploading, dragOver, onFile, onRemove, onDragOver, onDragLeave, onDrop }: ReceiptZoneProps) {
  const ref = useRef<HTMLInputElement>(null);

  if (uploading) return (
    <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-gray-200">
      <div className="flex flex-col items-center gap-2">
        <div className="w-5 h-5 border-2 border-[#345457] border-t-transparent rounded-full animate-spin" />
        <span className="text-[11px] text-gray-400">Subiendo comprobante…</span>
      </div>
    </div>
  );

  if (url || file) {
    const isImage = preview || (url && /\.(jpg|jpeg|png|webp)$/i.test(url));
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-gray-50">
          {isImage && preview
            ? <img src={preview} alt="comprobante" className="w-full h-full object-cover" />
            : <span className="text-xl">{url && /\.pdf$/i.test(url) ? '📄' : '📎'}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{file?.name ?? 'Comprobante adjunto'}</p>
          {file && <p className="text-[11px] text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-medium hover:underline" style={{ color: BRAND }}>Ver</a>}
          <button type="button" onClick={onRemove} className="text-[11px] font-medium text-red-400 hover:text-red-600 transition-colors cursor-pointer">Quitar</button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
      onClick={() => ref.current?.click()}
      className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed transition-all duration-200"
      style={{ borderColor: dragOver ? BRAND : '#D1D5DB', background: dragOver ? 'rgba(52,84,87,0.03)' : 'transparent' }}
    >
      <span className="text-2xl">📎</span>
      <p className="text-[12px] text-gray-400 text-center px-4">
        Arrastrá o <span className="font-medium" style={{ color: BRAND }}>hacé click</span> para adjuntar
      </p>
      <p className="text-[10px] text-gray-300">JPG, PNG, PDF · Máx. 10 MB</p>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden"
        onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]); }} />
    </div>
  );
}

// ─── Expense Drawer ───────────────────────────────────────────────────────────
type DrawerMode = 'new' | 'edit';

type DrawerForm = {
  description: string;
  amountStr:   string;
  category:    string;
  supplier:    string;
  payment:     string;
  date:        string;
  invoice:     string;
  notes:       string;
  tags:        string[];
  currency:    string;
  receiptUrl:  string | null;
  receiptFile: File | null;
  receiptPreview: string | null;
};

function emptyForm(): DrawerForm {
  return {
    description: '', amountStr: '', category: '', supplier: '',
    payment: 'Transferencia', date: todayStr(), invoice: '',
    notes: '', tags: [], currency: 'ARS',
    receiptUrl: null, receiptFile: null, receiptPreview: null,
  };
}

function formFromExpense(e: AdminExpense): DrawerForm {
  return {
    description:    e.description,
    amountStr:      e.amount > 0 ? formatAmountDisplay(Math.round(e.amount)) : '',
    category:       e.category       ?? '',
    supplier:       e.supplier       ?? '',
    payment:        e.payment_method ?? 'Transferencia',
    date:           e.expense_date,
    invoice:        e.invoice_number ?? '',
    notes:          e.notes          ?? '',
    tags:           e.tags           ?? [],
    currency:       e.currency       ?? 'ARS',
    receiptUrl:     e.receipt_url    ?? null,
    receiptFile:    null,
    receiptPreview: null,
  };
}

function ExpenseDrawer({
  open, mode, expense, suppliers, onClose, onSaved,
}: {
  open: boolean;
  mode: DrawerMode;
  expense: AdminExpense | null;
  suppliers: string[];
  onClose: () => void;
  onSaved: (expense: AdminExpense, mode: DrawerMode) => void;
}) {
  const { saveExpense } = useAdminExpenses();

  const [form,       setForm]       = useState<DrawerForm>(emptyForm);
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [dragOver,   setDragOver]   = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSugg,  setShowSugg]   = useState(false);
  const [extraOpen, setExtraOpen]  = useState(false);
  const [notesOpen, setNotesOpen]  = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setForm(expense ? formFromExpense(expense) : emptyForm());
    setErrors({});
    setExtraOpen(false);
    setNotesOpen(false);
    const t = setTimeout(() => firstRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open, expense]);

  useEffect(() => {
    if (!open) return;
    function h(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  function patch(u: Partial<DrawerForm>) { setForm(f => ({ ...f, ...u })); }

  function filterSuppliers(val: string) {
    if (!val.trim()) { setSuggestions([]); setShowSugg(false); return; }
    const m = suppliers.filter(s => s.toLowerCase().includes(val.toLowerCase())).slice(0, 6);
    setSuggestions(m);
    setShowSugg(m.length > 0);
  }

  async function handleFile(file: File) {
    setUploading(true);
    try {
      let toUpload: File = file;
      let preview: string | null = null;

      if (file.type.startsWith('image/')) {
        const webp = await convertImageToWebp(file, { maxWidth: 1200, quality: 0.85 });
        toUpload = new File([webp], 'receipt.webp', { type: 'image/webp' });
        preview  = URL.createObjectURL(webp);
      }

      const fd = new FormData();
      fd.append('file', toUpload, toUpload.name);
      const res  = await fetch('/api/admin/upload-receipt', { method: 'POST', body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Error al subir');
      patch({ receiptUrl: data.url ?? null, receiptFile: file, receiptPreview: preview });
    } catch (err) {
      setErrors(prev => ({ ...prev, receipt: err instanceof Error ? err.message : 'Error al subir el comprobante.' }));
    } finally {
      setUploading(false);
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.description.trim()) e.description = 'La descripción es obligatoria.';
    if (!parseAmount(form.amountStr)) e.amount = 'Ingresá un monto válido mayor a 0.';
    if (!form.date) e.date = 'La fecha es obligatoria.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      const input: SaveExpenseInput = {
        description:    form.description.trim(),
        amount:         parseAmount(form.amountStr),
        expense_date:   form.date,
        category:       form.category  || null,
        supplier:       form.supplier.trim()  || null,
        payment_method: form.payment   || null,
        invoice_number: form.invoice.trim()   || null,
        notes:          form.notes.trim()     || null,
        tags:           form.tags,
        receipt_url:    form.receiptUrl,
        currency:       form.currency,
      };
      const result = await saveExpense(input, expense?.id);
      if (!result.ok) { setErrors({ global: result.error ?? 'No se pudo guardar.' }); return; }
      onSaved(result.expense!, mode);
      onClose();
    } catch {
      setErrors({ global: 'Ocurrió un error inesperado.' });
    } finally {
      setSubmitting(false);
    }
  }

  const ic = (field: string) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all duration-200 bg-white ${
      errors[field]
        ? 'border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(184,92,92,0.10)]'
        : 'border-gray-200 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]'
    }`;

  function Err({ field }: { field: string }) {
    return errors[field]
      ? <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1"><span>⚠</span>{errors[field]}</p>
      : null;
  }
  function Lbl({ text, req }: { text: string; req?: boolean }) {
    return (
      <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
        {text}{req && <span className="text-red-400 ml-0.5">*</span>}
      </label>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] transition-opacity duration-200"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 z-50 h-full w-full max-w-[480px] bg-white flex flex-col"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 210ms cubic-bezier(0.25,0,0,1)',
          boxShadow: '-8px 0 40px rgba(52,84,87,0.12)',
        }}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold" style={{ color: BRAND, fontFamily: 'var(--font-playfair)' }}>
              {mode === 'new' ? 'Nuevo gasto' : 'Editar gasto'}
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Los campos con * son obligatorios</p>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer text-xl leading-none">
            ×
          </button>
        </div>

        {/* Body + Footer inside a flex column */}
        <form
          className="flex-1 flex flex-col overflow-hidden"
          onSubmit={e => { e.preventDefault(); void submit(); }}
        >
          {/* Scrollable fields */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Description */}
            <div>
              <Lbl text="Descripción" req />
              <input ref={firstRef} value={form.description}
                onChange={e => patch({ description: e.target.value })}
                placeholder="Ej: Compra de stock a Editorial Siglo XXI"
                className={ic('description')} />
              <Err field="description" />
            </div>

            {/* Amount + Currency */}
            <div>
              <Lbl text="Monto" req />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium pointer-events-none">$</span>
                  <input
                    value={form.amountStr}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '');
                      patch({ amountStr: raw ? formatAmountDisplay(Number(raw)) : '' });
                    }}
                    placeholder="0"
                    inputMode="numeric"
                    className={`${ic('amount')} pl-7`}
                  />
                </div>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden shrink-0">
                  {['ARS', 'USD'].map(c => (
                    <button key={c} type="button" onClick={() => patch({ currency: c })}
                      className="px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
                      style={{ background: form.currency === c ? BRAND : 'white', color: form.currency === c ? 'white' : '#6B7280' }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <Err field="amount" />
            </div>

            {/* Date */}
            <div>
              <Lbl text="Fecha" req />
              <div className="flex gap-2 mb-2">
                {([['Hoy', todayStr()], ['Ayer', yesterdayStr()]] as [string, string][]).map(([label, val]) => (
                  <button key={label} type="button" onClick={() => patch({ date: val })}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                    style={{
                      borderColor: form.date === val ? BRAND : '#E5E7EB',
                      color: form.date === val ? BRAND : '#6B7280',
                      background: form.date === val ? 'rgba(52,84,87,0.05)' : 'white',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
              <input type="date" value={form.date} onChange={e => patch({ date: e.target.value })} className={ic('date')} />
              <Err field="date" />
            </div>

            {/* Category */}
            <div>
              <Lbl text="Categoría" />
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORIES.map(cat => (
                  <button key={cat.slug} type="button"
                    onClick={() => patch({ category: form.category === cat.slug ? '' : cat.slug })}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all duration-150 cursor-pointer"
                    style={{
                      borderColor: form.category === cat.slug ? cat.color : '#E5E7EB',
                      background:  form.category === cat.slug ? `${cat.color}14` : 'white',
                    }}>
                    <span className="text-sm leading-none">{cat.icon}</span>
                    <span className="text-[12px] font-medium text-gray-700 truncate">{cat.name}</span>
                    {form.category === cat.slug && (
                      <span className="ml-auto text-[10px] font-bold shrink-0" style={{ color: cat.color }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Proveedor + Método + Factura (collapsible) */}
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              <button type="button" onClick={() => setExtraOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer">
                <span className="text-sm font-semibold text-gray-700">Proveedor y método de pago</span>
                <span className="text-gray-400 text-sm" style={{ display: 'inline-block', transform: extraOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>▾</span>
              </button>
              {extraOpen && (
                <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-50">
                  {/* Supplier */}
                  <div className="relative">
                    <Lbl text="Proveedor" />
                    <input value={form.supplier}
                      onChange={e => { patch({ supplier: e.target.value }); filterSuppliers(e.target.value); }}
                      onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                      placeholder="Ej: Editorial Planeta"
                      className={ic('supplier')} />
                    {showSugg && (
                      <div className="absolute z-10 left-0 right-0 top-full mt-1 rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden">
                        {suggestions.map(s => (
                          <button key={s} type="button"
                            onMouseDown={() => { patch({ supplier: s }); setShowSugg(false); }}
                            className="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors cursor-pointer">
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payment */}
                  <div>
                    <Lbl text="Método de pago" />
                    <div className="flex flex-wrap gap-2">
                      {PAYMENT_METHODS.map(pm => (
                        <button key={pm.slug} type="button" onClick={() => patch({ payment: pm.slug })}
                          className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
                          style={{
                            borderColor: form.payment === pm.slug ? BRAND : '#E5E7EB',
                            background:  form.payment === pm.slug ? BRAND : 'white',
                            color:       form.payment === pm.slug ? 'white' : '#6B7280',
                          }}>
                          {pm.icon} {pm.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Invoice */}
                  <div>
                    <Lbl text="Nro. de factura / referencia" />
                    <input value={form.invoice} onChange={e => patch({ invoice: e.target.value })}
                      placeholder="Ej: FC-00123" className={ic('invoice')} />
                  </div>
                </div>
              )}
            </div>

            {/* Receipt */}
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Comprobante</span>
                {form.receiptUrl && <span className="text-[11px] font-medium text-green-600">✓ Adjunto</span>}
              </div>
              <div className="px-4 pb-4">
                <ReceiptZone
                  url={form.receiptUrl} file={form.receiptFile} preview={form.receiptPreview}
                  uploading={uploading} dragOver={dragOver}
                  onFile={handleFile}
                  onRemove={() => patch({ receiptUrl: null, receiptFile: null, receiptPreview: null })}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                />
                <Err field="receipt" />
              </div>
            </div>

            {/* Notes + Tags (collapsible) */}
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              <button type="button" onClick={() => setNotesOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer">
                <span className="text-sm font-semibold text-gray-700">Notas y etiquetas</span>
                <span className="text-gray-400 text-sm" style={{ display: 'inline-block', transform: notesOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>▾</span>
              </button>
              {notesOpen && (
                <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-50">
                  <div>
                    <Lbl text="Notas internas" />
                    <textarea value={form.notes} onChange={e => patch({ notes: e.target.value })}
                      placeholder="Observaciones sobre este gasto…" rows={3}
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all resize-none bg-white focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]" />
                  </div>
                  <div>
                    <Lbl text="Etiquetas" />
                    <TagsInput tags={form.tags} onChange={t => patch({ tags: t })} />
                  </div>
                </div>
              )}
            </div>

            {errors.global && (
              <p className="text-sm text-red-500 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3">
                <span>⚠</span>{errors.global}
              </p>
            )}
          </div>

          {/* Sticky footer inside form */}
          <div className="shrink-0 px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-white">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={submitting || uploading}
              className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60 cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: BRAND }}>
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Guardando…</span></>
                : <span>{mode === 'new' ? '● Registrar gasto' : '● Guardar cambios'}</span>
              }
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Expense Row ──────────────────────────────────────────────────────────────
function ExpenseRow({
  expense, deleting, onEdit, onDelete, onDuplicate,
}: {
  expense: AdminExpense;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [showDel, setShowDel] = useState(false);
  const meta = getCategoryMeta(expense.category);
  const pm   = PAYMENT_METHODS.find(p => p.slug === expense.payment_method);

  return (
    <div
      className="relative flex items-center gap-4 px-5 py-4 hover:bg-[#F7F6F2] transition-colors duration-120 group"
      style={{ borderLeft: `2px solid ${meta.color}` }}
    >
      {/* Category dot */}
      <div className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-150 group-hover:scale-125" style={{ background: meta.color }} title={meta.name} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{expense.description}</p>
        <p className="text-[12px] text-gray-400 mt-0.5 truncate">
          {expense.supplier && <span className="mr-1">{expense.supplier} ·</span>}
          <span>{formatDate(expense.expense_date)}</span>
          {expense.invoice_number && <span className="ml-1">· {expense.invoice_number}</span>}
        </p>
      </div>

      {/* Payment */}
      {pm && (
        <span className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
          {pm.icon} {pm.label}
        </span>
      )}

      {/* Receipt indicator */}
      <span className={`text-sm shrink-0 transition-opacity ${expense.receipt_url ? 'opacity-80' : 'opacity-15'}`} title={expense.receipt_url ? 'Con comprobante' : 'Sin comprobante'}>
        📎
      </span>

      {/* Amount */}
      <span className="text-sm font-bold shrink-0 text-gray-900">
        {formatPrice(expense.amount, expense.currency ?? 'ARS')}
      </span>

      {/* Mobile: always-visible edit button */}
      <button type="button" onClick={onEdit}
        className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 active:text-[#345457] transition-colors shrink-0 text-sm"
        aria-label="Editar">
        ✏️
      </button>

      {/* Desktop: hover actions */}
      <div className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
        <button type="button" onClick={onEdit} title="Editar"
          className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-[#345457] transition-colors cursor-pointer text-sm">✏️</button>
        <button type="button" onClick={onDuplicate} title="Duplicar"
          className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-[#345457] transition-colors cursor-pointer text-sm">📋</button>
        <div className="relative">
          <button type="button" onClick={() => setShowDel(true)} title="Eliminar"
            className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-red-400 transition-colors cursor-pointer text-sm">🗑️</button>
          {showDel && (
            <DeletePopover
              onConfirm={onDelete}
              onCancel={() => setShowDel(false)}
              loading={deleting}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ type, onNew }: { type: 'none' | 'search' | 'filter'; onNew: () => void }) {
  if (type === 'none') return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="text-5xl mb-4">💰</div>
      <h3 className="text-base font-bold text-gray-700 mb-2">Empezá a registrar tus gastos</h3>
      <p className="text-sm text-gray-400 max-w-xs mb-6">
        Llevá el control por categoría, proveedor y método de pago. Adjuntá comprobantes y exportá tu historial cuando lo necesites.
      </p>
      <button type="button" onClick={onNew}
        className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
        style={{ background: BRAND }}>
        Registrar mi primer gasto
      </button>
    </div>
  );
  if (type === 'search') return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">🔍</div>
      <p className="text-sm font-semibold text-gray-700 mb-1">Sin resultados para esta búsqueda</p>
      <p className="text-xs text-gray-400">Probá con otra descripción, proveedor o categoría</p>
    </div>
  );
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">🗂️</div>
      <p className="text-sm font-semibold text-gray-700 mb-1">Sin resultados para estos filtros</p>
      <p className="text-xs text-gray-400">Probá removiendo algún filtro o cambiando el rango de fechas</p>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export function ExpensesPanel() {
  const { getExpenses, getStats, getSuppliers, deleteExpense, duplicateExpense } = useAdminExpenses();

  const [expenses,    setExpenses]    = useState<AdminExpense[]>([]);
  const [total,       setTotal]       = useState(0);
  const [stats,       setStats]       = useState<ExpenseStats | null>(null);
  const [suppliers,   setSuppliers]   = useState<string[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [search,        setSearch]        = useState('');
  const [debSearch,     setDebSearch]     = useState('');
  const [filterCat,     setFilterCat]     = useState('');
  const [filterPay,     setFilterPay]     = useState('');
  const [filterReceipt, setFilterReceipt] = useState<'' | 'with' | 'without'>('');
  const [dateFrom,      setDateFrom]      = useState('');
  const [dateTo,        setDateTo]        = useState('');
  const [sort,          setSort]          = useState('expense_date');
  const [order,         setOrder]         = useState<'asc' | 'desc'>('desc');

  // UI state
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [drawerMode,    setDrawerMode]    = useState<DrawerMode>('new');
  const [drawerExpense, setDrawerExpense] = useState<AdminExpense | null>(null);
  const [deletingId,    setDeletingId]    = useState<string | null>(null);
  const [toasts,        setToasts]        = useState<ToastItem[]>([]);
  const [chartOpen,     setChartOpen]     = useState(true);

  const LIMIT = 40;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const buildParams = useCallback((offset = 0): FetchExpensesParams => ({
    search:   debSearch   || undefined,
    category: filterCat   || undefined,
    payment:  filterPay   || undefined,
    receipt:  filterReceipt || undefined,
    dateFrom: dateFrom    || undefined,
    dateTo:   dateTo      || undefined,
    sort, order, limit: LIMIT, offset,
  }), [debSearch, filterCat, filterPay, filterReceipt, dateFrom, dateTo, sort, order]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [res, statsData] = await Promise.all([getExpenses(buildParams(0)), getStats()]);
    setExpenses(res.expenses);
    setTotal(res.total);
    setStats(statsData);
    setLoading(false);
  }, [getExpenses, getStats, buildParams]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  async function loadMore() {
    setLoadingMore(true);
    const res = await getExpenses(buildParams(expenses.length));
    setExpenses(prev => [...prev, ...res.expenses]);
    setLoadingMore(false);
  }

  function openNew() {
    if (!suppliers.length) getSuppliers().then(setSuppliers);
    setDrawerExpense(null);
    setDrawerMode('new');
    setDrawerOpen(true);
  }

  function openEdit(e: AdminExpense) {
    if (!suppliers.length) getSuppliers().then(setSuppliers);
    setDrawerExpense(e);
    setDrawerMode('edit');
    setDrawerOpen(true);
  }

  function addToast(msg: string, type: ToastItem['type'] = 'success') {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }

  function handleSaved(expense: AdminExpense, mode: DrawerMode) {
    if (mode === 'new') {
      setExpenses(prev => [expense, ...prev]);
      setTotal(t => t + 1);
      addToast(`"${expense.description}" registrado`);
    } else {
      setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
      addToast('Gasto actualizado');
    }
    getStats().then(setStats);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const ok = await deleteExpense(id);
    if (ok) {
      setExpenses(prev => prev.filter(e => e.id !== id));
      setTotal(t => t - 1);
      addToast('Gasto eliminado');
      getStats().then(setStats);
    } else {
      addToast('No se pudo eliminar', 'error');
    }
    setDeletingId(null);
  }

  async function handleDuplicate(expense: AdminExpense) {
    const result = await duplicateExpense(expense);
    if (result.ok && result.expense) {
      setExpenses(prev => [result.expense!, ...prev]);
      setTotal(t => t + 1);
      addToast(`"${result.expense!.description}" duplicado`);
      getStats().then(setStats);
    } else {
      addToast('No se pudo duplicar', 'error');
    }
  }

  function exportCSV() {
    const BOM    = '﻿';
    const header = ['Fecha','Descripción','Categoría','Proveedor','Método de pago','Nro. Factura','Monto','Moneda','Comprobante','Notas'];
    const rows   = expenses.map(e => [
      e.expense_date,
      `"${(e.description ?? '').replace(/"/g, '""')}"`,
      e.category       ?? '',
      `"${(e.supplier  ?? '').replace(/"/g, '""')}"`,
      e.payment_method ?? '',
      e.invoice_number ?? '',
      String(e.amount),
      e.currency       ?? 'ARS',
      e.receipt_url    ? 'Sí' : 'No',
      `"${(e.notes     ?? '').replace(/"/g, '""')}"`,
    ].join(','));
    const csv = BOM + [header.join(','), ...rows].join('\n');
    const a   = document.createElement('a');
    a.href    = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `gastos-${todayStr()}.csv`;
    a.click();
  }

  function clearFilters() {
    setSearch(''); setDebSearch('');
    setFilterCat(''); setFilterPay('');
    setFilterReceipt(''); setDateFrom(''); setDateTo('');
  }

  // Derived
  const hasFilters      = Boolean(debSearch || filterCat || filterPay || filterReceipt || dateFrom || dateTo);
  const activeCount     = [debSearch, filterCat, filterPay, filterReceipt, dateFrom || dateTo].filter(Boolean).length;
  const emptyType       = !loading && expenses.length === 0
    ? (debSearch ? 'search' : hasFilters ? 'filter' : 'none') as 'search' | 'filter' | 'none'
    : null;

  // Insights
  const insights: string[] = [];
  if (stats) {
    if (stats.totalLastMonth > 0) {
      const pct = Math.round(((stats.totalThisMonth - stats.totalLastMonth) / stats.totalLastMonth) * 100);
      if (pct < -5)  insights.push(`📉 Gastaste un ${Math.abs(pct)}% menos que el mes pasado`);
      if (pct > 10)  insights.push(`📈 Gastaste un ${pct}% más que el mes pasado`);
    }
    if (stats.noReceiptCount > 0)
      insights.push(`📎 ${stats.noReceiptCount} gasto${stats.noReceiptCount > 1 ? 's' : ''} sin comprobante`);
    if (stats.topCategory)
      insights.push(`💰 Mayor categoría este año: ${getCategoryMeta(stats.topCategory).icon} ${getCategoryMeta(stats.topCategory).name}`);
  }

  const showChart = Boolean(stats && stats.monthly.some(m => m.total > 0));

  return (
    <div>
      <style>{`@keyframes slideRight { from { transform: translateX(12px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

      <ToastList toasts={toasts} remove={id => setToasts(prev => prev.filter(t => t.id !== id))} />

      {/* ── Header ── */}
      <div className="mb-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND, fontFamily: 'var(--font-playfair)' }}>Gastos</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">{loading ? '—' : total > 0 ? `${total} registros` : 'Sin registros'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={exportCSV} disabled={expenses.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-white transition-colors cursor-pointer disabled:opacity-40">
              ↓ Exportar CSV
            </button>
            <button type="button" onClick={openNew}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: BRAND }}>
              + Nuevo gasto
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard
            label="Este mes"
            value={stats ? formatPrice(stats.totalThisMonth) : '—'}
            sub={stats && stats.totalLastMonth > 0 ? (() => {
              const pct = Math.round(((stats.totalThisMonth - stats.totalLastMonth) / stats.totalLastMonth) * 100);
              return `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct)}% vs. mes ant.`;
            })() : undefined}
            subColor={stats ? (stats.totalThisMonth <= stats.totalLastMonth ? '#4A7C59' : '#B85C5C') : undefined}
            onClick={() => {
              const now = new Date();
              setDateFrom(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
              setDateTo(todayStr());
            }}
          />
          <MetricCard label="Este año"        value={stats ? formatPrice(stats.totalThisYear)  : '—'} />
          <MetricCard label="Promedio mensual" value={stats ? formatPrice(stats.avgMonthly)     : '—'} />
          <MetricCard
            label="Gastos este mes"
            value={stats ? String(stats.countThisMonth) : '—'}
            sub={stats && stats.countThisMonth > 0 ? 'transacciones' : undefined}
          />
          <MetricCard
            label="Sin comprobante"
            value={stats ? String(stats.noReceiptCount) : '—'}
            sub={stats ? (stats.noReceiptCount > 0 ? 'pendientes' : 'al día ✓') : undefined}
            subColor={stats ? (stats.noReceiptCount > 0 ? '#C8A86B' : '#4A7C59') : undefined}
            onClick={stats && stats.noReceiptCount > 0 ? () => setFilterReceipt('without') : undefined}
          />
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="mb-4 rounded-2xl px-4 py-3 flex flex-wrap gap-x-6 gap-y-1"
          style={{ background: '#FFFBF0', border: '1px solid #F3E8C8' }}>
          {insights.map((s, i) => <span key={i} className="text-[12px] font-medium text-amber-800">{s}</span>)}
        </div>
      )}

      {/* Chart */}
      {showChart && (
        <div className="rounded-2xl bg-white mb-4 overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(52,84,87,0.06)' }}>
          <button type="button" onClick={() => setChartOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-sm font-semibold text-gray-700">Evolución mensual</span>
            <span className="text-gray-400 text-sm" style={{ display: 'inline-block', transform: chartOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>▾</span>
          </button>
          {chartOpen && stats && (
            <div className="px-5 pb-5">
              <BarChart data={stats.monthly} />
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="rounded-2xl bg-white mb-4 px-4 py-3 flex flex-wrap gap-2 items-center" style={{ boxShadow: '0 2px 12px rgba(52,84,87,0.06)' }}>
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar descripción, proveedor, categoría…"
            className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none transition-all focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]" />
        </div>

        {/* Category */}
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#345457] cursor-pointer bg-white">
          <option value="">Categoría</option>
          {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
        </select>

        {/* Payment */}
        <select value={filterPay} onChange={e => setFilterPay(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#345457] cursor-pointer bg-white">
          <option value="">Método de pago</option>
          {PAYMENT_METHODS.map(pm => <option key={pm.slug} value={pm.slug}>{pm.icon} {pm.label}</option>)}
        </select>

        {/* Receipt */}
        <select value={filterReceipt} onChange={e => setFilterReceipt(e.target.value as '' | 'with' | 'without')}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#345457] cursor-pointer bg-white">
          <option value="">Comprobante</option>
          <option value="with">Con comprobante</option>
          <option value="without">Sin comprobante</option>
        </select>

        {/* Sort */}
        <select value={`${sort}|${order}`}
          onChange={e => { const [s, o] = e.target.value.split('|'); setSort(s); setOrder(o as 'asc' | 'desc'); }}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#345457] cursor-pointer bg-white">
          <option value="expense_date|desc">Fecha ↓</option>
          <option value="expense_date|asc">Fecha ↑</option>
          <option value="amount|desc">Monto ↓</option>
          <option value="amount|asc">Monto ↑</option>
          <option value="category|asc">Categoría A–Z</option>
          <option value="supplier|asc">Proveedor A–Z</option>
        </select>

        {hasFilters && (
          <button type="button" onClick={clearFilters}
            className="flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity"
            style={{ borderColor: '#B85C5C', color: '#B85C5C', background: '#FFF5F5' }}>
            × Limpiar{activeCount > 1 ? ` (${activeCount})` : ''}
          </button>
        )}
      </div>

      {/* List */}
      <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(52,84,87,0.06)' }}>
        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : emptyType ? (
          <EmptyState type={emptyType} onNew={openNew} />
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {expenses.map(expense => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  deleting={deletingId === expense.id}
                  onEdit={() => openEdit(expense)}
                  onDelete={() => handleDelete(expense.id)}
                  onDuplicate={() => handleDuplicate(expense)}
                />
              ))}
            </div>
            {expenses.length < total && (
              <div className="px-5 py-4 border-t border-gray-50">
                <button type="button" onClick={() => void loadMore()} disabled={loadingMore}
                  className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60">
                  {loadingMore ? 'Cargando…' : `Cargar más (${total - expenses.length} restantes)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Drawer */}
      <ExpenseDrawer
        open={drawerOpen}
        mode={drawerMode}
        expense={drawerExpense}
        suppliers={suppliers}
        onClose={() => setDrawerOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
