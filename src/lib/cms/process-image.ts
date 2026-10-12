import sharp from "sharp";
import { imageSignature, MAX_IMAGE_DIMENSION, MAX_IMAGE_PIXELS, MAX_UPLOAD_BYTES } from "../../../cms/shared/media";

export class InvalidImageError extends Error {}
// Server-only caller. Decoding (not just file headers) validates every pixel.
export async function processImage(bytes: Uint8Array, expectedMime: string) {
  try {
    if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES || imageSignature(bytes) !== expectedMime) throw new Error();
    const input = Buffer.from(bytes);
    const options = { failOn: "warning" as const, limitInputPixels: MAX_IMAGE_PIXELS, limitInputChannels: 4 };
    const info = await sharp(input, options).metadata();
    if (!info.width || !info.height || info.width > MAX_IMAGE_DIMENSION || info.height > MAX_IMAGE_DIMENSION || info.width * info.height > MAX_IMAGE_PIXELS || (info.pages ?? 1) > 1) throw new Error();
    if (!(["jpeg", "png", "webp", "heif"] as string[]).includes(info.format)) throw new Error();
    // Orientation is applied before stripping EXIF/GPS. Original stays private in R2.
    const master = await sharp(input, options).rotate().toColourspace("srgb").webp({ quality: 92, effort: 4 }).timeout({ seconds: 25 }).toBuffer({ resolveWithObject: true });
    if (master.data.length > 20*1024*1024) throw new Error();
    const thumb = await sharp(master.data).resize({ width: 360, height: 240, fit: "inside", withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
    // Private previews traverse Next, so keep them comfortably below Vercel's
    // response-body limit. The high quality master is delivered by the Worker.
    const preview = await sharp(master.data).resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    if (preview.length > 4*1024*1024 || thumb.length > 1024*1024) throw new Error();
    return { master: master.data, thumb, preview, width: master.info.width, height: master.info.height };
  } catch { throw new InvalidImageError("Image cannot be decoded safely. Use a still JPEG, PNG, WebP or AVIF up to 10 MB, 24 MP and 8192 pixels per side."); }
}
