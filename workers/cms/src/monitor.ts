import type { Env } from "./index";
import { contentMediaReady, heroMediaReady, ogMediaReady } from "./media";
import { limitWorkerSource } from "./throttle";

// A separate read-only credential. This endpoint never reads drafts or writes
// publication/content records and never accepts the editor's write credential.
export async function monitorStatus(request: Request, env: Env): Promise<Response> {
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  const token = env.CMS_MONITOR_TOKEN;
  if (!token || token.length < 32 || token === env.CMS_WRITE_TOKEN) return Response.json({ error: "Not found." }, { status: 404, headers });
  if (request.method !== "GET") return Response.json({ error: "Method not allowed." }, { status: 405, headers });
  if (request.headers.has("origin")) return Response.json({ error: "Server access only." }, { status: 403, headers });
  if (!await limitWorkerSource(request, env)) return Response.json({ error: "Too many requests." }, { status: 429, headers });
  const candidate = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (!candidate || candidate.length > 512) return Response.json({ error: "Unauthorized." }, { status: 401, headers });
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(token), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(candidate));
  if (!await crypto.subtle.verify("HMAC", key, signature, encoder.encode(token))) return Response.json({ error: "Unauthorized." }, { status: 401, headers });
  const identity = { version: 1, siteId: env.CMS_MONITOR_SITE_ID || "breeze", environment: env.CMS_ENVIRONMENT };
  try {
    const columns = await env.DB.prepare("PRAGMA table_info(cms_publish_outbox)").all<{ name: string }>();
    const schemaReady = columns.results.some(column => column.name === "lease_token") &&
      await contentMediaReady(env) && await ogMediaReady(env) && await heroMediaReady(env);
    if (env.MEDIA) await env.MEDIA.head("media-health-check");
    const pending = await env.DB.prepare(`SELECT COUNT(*) AS count, MIN(r.published_at) AS oldest
      FROM cms_publish_outbox o JOIN cms_revisions r ON r.id = o.revision_id
      WHERE o.confirmed_at IS NULL AND r.page_id != 'cms-proof'`).first<{ count: number; oldest: string | null }>();
    const delivered = await env.DB.prepare("SELECT MAX(confirmed_at) AS last FROM cms_publish_outbox").first<{ last: string | null }>();
    return Response.json({ ...identity, ready: Boolean(schemaReady && env.MEDIA),
      pendingPublications: pending?.count || 0, oldestPendingAt: pending?.oldest || null,
      lastSuccessfulDeliveryAt: delivered?.last || null }, { headers });
  } catch {
    return Response.json({ ...identity, ready: false, pendingPublications: 0,
      oldestPendingAt: null, lastSuccessfulDeliveryAt: null }, { status: 503, headers });
  }
}
