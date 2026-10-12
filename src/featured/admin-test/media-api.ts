import { protectEditor, testOrigin } from "@/lib/cms/access";
import { workerAdmin, workerOrigin } from "@/lib/cms/worker";
import { InvalidImageError, processImage } from "@/lib/cms/process-image";
import { assetIdPattern, readBytes } from "../../../cms/shared/media";
import { InputError, readBody, record } from "../../../cms/shared/contract";

const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
async function serverMedia(path: string, options: RequestInit = {}) {
  return fetch(`${workerOrigin()}/api/admin/media/${path}`, { ...options, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(30000),
    headers: { Authorization: `Bearer ${process.env.CMS_WRITE_TOKEN!}`, ...options.headers } });
}
async function checked(response: Response) {
  const value = await response.json();
  if (!response.ok) throw new MediaRequestError(response.status, value.error || "Media request failed.");
  return value;
}
class MediaRequestError extends Error { constructor(public status: number, message: string) { super(message); } }

export async function GET(request: Request) {
  const denied = protectEditor(request); if (denied) return denied;
  try {
    const url = new URL(request.url), path = url.pathname.slice("/api/cms/media".length);
    const image = path.match(/^\/([a-f0-9-]+)\/(thumb|master)$/);
    if (image && assetIdPattern.test(image[1])) {
      const response = await serverMedia(`${image[1]}/${image[2] === "master" ? "preview" : "thumb"}`);
      if (!response.ok) return json({ error: "Image is not ready." }, response.status);
      return new Response(response.body, { headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
    }
    if (path !== "" && path !== "/health") return json({ error: "Not found." },404);
    const query = new URLSearchParams({ q: (url.searchParams.get("q") ?? "").slice(0,100), offset: url.searchParams.get("offset") ?? "0" });
    const response = await workerAdmin(path === "/health" ? "media/health" : `media?${query}`);
    return json(await response.json(), response.status);
  } catch { return json({ error: "The media library is temporarily unavailable. Retry shortly." }, 502); }
}

export async function POST(request: Request) {
  const denied = protectEditor(request); if (denied) return denied;
  try {
    if (new URL(request.url).pathname !== "/api/cms/media" || !request.headers.get("content-type")?.startsWith("application/json")) throw new InputError("Invalid media request.");
    const input = record(JSON.parse(await readBody(request)));
    if (input.action === "grant") {
      const result = await checked(await workerAdmin("media/grant", { filename: input.filename, mime: input.mime, bytes: input.bytes, origin: testOrigin() }));
      return json({ ...result, uploadUrl: `${workerOrigin()}${result.uploadPath}` });
    }
    if (typeof input.assetId !== "string" || !assetIdPattern.test(input.assetId)) throw new InputError("Invalid image.");
    if (input.action === "metadata") return json(await checked(await workerAdmin(`media/${input.assetId}/metadata`, { alt: input.alt, archived: input.archived })));
    if (input.action !== "validate") throw new InputError("Unsupported media action.");
    const id = input.assetId;
    const claim = await checked(await workerAdmin(`media/${id}/claim`, {}));
    if (claim.ready) return json({ asset: claim.asset });
    const headers = { "x-media-lease": claim.lease, "Content-Type": "application/json" };
    try {
      const original = await serverMedia(`${id}/source`);
      if (!original.ok) throw new Error("Source unavailable.");
      const processed = await processImage(await readBytes(original), claim.asset.mime_type);
      for (const kind of ["master", "thumb", "preview"] as const) await checked(await serverMedia(`${id}/${kind}`, { method: "PUT", headers: { ...headers, "Content-Type": "image/webp" }, body: new Uint8Array(processed[kind]) }));
      return json(await checked(await serverMedia(`${id}/complete`, { method: "POST", headers, body: JSON.stringify({ width: processed.width, height: processed.height }) })));
    } catch (error) {
      // A lost response may mean completion succeeded. Refresh before changing its state.
      try {
        const current = await checked(await serverMedia(id));
        if (current.asset?.status === "ready") return json(current);
        await serverMedia(`${id}/fail`, { method: "POST", headers, body: JSON.stringify({ rejected: error instanceof InvalidImageError }) });
      } catch { /* Persisted validation lease expires and the library offers a retry. */ }
      throw error;
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Media request failed.";
    if (error instanceof InputError || error instanceof InvalidImageError || error instanceof SyntaxError) return json({ error: detail },400);
    if (error instanceof MediaRequestError) return json({ error: error.message },error.status);
    return json({ error: "Image processing was interrupted. Refresh the library and retry validation; your uploaded original is retained." },502);
  }
}
