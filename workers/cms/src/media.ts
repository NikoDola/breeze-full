import { InputError, PREVIEW_ORIGIN, readBody, record, type Document } from "../../../cms/shared/contract";
import { assetIdPattern, imageSignature, MAX_UPLOAD_BYTES, readBytes, type MediaAsset } from "../../../cms/shared/media";
import type { Env } from "./index";
import { environmentEnabled } from "./environment";

class MediaError extends InputError { constructor(public status: number, message: string) { super(message); } }
const json = (data: unknown, status = 200, headers = {}) => Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers } });
const at = () => new Date().toISOString();
const uploadOrigin = (env: Env) => env.CMS_UPLOAD_ORIGIN || PREVIEW_ORIGIN;
const writable = (env: Env) => environmentEnabled(env) && env.CMS_WRITES_ENABLED === "true" && (env.CMS_WRITE_TOKEN?.length ?? 0) >= 32 && !!env.MEDIA;
const sha256 = async (data: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", data))].map(v => v.toString(16).padStart(2, "0")).join("");
const hashToken = (token: string) => sha256(new TextEncoder().encode(token));
const fields = "a.id, a.filename, a.mime_type, a.original_bytes, a.width, a.height, a.default_alt, a.status, a.archived, a.error, a.created_at, (SELECT COUNT(*) FROM revision_assets r WHERE r.asset_id = a.id) AS used_by";
type AssetRow = MediaAsset & { original_key: string; master_key: string | null; thumbnail_key: string | null; validation_token: string | null; validation_until: number };
async function asset(env: Env, id: string) {
  if (!assetIdPattern.test(id)) throw new MediaError(404, "Image not found.");
  const value = await env.DB.withSession("first-primary").prepare("SELECT * FROM media_assets WHERE id = ?").bind(id).first<AssetRow>();
  if (!value) throw new MediaError(404, "Image not found.");
  return value;
}
async function metadata(env: Env, id: string) {
  return env.DB.withSession("first-primary").prepare(`SELECT ${fields} FROM media_assets a WHERE a.id = ?`).bind(id).first<MediaAsset>();
}
const inputJson = async (request: Request) => {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new InputError("Expected JSON.");
  try { return record(JSON.parse(await readBody(request))); } catch { throw new InputError("Invalid media request."); }
};

// The only browser-to-Worker mutation: a one-use, short-lived upload capability.
export async function mediaUpload(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get("origin"), allowed = uploadOrigin(env);
  const cors: Record<string, string> = origin === allowed ? { "Access-Control-Allow-Origin": allowed, "Vary": "Origin", "Access-Control-Allow-Methods": "PUT, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Max-Age": "300" } : {};
  try {
    if (!writable(env)) throw new MediaError(404, "Uploads are unavailable.");
    if (origin !== allowed) throw new MediaError(403, "Invalid upload origin.");
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "PUT") throw new MediaError(405, "Use PUT to upload.");
    const id = new URL(request.url).pathname.split("/").pop()!;
    if (!assetIdPattern.test(id)) throw new MediaError(404, "Upload not found.");
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
    if (!/^[a-f0-9]{64}$/.test(token)) throw new MediaError(401, "Upload authorization required.");
    const now = Date.now();
    const claim = await env.DB.prepare(`UPDATE media_upload_sessions SET used_at = ?
      WHERE asset_id = ? AND token_hash = ? AND origin = ? AND used_at IS NULL AND expires_at > ? RETURNING asset_id`)
      .bind(now, id, await hashToken(token), allowed, now).first();
    if (!claim) throw new MediaError(401, "Upload authorization expired or already used. Start a new upload.");
    const row = await asset(env, id);
    await env.DB.prepare("UPDATE media_assets SET status = 'uploading', updated_at = ? WHERE id = ? AND status = 'pending'").bind(at(), id).run();
    try {
      const bytes = await readBytes(request);
      const mime = imageSignature(bytes);
      if (bytes.length !== row.original_bytes || mime !== row.mime_type) throw new InputError("Image type or size does not match the selected file.");
      const checksum = await sha256(bytes);
      const stored = await env.MEDIA!.put(row.original_key, bytes, { onlyIf: { etagDoesNotMatch: "*" }, httpMetadata: { contentType: mime }, customMetadata: { sha256: checksum } });
      if (!stored) throw new MediaError(409, "This upload already exists.");
      await env.DB.prepare("UPDATE media_assets SET status = 'uploaded', original_sha256 = ?, updated_at = ?, error = NULL WHERE id = ? AND status = 'uploading'").bind(checksum, at(), id).run();
      return json({ assetId: id, status: "uploaded" }, 200, cors);
    } catch (error) {
      await env.DB.prepare("UPDATE media_assets SET status = 'failed', error = 'Upload failed. Select the file again.', updated_at = ? WHERE id = ? AND status = 'uploading'").bind(at(), id).run();
      throw error;
    }
  } catch (error) { return json({ error: error instanceof InputError ? error.message : "Upload failed. Select the file again." }, error instanceof InputError ? error.status : 502, cors); }
}

