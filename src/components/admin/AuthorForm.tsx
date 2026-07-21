'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { convertImageToWebp } from '@/lib/image-conversion';
import { useAdminAuthors, type AdminAuthor } from '@/contexts/AdminAuthorsContext';
import { COUNTRIES } from '@/lib/countries';

const BRAND = '#345457';

const inputCls = 'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:border-[#345457] focus:shadow-[0_0_0_3px_rgba(52,84,87,0.08)] bg-white';
const errorInputCls = 'w-full rounded-xl border border-red-400 px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(184,92,92,0.10)] bg-white';

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(52,84,87,0.06)' }}>
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold" style={{ color: BRAND }}>{title}</h3>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

// ─── Photo drop zone (circular) ────────────────────────────────────────────────
function PhotoZone({ preview, name, converting, onFile, onClear }: { preview: string; name: string; converting: boolean; onFile: (f: File) => void; onClear: () => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) onFile(file);
  };

  if (preview) return (
    <div className="relative group/photo w-40 h-40 mx-auto">
      <div className="w-full h-full rounded-full overflow-hidden bg-gray-100">
        <img src={preview} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
        <button type="button" onClick={() => inputRef.current?.click()}
          className="px-3 py-1.5 rounded-xl bg-white text-[12px] font-semibold" style={{ color: BRAND }}>Cambiar</button>
        <button type="button" onClick={onClear}
          className="px-3 py-1.5 rounded-xl bg-white/20 text-white text-[12px] font-medium">Eliminar</button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      {converting && (
        <div className="absolute inset-0 rounded-full bg-white/80 flex items-center justify-center">
          <p className="text-[11px] font-medium" style={{ color: BRAND }}>…</p>
        </div>
      )}
    </div>
  );

  return (
    <div
      onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)}
      onDragOver={e => e.preventDefault()} onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="w-40 h-40 mx-auto rounded-full border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200"
      style={{ borderColor: dragging ? BRAND : '#D1D5DB', background: dragging ? 'rgba(52,84,87,0.04)' : name ? BRAND : 'transparent' }}>
      {converting ? (
        <span className="text-3xl">⏳</span>
      ) : name ? (
        <span className="text-3xl font-bold text-white">{name[0].toUpperCase()}</span>
      ) : (
        <>
          <span className="text-3xl">📷</span>
          <p className="text-[11px] text-gray-400 text-center px-4">Foto del autor</p>
        </>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </div>
  );
}

