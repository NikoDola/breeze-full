import { exactKeys, InputError, record, text } from "./validation";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 24_000_000;
export const MAX_IMAGE_DIMENSION = 8192;
export const assetIdPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export type MediaPlacement = { assetId: string; alt: string; decorative: boolean; width: number; height: number };
export type ImageReference = string | MediaPlacement;
export type MediaAsset = {
  id: string; filename: string; mime_type: string; original_bytes: number;
  width: number | null; height: number | null; default_alt: string; created_at: string;
  status: "pending" | "uploading" | "uploaded" | "validating" | "ready" | "failed";
  archived: number; error: string | null; used_by: number;
};
export function validatePlacement(value: unknown): MediaPlacement {
  const item = record(value);
  exactKeys(item, ["assetId", "alt", "decorative", "width", "height"], "image");
  if (typeof item.assetId !== "string" || !assetIdPattern.test(item.assetId) || typeof item.decorative !== "boolean") throw new InputError("Invalid media reference.");
  const alt = text(item.alt, "image description", 500);
  if ((!item.decorative && !alt.trim()) || (item.decorative && alt !== "")) throw new InputError("Describe the image, or mark it decorative and leave its description empty.");
  for (const key of ["width", "height"] as const) if (!Number.isSafeInteger(item[key]) || Number(item[key]) < 1 || Number(item[key]) > MAX_IMAGE_DIMENSION) throw new InputError("Invalid image dimensions.");
  if (Number(item.width) * Number(item.height) > MAX_IMAGE_PIXELS) throw new InputError("Image exceeds the pixel limit.");
  return { assetId: item.assetId, alt, decorative: item.decorative, width: Number(item.width), height: Number(item.height) };
}
export function imageSignature(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if ([137,80,78,71,13,10,26,10].every((v, i) => bytes[i] === v)) return "image/png";
  const ascii = (a: number, b: number) => String.fromCharCode(...bytes.slice(a, b));
  if (ascii(0,4) === "RIFF" && ascii(8,12) === "WEBP") return "image/webp";
  if (ascii(4,8) === "ftyp" && (ascii(8,12) === "avif" || ascii(8,12) === "avis" || /avif/.test(ascii(16, Math.min(bytes.length, 64))))) return "image/avif";
  return null;
}
export async function readBytes(request: Pick<Request, "headers" | "body">, limit = MAX_UPLOAD_BYTES): Promise<Uint8Array> {
  if (Number(request.headers.get("content-length")) > limit) throw new InputError("Image is too large (maximum 10 MB).");
  const reader = request.body?.getReader();
  if (!reader) throw new InputError("Image is empty.");
  const chunks: Uint8Array[] = []; let size = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length;
    if (size > limit) { await reader.cancel(); throw new InputError("Image exceeds the upload limit."); }
    chunks.push(value);
  }
  if (!size) throw new InputError("Image is empty.");
  const result = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}
