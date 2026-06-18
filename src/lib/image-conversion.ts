// Solo para uso en componentes de cliente: usa APIs de browser (canvas, createImageBitmap).
type ConvertOptions = {
  maxWidth?: number;
  quality?: number;
};

export async function convertImageToWebp(file: File, options: ConvertOptions = {}): Promise<Blob> {
  const { maxWidth = 1000, quality = 0.82 } = options;

  const bitmap = await createImageBitmap(file);
  // Solo achica, nunca agranda una imagen más chica que maxWidth.
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', quality));
  if (!blob) throw new Error('No se pudo convertir la imagen a WebP.');
  return blob;
}
