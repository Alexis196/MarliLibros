'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { convertImageToWebp } from '@/lib/image-conversion';
import { useAdminProducts } from '@/contexts/AdminProductsContext';

const BRAND = '#345457';
const GOLD  = '#C8A86B';

const CATEGORIES = ['Libros','Desarrollo Personal','Tarot y Oráculos','Rompecabezas','Juegos Didácticos','Agendas y Cuadernos'];
const LANGUAGES  = ['Español','Inglés','Portugués','Francés','Alemán','Italiano','Otro'];
const BINDINGS   = ['Tapa blanda','Tapa dura','Bolsillo','Espiral','Digital'];

type Book = {
  id?: string;
  title?: string;
  author_name?: string;
  publisher?: string;
  isbn?: string;
  category?: string;
  language?: string;
  price?: number;
  cost_price?: number;
  promotional_price?: number;
  stock?: number | null;
  sku?: string;
  pages?: number;
  year?: number;
  edition?: string;
  binding?: string;
  rating?: number;
  description?: string;
  cover_url?: string;
  new_until?: string;
  featured?: boolean;
  tags?: string[];
  status?: string;
};

const inputCls = 'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)] bg-white';
const errorInputCls = 'w-full rounded-xl border border-red-400 px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(184,92,92,0.10)] bg-white';

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ id, checked, onChange, label, sub }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer group">
      <div className="relative shrink-0 mt-0.5">
        <input type="checkbox" id={id} checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only" />
        <div className="w-9 h-5 rounded-full transition-colors duration-200" style={{ background: checked ? BRAND : '#D1D5DB' }} />
        <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </label>
  );
}

