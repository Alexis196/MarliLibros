'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { convertImageToWebp } from '@/lib/image-conversion';

type Book = {
  id?: string;
  title: string;
  author_name: string;
  category: string;
  price: number;
  description?: string;
  cover_url?: string;
  rating?: number;
  pages?: number;
  year?: number;
  new_until?: string;
};

const CATEGORIES = [
  'Libros',
  'Desarrollo Personal',
  'Tarot y Oráculos',
  'Rompecabezas',
  'Juegos Didácticos',
  'Agendas y Cuadernos',
];

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)]';

export function ProductForm({ initialBook }: { initialBook?: Book }) {
  const router = useRouter();
  const isEditing = Boolean(initialBook?.id);
  const now = new Date().toISOString();

  const [form, setForm] = useState({
    title: initialBook?.title ?? '',
    author_name: initialBook?.author_name ?? '',
    category: initialBook?.category ?? CATEGORIES[0],
    price: initialBook?.price?.toString() ?? '',
    description: initialBook?.description ?? '',
    pages: initialBook?.pages?.toString() ?? '',
    year: initialBook?.year?.toString() ?? '',
    rating: initialBook?.rating?.toString() ?? '',
    isNew: Boolean(initialBook?.new_until && initialBook.new_until > now),
  });

  const [coverUrl, setCoverUrl] = useState(initialBook?.cover_url ?? '');
  const [pendingImage, setPendingImage] = useState<Blob | null>(null);
  const [preview, setPreview] = useState(initialBook?.cover_url ?? '');
  const [converting, setConverting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setConverting(true);
    setError(null);
    try {
      const webp = await convertImageToWebp(file);
      setPendingImage(webp);
      setPreview(URL.createObjectURL(webp));
    } catch {
      setError('No pudimos procesar esa imagen. Probá con otra.');
    } finally {
      setConverting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title || !form.author_name || !form.category || !form.price) {
      setError('Completá los campos obligatorios.');
      return;
    }

    setSubmitting(true);
    try {
      let finalCoverUrl = coverUrl;

      if (pendingImage) {
        const uploadForm = new FormData();
        uploadForm.append('file', pendingImage, 'cover.webp');
        const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: uploadForm });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'No pudimos subir la imagen.');
        finalCoverUrl = uploadData.url;
        setCoverUrl(finalCoverUrl);
      }

      const payload = {
        title: form.title,
        author_name: form.author_name,
        category: form.category,
        price: Number(form.price),
        description: form.description || undefined,
        cover_url: finalCoverUrl || undefined,
        pages: form.pages ? Number(form.pages) : undefined,
        year: form.year ? Number(form.year) : undefined,
        rating: form.rating ? Number(form.rating) : undefined,
        isNew: form.isNew,
      };

      const res = await fetch(isEditing ? `/api/admin/products/${initialBook!.id}` : '/api/admin/products', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No pudimos guardar el producto.');

      router.push('/admin/productos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div className="rounded-2xl bg-white p-5 sm:p-7 space-y-4" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Portada</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-28 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              {preview && <img src={preview} alt="" className="w-full h-full object-cover" />}
            </div>
            <div>
              <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm" />
              <p className="text-[11px] text-gray-400 mt-1">Se convierte a WebP automáticamente antes de subirse.</p>
              {converting && (
                <p className="text-[11px] mt-1" style={{ color: '#345457' }}>
                  Procesando imagen…
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Título *</label>
            <input required value={form.title} onChange={update('title')} className={inputClass} />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Autor *</label>
            <input required value={form.author_name} onChange={update('author_name')} className={inputClass} />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Categoría *</label>
            <select required value={form.category} onChange={update('category')} className={inputClass}>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Precio *</label>
            <input required type="number" min="0" step="0.01" value={form.price} onChange={update('price')} className={inputClass} />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Páginas</label>
            <input type="number" min="0" value={form.pages} onChange={update('pages')} className={inputClass} />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Año</label>
            <input type="number" value={form.year} onChange={update('year')} className={inputClass} />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Rating (0-5)</label>
            <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={update('rating')} className={inputClass} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="isNew"
              checked={form.isNew}
              onChange={e => setForm(prev => ({ ...prev, isNew: e.target.checked }))}
              className="w-4 h-4"
            />
            <label htmlFor="isNew" className="text-sm text-gray-600">
              Marcar como novedad (30 días)
            </label>
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Descripción</label>
          <textarea rows={4} value={form.description} onChange={update('description')} className={inputClass} />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || converting}
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
          style={{ backgroundColor: '#345457' }}
        >
          {submitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear producto'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/productos')}
          className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:border-[#345457]/30 hover:text-[#345457] transition-colors duration-300"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
