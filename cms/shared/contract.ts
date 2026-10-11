export const PAGE_ID = "cms-proof";
export const PUBLIC_PATH = "/cms-proof";
export const CACHE_TAG = "cms:page:cms-proof";
export const LEGACY_URL = "https://breeze-api.nikodola.workers.dev/api/sections/home-hero";
export const MAX_BODY_BYTES = 48 * 1024;

export type Section = {
  eyebrow: string; headline: string; body: string;
  button_text: string; button_route: string; bottom_note: string;
  images: string[];
};
export type Document = {
  schemaVersion: 1; title: string; seoTitle: string; seoDescription: string;
  section: Section;
};
export type Publication = { revisionId: string; version: number; document: Document; publishedAt: string };
export type Draft = { version: number; document: Document; updatedAt: string };
export type Delivery = {
  revision_id: string; draft_version: number; attempts: number;
  invalidated_at: string | null; confirmed_at: string | null;
  last_error: string | null; next_attempt_at: number;
};
export type EditorState = { draft: Draft | null; publication: Publication | null; delivery: Delivery | null };
export type PublishEvent = { eventId: string; pageId: typeof PAGE_ID; path: typeof PUBLIC_PATH; revisionId: string; version: number };

export class InputError extends Error { status = 400; }
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InputError("Expected an object.");
  return value as Record<string, unknown>;
}
function string(value: unknown, name: string, max: number, required = false): string {
  if (typeof value !== "string" || value.length > max || (required && !value.trim()) || /\u0000/.test(value)) {
    throw new InputError(`Invalid ${name} (maximum ${max} characters).`);
  }
  return value;
}
export function safeRoute(value: string): boolean {
  if (!value) return true;
  if (/[\s\\\u0000-\u001f\u007f]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}
export function validateDocument(value: unknown): Document {
  const doc = record(value), section = record(doc.section);
  if (doc.schemaVersion !== 1) throw new InputError("Unsupported document version.");
  const images = section.images;
  // Legacy image references are retained verbatim; this milestone does not render or upload them.
  if (!Array.isArray(images) || images.length > 12 || images.some(v => typeof v !== "string" || v.length > 2048)) {
    throw new InputError("Invalid image references.");
  }
  const route = string(section.button_route, "button destination", 2048);
  if (!safeRoute(route)) throw new InputError("Use an internal path or an HTTPS button destination.");
  const button = string(section.button_text, "button text", 100);
  if (Boolean(button.trim()) !== Boolean(route)) throw new InputError("Provide both button text and destination, or leave both empty.");
  return {
    schemaVersion: 1,
    title: string(doc.title, "title", 200, true),
    seoTitle: string(doc.seoTitle, "SEO title", 200),
    seoDescription: string(doc.seoDescription, "SEO description", 500),
    section: {
      eyebrow: string(section.eyebrow, "eyebrow", 200),
      headline: string(section.headline, "headline", 300, true),
      body: string(section.body, "body", 10000),
      button_text: button, button_route: route,
      bottom_note: string(section.bottom_note, "bottom note", 1000),
      images: [...images] as string[],
    },
  };
}
export function importLegacy(value: unknown): Document {
  const source = record(value);
  if (source.id !== "home-hero") throw new InputError("Expected the existing home-hero section.");
  const section: Record<string, unknown> = {};
  for (const field of ["eyebrow", "headline", "body", "button_text", "button_route", "bottom_note"]) section[field] = source[field] ?? "";
  try { section.images = typeof source.images === "string" ? JSON.parse(source.images) : source.images ?? []; }
  catch { throw new InputError("Invalid legacy image references."); }
  return validateDocument({ schemaVersion: 1, title: "CMS workflow proof", seoTitle: "CMS workflow proof", seoDescription: "", section });
}
export function expectedVersion(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) throw new InputError("Invalid draft version.");
  return value as number;
}
export function validateEvent(value: unknown): PublishEvent {
  const event = record(value);
  if (event.pageId !== PAGE_ID || event.path !== PUBLIC_PATH || typeof event.eventId !== "string" ||
      !/^[a-f0-9-]{36}$/.test(event.eventId) || typeof event.revisionId !== "string" || !/^[a-f0-9-]{36}$/.test(event.revisionId)) {
    throw new InputError("Invalid publish event.");
  }
  return { eventId: event.eventId, pageId: PAGE_ID, path: PUBLIC_PATH, revisionId: event.revisionId, version: expectedVersion(event.version) };
}
export async function readBody(request: Pick<Request, "headers" | "body">, limit = MAX_BODY_BYTES): Promise<string> {
  if (Number(request.headers.get("content-length")) > limit) throw new InputError("Request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new InputError("Request body is required.");
  const chunks: Uint8Array[] = []; let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) { await reader.cancel(); throw new InputError("Request is too large."); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(bytes);
}