// ─── Field with inline error ──────────────────────────────────────────────────
function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Section({ title, children, collapsible = false, defaultOpen = true }: { title: string; children: React.ReactNode; collapsible?: boolean; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(52,84,87,0.06)' }}>
      <button type="button" onClick={() => collapsible && setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-6 py-4 border-b border-gray-100 ${collapsible ? 'cursor-pointer hover:bg-gray-50 transition-colors' : 'cursor-default'}`}>
        <h3 className="text-sm font-semibold" style={{ color: BRAND }}>{title}</h3>
        {collapsible && <span className="text-gray-400 text-sm transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>}
      </button>
      {open && <div className="px-6 py-5 space-y-4">{children}</div>}
    </div>
  );
}

// ─── Star rating ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(value === n ? 0 : n)}
          className="text-2xl leading-none transition-transform duration-100 hover:scale-110">
          <span style={{ color: n <= (hovered || value) ? GOLD : '#D1D5DB' }}>★</span>
        </button>
      ))}
      <span className="text-[12px] text-gray-400 ml-1">{value > 0 ? value.toFixed(1) : '—'}</span>
    </div>
  );
}

// ─── Tags input ───────────────────────────────────────────────────────────────
function TagsInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const t = input.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput('');
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1 text-[12px] font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(52,84,87,0.08)', color: BRAND }}>
            {t}
            <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} className="hover:opacity-70 transition-opacity">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Agregar etiqueta y presionar Enter…"
          className={inputCls} />
        <button type="button" onClick={add} className="px-4 py-2.5 rounded-xl text-sm font-medium text-white shrink-0 hover:opacity-90 transition-opacity" style={{ background: BRAND }}>+</button>
      </div>
    </div>
  );
}

// ─── Cover drop zone ──────────────────────────────────────────────────────────
function CoverZone({ preview, converting, onFile, onClear }: { preview: string; converting: boolean; onFile: (f: File) => void; onClear: () => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) onFile(file);
  };

  if (preview) return (
    <div className="relative group/cover">
      <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
        <img src={preview} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
        <button type="button" onClick={() => inputRef.current?.click()}
          className="px-4 py-2 rounded-xl bg-white text-sm font-semibold" style={{ color: BRAND }}>Cambiar imagen</button>
        <button type="button" onClick={onClear}
          className="px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium">Eliminar</button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      {converting && (
        <div className="absolute inset-0 rounded-2xl bg-white/80 flex items-center justify-center">
          <p className="text-sm font-medium" style={{ color: BRAND }}>Procesando…</p>
        </div>
      )}
    </div>
  );

  return (
    <div
      onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)}
      onDragOver={e => e.preventDefault()} onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200"
      style={{ borderColor: dragging ? BRAND : '#D1D5DB', background: dragging ? 'rgba(52,84,87,0.04)' : 'transparent' }}>
      <span className="text-5xl">{converting ? '⏳' : '📷'}</span>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-600">{converting ? 'Procesando imagen…' : 'Arrastrá una imagen aquí'}</p>
        {!converting && <p className="text-[11px] text-gray-400 mt-0.5">o hacé clic para seleccionar</p>}
      </div>
      {!converting && <p className="text-[10px] text-gray-300">Se convierte a WebP automáticamente</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </div>
  );
}

// ─── Toast notification ───────────────────────────────────────────────────────
function Toast({ message, bookId, onClose, onCreateAnother }: { message: string; bookId: string; onClose: () => void; onCreateAnother: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 6000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-4 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm animate-in slide-in-from-top-2 duration-300"
      style={{ background: '#1C2B2C', boxShadow: '0 8px 40px rgba(0,0,0,0.25)' }}>
      <span className="text-green-400 text-base">✓</span>
      <span className="font-medium">{message}</span>
      <a href={`/libro/${bookId}`} target="_blank" rel="noopener noreferrer"
        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium whitespace-nowrap">
        Ver →
      </a>
      <button onClick={onCreateAnother} className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium whitespace-nowrap">
        Crear otro
      </button>
      <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors text-lg leading-none ml-1">×</button>
    </div>
  );
}

// ─── Draft banner ─────────────────────────────────────────────────────────────
function DraftBanner({ onRestore, onDiscard }: { onRestore: () => void; onDiscard: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm mb-4" style={{ background: 'rgba(200,168,107,0.12)', color: '#9A7840' }}>
      <span>📝</span>
      <span className="flex-1 font-medium">Tenés un borrador sin guardar. ¿Recuperarlo?</span>
      <button onClick={onRestore} className="font-semibold px-3 py-1 rounded-lg bg-white hover:bg-gray-50 transition-colors border border-current/20">Recuperar</button>
      <button onClick={onDiscard} className="text-current/60 hover:text-current/90 transition-colors">Descartar</button>
    </div>
  );
}

// ─── Product preview card (right panel) ──────────────────────────────────────
function PreviewCard({ title, author, price, cover }: { title: string; author: string; price: string; cover: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      <div className="w-full aspect-[3/4] bg-gray-100">
        {cover
          ? <img src={cover} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">📚</div>
        }
      </div>
      <div className="p-4">
        <p className="text-sm font-bold text-gray-800 leading-snug">{title || 'Título del producto'}</p>
        <p className="text-[12px] text-gray-400 mt-1">{author || 'Autor'}</p>
        <p className="text-base font-bold mt-2" style={{ color: BRAND }}>{price || '$0'}</p>
      </div>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────
export function ProductForm({ initialBook }: { initialBook?: Book }) {
  const router = useRouter();
  const { invalidate } = useAdminProducts();
  const isEditing  = Boolean(initialBook?.id);
  const draftKey   = isEditing ? `product-draft-${initialBook!.id}` : 'product-draft-new';
  const nowISO     = new Date().toISOString();

  const defaultForm = {
    title:             initialBook?.title ?? '',
    author_name:       initialBook?.author_name ?? '',
    publisher:         initialBook?.publisher ?? '',
    isbn:              initialBook?.isbn ?? '',
    category:          initialBook?.category ?? CATEGORIES[0],
    language:          initialBook?.language ?? 'Español',
    price:             initialBook?.price?.toString() ?? '',
    cost_price:        initialBook?.cost_price?.toString() ?? '',
    promotional_price: initialBook?.promotional_price?.toString() ?? '',
    stock:             initialBook?.stock != null ? initialBook.stock.toString() : '',
    stockUntracked:    initialBook?.stock == null && isEditing,
    sku:               initialBook?.sku ?? '',
    pages:             initialBook?.pages?.toString() ?? '',
    year:              initialBook?.year?.toString() ?? '',
    edition:           initialBook?.edition ?? '',
    binding:           initialBook?.binding ?? '',
    rating:            initialBook?.rating ?? 0,
    description:       initialBook?.description ?? '',
    isNew:             Boolean(initialBook?.new_until && initialBook.new_until > nowISO),
    featured:          initialBook?.featured ?? false,
    tags:              initialBook?.tags ?? [] as string[],
    status:            initialBook?.status ?? 'published',
  };

  const [form, setForm]         = useState(defaultForm);
  const [coverUrl, setCoverUrl] = useState(initialBook?.cover_url ?? '');
  const [preview, setPreview]   = useState(initialBook?.cover_url ?? '');
  const [pendingImage, setPendingImage] = useState<Blob | null>(null);
  const [converting, setConverting]     = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [savingDraft, setSavingDraft]   = useState(false);
  const [importingISBN, setImportingISBN] = useState(false);
  const [errors, setErrors]   = useState<Partial<Record<keyof typeof defaultForm | 'global' | 'cover', string>>>({});
  const [toast, setToast]     = useState<{ id: string; title: string } | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [savedDraft, setSavedDraft] = useState<typeof defaultForm | null>(null);

  const up = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(prev => ({ ...prev, [k]: v }));
  const upStr = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => up(k, e.target.value as never);

  // Validate single field
  const validateField = useCallback((k: string, v: unknown): string | undefined => {
    if (k === 'title'       && !String(v).trim()) return 'El título es obligatorio';
    if (k === 'author_name' && !String(v).trim()) return 'El autor es obligatorio';
    if (k === 'price'       && (isNaN(Number(v)) || Number(v) < 0)) return 'El precio debe ser 0 o mayor';
    if (k === 'isbn' && v && !/^[\d\-]{10,17}$/.test(String(v))) return 'ISBN inválido (10 o 13 dígitos)';
    return undefined;
  }, []);

  const onBlur = (k: string, v: unknown) => {
    const err = validateField(k, v);
    setErrors(prev => ({ ...prev, [k]: err }));
  };

  // Auto-save draft
  useEffect(() => {
    if (isEditing) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify(form)); } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [form, draftKey, isEditing]);

  // Restore draft on mount (new product only)
  useEffect(() => {
    if (isEditing) return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved) as typeof defaultForm;
        if (parsed.title || parsed.author_name) {
          setSavedDraft(parsed);
          setShowDraftBanner(true);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearDraft = () => { try { localStorage.removeItem(draftKey); } catch {} };

  const handleImageFile = async (file: File) => {
    setConverting(true);
    setErrors(prev => ({ ...prev, cover: undefined }));
    try {
      const webp = await convertImageToWebp(file);
      setPendingImage(webp);
      setPreview(URL.createObjectURL(webp));
    } catch {
      setErrors(prev => ({ ...prev, cover: 'No pudimos procesar esa imagen. Probá con otra.' }));
    } finally {
      setConverting(false);
    }
  };

  const handleClearCover = () => { setPreview(''); setCoverUrl(''); setPendingImage(null); };

  const importFromISBN = async () => {
    const isbn = form.isbn.replace(/[-\s]/g, '');
    if (!isbn) { setErrors(prev => ({ ...prev, isbn: 'Ingresá un ISBN primero' })); return; }
    setImportingISBN(true);
    try {
      const res  = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
      const data = await res.json() as Record<string, Record<string, unknown>>;
      const book = data[`ISBN:${isbn}`];
      if (!book) { setErrors(prev => ({ ...prev, isbn: 'No encontramos ese ISBN en Open Library' })); return; }
      setForm(prev => ({
        ...prev,
        title:       (book.title as string) ?? prev.title,
        author_name: ((book.authors as { name: string }[])?.[0]?.name) ?? prev.author_name,
        publisher:   ((book.publishers as { name: string }[])?.[0]?.name) ?? prev.publisher,
        pages:       (book.number_of_pages as number)?.toString() ?? prev.pages,
        year:        (book.publish_date as string)?.slice(-4) ?? prev.year,
      }));
      const coverLg = (book.cover as Record<string, string>)?.large;
      if (coverLg) {
        try {
          const imgRes  = await fetch(coverLg);
          const blob    = await imgRes.blob();
          const webp    = await convertImageToWebp(new File([blob], 'cover.jpg', { type: blob.type }));
          setPendingImage(webp);
          setPreview(URL.createObjectURL(webp));
        } catch {}
      }
    } catch {
      setErrors(prev => ({ ...prev, isbn: 'Error al conectar con Open Library' }));
    } finally {
      setImportingISBN(false);
    }
  };

  const buildPayload = () => ({
    title:             form.title,
    author_name:       form.author_name,
    publisher:         form.publisher || undefined,
    isbn:              form.isbn || undefined,
    category:          form.category,
    language:          form.language || undefined,
    price:             Number(form.price),
    cost_price:        form.cost_price ? Number(form.cost_price) : undefined,
    promotional_price: form.promotional_price ? Number(form.promotional_price) : undefined,
    stock:             form.stockUntracked ? undefined : (form.stock !== '' ? Number(form.stock) : undefined),
    sku:               form.sku || undefined,
    pages:             form.pages ? Number(form.pages) : undefined,
    year:              form.year ? Number(form.year) : undefined,
    edition:           form.edition || undefined,
    binding:           form.binding || undefined,
    rating:            form.rating > 0 ? form.rating : undefined,
    description:       form.description || undefined,
    isNew:             form.isNew,
    featured:          form.featured,
    tags:              form.tags.length > 0 ? form.tags : undefined,
    status:            form.status,
  });

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.title.trim())       newErrors.title       = 'El título es obligatorio';
    if (!form.author_name.trim()) newErrors.author_name = 'El autor es obligatorio';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) newErrors.price = 'El precio debe ser 0 o mayor';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (asStatus?: string) => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      let finalCoverUrl = coverUrl;
      if (pendingImage) {
        const fd  = new FormData();
        fd.append('file', pendingImage, 'cover.webp');
        const up  = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        const upd = await up.json() as { url?: string; error?: string };
        if (!up.ok) throw new Error(upd.error ?? 'No pudimos subir la imagen.');
        finalCoverUrl = upd.url!;
        setCoverUrl(finalCoverUrl);
      }

      const payload = { ...buildPayload(), cover_url: finalCoverUrl || undefined };
      if (asStatus) payload.status = asStatus;

      const url    = isEditing ? `/api/admin/products/${initialBook!.id}` : '/api/admin/products';
      const method = isEditing ? 'PATCH' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data   = await res.json() as { book?: { id: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'No pudimos guardar el producto.');

      invalidate();
      clearDraft();

      if (isEditing) {
        router.push('/admin/productos');
      } else {
        setToast({ id: data.book!.id, title: form.title });
        setForm(defaultForm);
        setPreview(''); setCoverUrl(''); setPendingImage(null);
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, global: err instanceof Error ? err.message : 'Ocurrió un error inesperado.' }));
      setSubmitting(false);
    }
  };

  const saveDraftStatus = async () => {
    if (!form.title.trim()) { setErrors(prev => ({ ...prev, title: 'El título es obligatorio para guardar un borrador' })); return; }
    setSavingDraft(true);
    await submit('draft');
    setSavingDraft(false);
  };

  const fmtPrice = (v: string) => v ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(v)) : '';
  const margin = form.price && form.cost_price
    ? Math.round(((Number(form.price) - Number(form.cost_price)) / Number(form.price)) * 100)
    : null;

  return (
    <div>
      {/* ── Sticky page header ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 -mx-5 sm:-mx-8 px-5 sm:px-8 py-3 mb-6 flex items-center justify-between gap-4 flex-wrap"
        style={{ background: 'rgba(247,246,242,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(52,84,87,0.08)' }}>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/admin/productos" className="text-gray-400 hover:text-gray-600 transition-colors">← Productos</Link>
          <span className="text-gray-300">/</span>
          <span className="font-medium" style={{ color: BRAND }}>{isEditing ? 'Editar producto' : 'Nuevo producto'}</span>
        </div>
        <div className="flex items-center gap-2">
          {errors.global && <p className="text-[12px] text-red-500 mr-2">⚠ {errors.global}</p>}
          <button type="button" onClick={() => router.push('/admin/productos')}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-colors">
            Cancelar
          </button>
          {!isEditing && (
            <button type="button" onClick={saveDraftStatus} disabled={savingDraft || submitting}
              className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors disabled:opacity-50"
              style={{ borderColor: BRAND, color: BRAND }}>
              {savingDraft ? 'Guardando…' : '○ Borrador'}
            </button>
          )}
          <button type="button" onClick={() => submit()} disabled={submitting || converting}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ background: BRAND }}>
            {submitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : '● Publicar'}
          </button>
        </div>
      </div>

      {showDraftBanner && savedDraft && (
        <DraftBanner
          onRestore={() => { setForm(savedDraft); setShowDraftBanner(false); }}
          onDiscard={() => { clearDraft(); setShowDraftBanner(false); setSavedDraft(null); }}
        />
      )}

      {/* ── 2-column layout ─────────────────────────────────────────────── */}
      <div className="flex gap-6 items-start">
        {/* Left column */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Section 1 — Info básica */}
          <Section title="Información básica">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Título" required error={errors.title}>
                <input value={form.title} onChange={upStr('title')} onBlur={e => onBlur('title', e.target.value)}
                  className={errors.title ? errorInputCls : inputCls} autoFocus />
              </Field>
              <Field label="Autor" required error={errors.author_name}>
                <input value={form.author_name} onChange={upStr('author_name')} onBlur={e => onBlur('author_name', e.target.value)}
                  className={errors.author_name ? errorInputCls : inputCls} />
              </Field>
              <Field label="Editorial">
                <input value={form.publisher} onChange={upStr('publisher')} className={inputCls} />
              </Field>
              <Field label="ISBN" error={errors.isbn}>
                <div className="flex gap-2">
                  <input value={form.isbn} onChange={upStr('isbn')} onBlur={e => onBlur('isbn', e.target.value)}
                    placeholder="978-XXXXXXXXXX" className={`${errors.isbn ? errorInputCls : inputCls} flex-1`} />
                  <button type="button" onClick={importFromISBN} disabled={importingISBN}
                    title="Importar metadata desde Open Library"
                    className="px-3 py-2.5 rounded-xl text-sm border transition-colors disabled:opacity-50 shrink-0"
                    style={{ borderColor: BRAND, color: BRAND }}>
                    {importingISBN ? '⏳' : '🔍'}
                  </button>
                </div>
              </Field>
              <Field label="Categoría" required>
                <select value={form.category} onChange={upStr('category')} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Idioma">
                <select value={form.language} onChange={upStr('language')} className={inputCls}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Etiquetas">
              <TagsInput tags={form.tags} onChange={t => up('tags', t)} />
            </Field>
          </Section>

          {/* Section 2 — Info comercial */}
          <Section title="Precio & stock">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Precio de venta (ARS)" required error={errors.price}>
                <input type="number" min="0" step="1" value={form.price} onChange={upStr('price')} onBlur={e => onBlur('price', e.target.value)}
                  className={errors.price ? errorInputCls : inputCls} placeholder="15000" />
                {form.price && !errors.price && <p className="text-[11px] text-gray-400 mt-1">Se mostrará como {fmtPrice(form.price)}</p>}
              </Field>
              <Field label="Precio de costo (ARS)">
                <input type="number" min="0" step="1" value={form.cost_price} onChange={upStr('cost_price')} className={inputCls} placeholder="0" />
                {margin !== null && <p className="text-[11px] mt-1" style={{ color: margin > 40 ? '#3D8A5C' : margin > 15 ? '#9A7840' : '#B85C5C' }}>Margen: {margin}%</p>}
              </Field>
              <Field label="Precio promocional (ARS)">
                <input type="number" min="0" step="1" value={form.promotional_price} onChange={upStr('promotional_price')} className={inputCls} placeholder="Vacío = sin promoción" />
              </Field>
              <Field label="SKU / Código interno">
                <input value={form.sku} onChange={upStr('sku')} className={inputCls} placeholder="Ej: LIB-0042" />
              </Field>
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-medium text-gray-500 mb-2">Stock</label>
                <div className="flex items-center gap-3 mb-2">
                  <Toggle id="stockUntracked" checked={form.stockUntracked} onChange={v => up('stockUntracked', v)}
                    label="Sin control de stock (∞)" sub="El producto siempre aparece disponible" />
                </div>
                {!form.stockUntracked && (
                  <input type="number" min="0" value={form.stock} onChange={upStr('stock')} className={inputCls} placeholder="0" />
                )}
              </div>
            </div>
          </Section>

          {/* Section 3 — Info editorial (collapsible) */}
          <Section title="Información editorial" collapsible defaultOpen={!isEditing}>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Páginas">
                <input type="number" min="0" value={form.pages} onChange={upStr('pages')} className={inputCls} />
              </Field>
              <Field label="Año">
                <input type="number" value={form.year} onChange={upStr('year')} className={inputCls} placeholder={new Date().getFullYear().toString()} />
              </Field>
              <Field label="Edición">
                <input value={form.edition} onChange={upStr('edition')} className={inputCls} placeholder="1ª ed." />
              </Field>
            </div>
            <Field label="Encuadernación">
              <div className="flex gap-2 flex-wrap">
                {BINDINGS.map(b => (
                  <button key={b} type="button" onClick={() => up('binding', form.binding === b ? '' : b)}
                    className="px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-150"
                    style={{ borderColor: form.binding === b ? BRAND : '#E5E7EB', background: form.binding === b ? 'rgba(52,84,87,0.08)' : 'white', color: form.binding === b ? BRAND : '#6B7280' }}>
                    {b}
                  </button>
                ))}
              </div>
            </Field>
          </Section>

          {/* Section 4 — Marketing */}
          <Section title="Marketing & publicación">
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <Toggle id="featured" checked={form.featured} onChange={v => up('featured', v)}
                  label="Destacado" sub="Aparece en la sección &quot;Catálogo destacado&quot;" />
                <Toggle id="isNew" checked={form.isNew} onChange={v => up('isNew', v)}
                  label="Marcar como novedad"
                  sub={form.isNew ? `Badge activo 30 días` : 'Activa el badge Nuevo por 30 días'} />
              </div>
              <Field label="Descripción">
                <div className="relative">
                  <textarea rows={5} value={form.description} onChange={upStr('description')} maxLength={2000}
                    className={inputCls + ' resize-none'} placeholder="Descripción del libro que aparece en la página del producto…" />
                  <span className="absolute bottom-2 right-3 text-[10px] text-gray-300">{form.description.length}/2000</span>
                </div>
              </Field>
              <Field label="Rating editorial">
                <StarRating value={form.rating} onChange={v => up('rating', v)} />
                <p className="text-[11px] text-gray-400 mt-1">Rating editorial (no depende de reseñas)</p>
              </Field>
              <Field label="Estado de publicación">
                <div className="flex gap-3">
                  {(['published', 'draft'] as const).map(s => (
                    <button key={s} type="button" onClick={() => up('status', s)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all"
                      style={{ borderColor: form.status === s ? BRAND : '#E5E7EB', background: form.status === s ? 'rgba(52,84,87,0.08)' : 'white', color: form.status === s ? BRAND : '#6B7280' }}>
                      <span>{s === 'published' ? '●' : '○'}</span>
                      {s === 'published' ? 'Publicado' : 'Borrador'}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Los borradores no aparecen en el catálogo público.</p>
              </Field>
            </div>
          </Section>

        </div>

        {/* Right column — sticky */}
        <div className="w-64 xl:w-72 shrink-0 hidden lg:flex flex-col gap-5 sticky top-24">
          <Section title="Portada">
            <CoverZone preview={preview} converting={converting} onFile={handleImageFile} onClear={handleClearCover} />
            {errors.cover && <p className="text-[11px] text-red-500 mt-2">⚠ {errors.cover}</p>}
          </Section>
          <Section title="Vista previa">
            <PreviewCard
              title={form.title}
              author={form.author_name}
              price={fmtPrice(form.price)}
              cover={preview}
            />
          </Section>
          {isEditing && (
            <Section title="Acciones">
              <div className="space-y-2">
                <a href={`/libro/${initialBook!.id}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 hover:border-[#345457]/30 transition-colors" style={{ color: BRAND }}>
                  👁 Ver en catálogo
                </a>
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Cover section for mobile (below form) */}
      <div className="lg:hidden mt-5 space-y-5">
        <Section title="Portada">
          <CoverZone preview={preview} converting={converting} onFile={handleImageFile} onClear={handleClearCover} />
          {errors.cover && <p className="text-[11px] text-red-500 mt-2">⚠ {errors.cover}</p>}
        </Section>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={`"${toast.title}" creado correctamente`}
          bookId={toast.id}
          onClose={() => setToast(null)}
          onCreateAnother={() => { setToast(null); }}
        />
      )}
    </div>
  );
}