export async function mediaPublic(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/media\/([a-f0-9-]+)\/(master|thumb)-v1\.webp$/);
  if (!environmentEnabled(env) || !env.MEDIA || !match || !assetIdPattern.test(match[1]) || url.search || !["GET", "HEAD"].includes(request.method)) return json({ error: "Not found." }, 404);
  const cache = caches.default, key = new Request(url.href);
  const hit = await cache.match(key);
  if (hit) { const response = new Response(request.method === "HEAD" ? null : hit.body, hit); response.headers.set("X-Media-Cache", "HIT"); return response; }
  const row = await env.DB.withSession("first-primary").prepare(`SELECT a.master_key, a.thumbnail_key FROM media_assets a
    WHERE a.id = ? AND a.status = 'ready' AND EXISTS (SELECT 1 FROM revision_assets r WHERE r.asset_id = a.id)`).bind(match[1]).first<{ master_key: string; thumbnail_key: string }>();
  // Private/draft misses are never cached. A successful publication immediately permits a new fetch.
  if (!row) return json({ error: "Not found." }, 404);
  const object = await env.MEDIA.get(match[2] === "thumb" ? row.thumbnail_key : row.master_key);
  if (!object) return json({ error: "Image unavailable." }, 404);
  console.info(JSON.stringify({ event: "cms.media.r2-read", assetId: match[1], kind: match[2] }));
  const response = new Response(object.body, { headers: { "Content-Type": "image/webp", "Content-Length": String(object.size), "Cache-Control": "public, max-age=31536000, immutable", "ETag": object.httpEtag, "X-Content-Type-Options": "nosniff", "X-Media-Cache": "MISS" } });
  await cache.put(key, response.clone());
  return request.method === "HEAD" ? new Response(null, response) : response;
}