export function AuthorForm({ initialAuthor }: { initialAuthor?: AdminAuthor }) {
  const router = useRouter();
  const { createAuthor, updateAuthor } = useAdminAuthors();
  const isEditing = Boolean(initialAuthor?.id);

  const [name, setName] = useState(initialAuthor?.name ?? '');
  const [nationality, setNationality] = useState(initialAuthor?.nationality ?? '');
  const [bio, setBio] = useState(initialAuthor?.bio ?? '');
  const [featured, setFeatured] = useState(initialAuthor?.featured ?? false);

  const [photoUrl, setPhotoUrl] = useState(initialAuthor?.photo_url ?? '');
  const [preview, setPreview] = useState(initialAuthor?.photo_url ?? '');
  const [pendingImage, setPendingImage] = useState<Blob | null>(null);
  const [converting, setConverting] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; global?: string; photo?: string }>({});

  const handleImageFile = async (file: File) => {
    setConverting(true);
    setErrors(prev => ({ ...prev, photo: undefined }));
    try {
      const webp = await convertImageToWebp(file, { maxWidth: 500 });
      setPendingImage(webp);
      setPreview(URL.createObjectURL(webp));
    } catch {
      setErrors(prev => ({ ...prev, photo: 'No pudimos procesar esa imagen. Probá con otra.' }));
    } finally {
      setConverting(false);
    }
  };

  const handleClearPhoto = () => { setPreview(''); setPhotoUrl(''); setPendingImage(null); };

  const submit = async () => {
    if (!name.trim()) { setErrors({ name: 'El nombre es obligatorio' }); return; }
    setSubmitting(true);
    setErrors({});
    try {
      let finalPhotoUrl = photoUrl;
      if (pendingImage) {
        const fd = new FormData();
        fd.append('file', pendingImage, 'photo.webp');
        const up = await fetch('/api/admin/upload-author-photo', { method: 'POST', body: fd });
        const upd = await up.json() as { url?: string; error?: string };
        if (!up.ok) throw new Error(upd.error ?? 'No pudimos subir la imagen.');
        finalPhotoUrl = upd.url!;
        setPhotoUrl(finalPhotoUrl);
      }

      const payload = {
        name: name.trim(),
        nationality: nationality.trim() || null,
        bio: bio.trim() || null,
        photo_url: finalPhotoUrl || null,
        featured,
      };

      const result = isEditing
        ? await updateAuthor(initialAuthor!.id, payload)
        : await createAuthor(payload);

      if (result.error) throw new Error(result.error);

      router.push('/admin/autores');
    } catch (err) {
      setErrors(prev => ({ ...prev, global: err instanceof Error ? err.message : 'Ocurrió un error inesperado.' }));
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="sticky top-0 z-30 -mx-5 sm:-mx-8 px-5 sm:px-8 py-3 mb-6 flex items-center justify-between gap-4 flex-wrap"
        style={{ background: 'rgba(247,246,242,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(52,84,87,0.08)' }}>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/admin/autores" className="text-gray-400 hover:text-gray-600 transition-colors">← Autores</Link>
          <span className="text-gray-300">/</span>
          <span className="font-medium" style={{ color: BRAND }}>{isEditing ? 'Editar autor' : 'Nuevo autor'}</span>
        </div>
        <div className="flex items-center gap-2">
          {errors.global && <p className="text-[12px] text-red-500 mr-2">⚠ {errors.global}</p>}
          <button type="button" onClick={() => router.push('/admin/autores')}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={submit} disabled={submitting || converting}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ background: BRAND }}>
            {submitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : '● Publicar'}
          </button>
        </div>
      </div>

      <div className="flex gap-6 items-start max-w-3xl">
        <div className="flex-1 min-w-0 space-y-5">
          <Section title="Información del autor">
            <Field label="Nombre" required error={errors.name}>
              <input value={name} onChange={e => setName(e.target.value)}
                className={errors.name ? errorInputCls : inputCls} autoFocus placeholder="Ej: Gabriel García Márquez" />
            </Field>
            <Field label="Nacionalidad">
              <select value={nationality} onChange={e => setNationality(e.target.value)} className={inputCls}>
                <option value="">Sin especificar</option>
                {nationality && !COUNTRIES.includes(nationality) && (
                  <option value={nationality}>{nationality}</option>
                )}
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Biografía">
              <textarea rows={5} value={bio} onChange={e => setBio(e.target.value)} maxLength={2000}
                className={inputCls + ' resize-none'} placeholder="Breve biografía que aparece en la página del autor…" />
            </Field>
          </Section>

          <Section title="Visibilidad">
            <Toggle id="featured" checked={featured} onChange={setFeatured}
              label="Autor destacado" sub="Aparece en la sección &quot;Autores destacados&quot; del home" />
          </Section>
        </div>

        <div className="w-64 shrink-0 hidden sm:block">
          <Section title="Foto">
            <PhotoZone preview={preview} name={name} converting={converting} onFile={handleImageFile} onClear={handleClearPhoto} />
            {errors.photo && <p className="text-[11px] text-red-500 mt-2 text-center">⚠ {errors.photo}</p>}
          </Section>
        </div>
      </div>

      <div className="sm:hidden mt-5 max-w-3xl">
        <Section title="Foto">
          <PhotoZone preview={preview} name={name} converting={converting} onFile={handleImageFile} onClear={handleClearPhoto} />
          {errors.photo && <p className="text-[11px] text-red-500 mt-2 text-center">⚠ {errors.photo}</p>}
        </Section>
      </div>
    </div>
  );
}
