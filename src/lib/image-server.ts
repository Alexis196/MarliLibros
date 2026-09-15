// Solo para uso en servidor (Route Handlers): convierte cualquier imagen a WebP con sharp.
import sharp from 'sharp';
import heicConvert from 'heic-convert';

type ConvertOptions = {
  maxWidth?: number;
  quality?: number;
};

export async function convertImageBufferToWebp(buffer: Buffer, options: ConvertOptions = {}): Promise<Buffer> {
  const { maxWidth = 1000, quality = 82 } = options;

  const toWebp = (input: Buffer | Uint8Array) =>
    sharp(input)
      .rotate() // respeta la orientación EXIF (fotos de celular) antes de redimensionar
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

  try {
    return await toWebp(buffer);
  } catch {
    // sharp no decodifica HEIC/HEIF (fotos de iPhone en formato "Alta eficiencia"):
    // las pasamos primero por heic-convert (decodificador puro en JS) y reintentamos.
    try {
      const decoded = await heicConvert({ buffer, format: 'PNG' });
      return await toWebp(decoded);
    } catch {
      throw new Error('No pudimos procesar esa imagen. Probá con otra.');
    }
  }
}