// Called only AFTER the existing server-only bearer and environment checks.
export async function mediaAdmin(request: Request, env: Env): Promise<Response> {
  if (!env.MEDIA) throw new MediaError(503, "Media storage is not configured.");
  const url = new URL(request.url), path = url.pathname.slice("/api/admin/media".length);
  if (path === "/health" && request.method === "GET") {
    const tables = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('media_assets', 'media_upload_sessions', 'revision_assets')").all();
    await env.MEDIA.head("media-health-check");
    return json({ storageReady: true, schemaReady: tables.results.length === 3, uploadOrigin: uploadOrigin(env), maxUploadBytes: MAX_UPLOAD_BYTES });
  }
  if (path === "" && request.method === "GET") {
    const search = (url.searchParams.get("q") ?? "").trim().slice(0,100);
    const offset = Math.max(0, Math.min(10000, Number(url.searchParams.get("offset")) || 0));
    const result = await env.DB.withSession("first-primary").prepare(`SELECT ${fields} FROM media_assets a WHERE a.archived = 0
      AND (instr(lower(a.filename), lower(?)) > 0 OR instr(lower(a.default_alt), lower(?)) > 0)
      ORDER BY a.created_at DESC, a.id DESC LIMIT 25 OFFSET ?`).bind(search, search, offset).all<MediaAsset>();
    return json({ assets: result.results.slice(0,24), nextOffset: result.results.length > 24 ? offset + 24 : null });
  }
  if (path === "/grant" && request.method === "POST") {
    const input = await inputJson(request);
    if (typeof input.filename !== "string" || !input.filename.trim() || input.filename.length > 180 || /[\/\\\x00-\x1f]/.test(input.filename)) throw new InputError("Invalid image filename.");
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(String(input.mime)) || !Number.isSafeInteger(input.bytes) || Number(input.bytes) < 1 || Number(input.bytes) > MAX_UPLOAD_BYTES) throw new InputError("Choose a JPEG, PNG, WebP or AVIF image up to 10 MB.");
    if (input.origin !== uploadOrigin(env)) throw new MediaError(403, "Upload origin is not configured for this editor.");
    const now = Date.now(), id = crypto.randomUUID(), token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
    const result = await env.DB.batch([
      env.DB.prepare(`INSERT INTO media_assets(id, filename, mime_type, original_key, original_bytes, status, created_at, updated_at)
        SELECT ?, ?, ?, ?, ?, 'pending', ?, ? WHERE
        (SELECT COUNT(*) FROM media_upload_sessions WHERE created_at > ?) < 30 AND
        (SELECT COUNT(*) FROM media_upload_sessions WHERE created_at > ?) < 200 AND
        (SELECT COALESCE(SUM(original_bytes),0) FROM media_assets) + ? <= 5368709120 AND
        (SELECT COUNT(*) FROM media_assets) < 5000`).bind(id, input.filename, input.mime, `originals/${id}`, input.bytes, at(), at(), now-3600000, now-86400000, input.bytes),
      env.DB.prepare(`INSERT INTO media_upload_sessions(asset_id, token_hash, origin, expires_at, created_at)
        SELECT id, ?, ?, ?, ? FROM media_assets WHERE id = ?`).bind(await hashToken(token), uploadOrigin(env), now+300000, now, id),
    ]);
    if (!result[0].meta.changes) throw new MediaError(429, "Upload allowance reached. Try later or contact your developer.");
    return json({ assetId: id, token, expiresAt: now+300000, uploadPath: `/api/media/upload/${id}` });
  }
  const match = path.match(/^\/([a-f0-9-]+)(?:\/(claim|source|master|thumb|preview|complete|fail|metadata))?$/);
  if (!match) throw new MediaError(404, "Not found.");
  const row = await asset(env, match[1]), action = match[2];
  if (!action && request.method === "GET") return json({ asset: await metadata(env, row.id) });
  if (["source", "master", "thumb", "preview"].includes(action) && request.method === "GET") {
    const key = action === "source" ? row.original_key : action === "master" ? row.master_key : action === "preview" ? `validated/${row.id}/preview-v1.webp` : row.thumbnail_key;
    if (action !== "source" && row.status !== "ready") throw new MediaError(409, "Image is not ready.");
    const object = key ? await env.MEDIA.get(key) : null;
    if (!object) throw new MediaError(404, "Image not found.");
    return new Response(object.body, { headers: { "Cache-Control": "private, no-store", "Content-Type": action === "source" ? "application/octet-stream" : "image/webp", "Content-Length": String(object.size), "X-Content-Type-Options": "nosniff" } });
  }
  if (action === "claim" && request.method === "POST") {
    if (row.status === "ready") return json({ asset: await metadata(env, row.id), ready: true });
    const lease = crypto.randomUUID(), now = Date.now();
    const result = await env.DB.prepare(`UPDATE media_assets SET status = 'validating', validation_token = ?, validation_until = ?, error = NULL, updated_at = ?
      WHERE id = ? AND (status = 'uploaded' OR (status = 'validating' AND validation_until < ?))`).bind(lease, now+90000, at(), row.id, now).run();
    if (!result.meta.changes) throw new MediaError(409, "Image is still uploading, already being checked, or was rejected. Refresh the library before retrying.");
    return json({ asset: await metadata(env, row.id), lease });
  }
  if (action === "metadata" && request.method === "POST") {
    const input = await inputJson(request);
    if (typeof input.alt !== "string" || input.alt.length > 500 || /\x00/.test(input.alt) || typeof input.archived !== "boolean") throw new InputError("Invalid image details.");
    await env.DB.prepare("UPDATE media_assets SET default_alt = ?, archived = ?, updated_at = ? WHERE id = ?").bind(input.alt, input.archived ? 1 : 0, at(), row.id).run();
    return json({ asset: await metadata(env, row.id) });
  }
  // Lease protects validation retries. Ready objects are never overwritten.
  const lease = request.headers.get("x-media-lease");
  if (row.status !== "validating" || !lease || row.validation_token !== lease || row.validation_until <= Date.now()) throw new MediaError(409, "Image validation lease expired. Retry validation.");
  if (["master", "thumb", "preview"].includes(action) && request.method === "PUT") {
    const bytes = await readBytes(request, action === "thumb" ? 1024*1024 : action === "preview" ? 4*1024*1024 : 20*1024*1024);
    if (imageSignature(bytes) !== "image/webp") throw new InputError("Invalid processed image.");
    const key = `validated/${row.id}/${action}-v1.webp`, checksum = await sha256(bytes);
    const existing = await env.MEDIA.head(key);
    if (existing && existing.customMetadata?.sha256 !== checksum) throw new MediaError(409, "A different delivery copy already exists.");
    if (!existing) await env.MEDIA.put(key, bytes, { onlyIf: { etagDoesNotMatch: "*" }, httpMetadata: { contentType: "image/webp" }, customMetadata: { sha256: checksum } });
    return json({ stored: true });
  }
  if (action === "complete" && request.method === "POST") {
    const input = await inputJson(request);
    const width = Number(input.width), height = Number(input.height);
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || width > 8192 || height > 8192 || width*height > 24000000) throw new InputError("Invalid decoded dimensions.");
    const master = `validated/${row.id}/master-v1.webp`, thumb = `validated/${row.id}/thumb-v1.webp`;
    if (!await env.MEDIA.head(master) || !await env.MEDIA.head(thumb) || !await env.MEDIA.head(`validated/${row.id}/preview-v1.webp`)) throw new MediaError(409, "Delivery copies are incomplete. Retry validation.");
    const result = await env.DB.prepare(`UPDATE media_assets SET status = 'ready', master_key = ?, thumbnail_key = ?, width = ?, height = ?, updated_at = ?, validation_token = NULL, validation_until = 0, error = NULL
      WHERE id = ? AND validation_token = ? AND validation_until > ? AND status = 'validating'`).bind(master, thumb, width, height, at(), row.id, lease, Date.now()).run();
    if (!result.meta.changes) throw new MediaError(409, "Validation lease expired. Retry validation.");
    return json({ asset: await metadata(env, row.id) });
  }
  if (action === "fail" && request.method === "POST") {
    const input = await inputJson(request), rejected = input.rejected === true;
    await env.DB.prepare(`UPDATE media_assets SET status = ?, validation_token = NULL, validation_until = 0, error = ?, updated_at = ? WHERE id = ? AND validation_token = ?`)
      .bind(rejected ? "failed" : "uploaded", rejected ? "Image could not be decoded safely. Choose another file." : "Validation interrupted. Retry validation.", at(), row.id, lease).run();
    return json({ asset: await metadata(env, row.id) });
  }
  throw new MediaError(405, "Unsupported media operation.");
}

export async function validateDraftAssets(env: Env, document: Document) {
  if (document.schemaVersion !== 3) return;
  for (const image of document.section.images) {
    if (typeof image === "string") continue;
    const row = await asset(env, image.assetId);
    if (row.status !== "ready" || row.width !== image.width || row.height !== image.height) throw new InputError("An image is not ready or its dimensions changed. Select it again from the media library.");
  }
}
