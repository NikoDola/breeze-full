import {
  PAGE_ID, PUBLIC_PATH, InputError, expectedVersion, importLegacy,
  readBody, record, validateDocument, type Document, type PublishEvent,
} from "../../../cms/shared/contract";
import { sign } from "../../../cms/shared/signature";

export interface Env {
  DB: D1Database;
  CMS_ENVIRONMENT: string;
  CMS_WRITES_ENABLED: string;
  CMS_WRITE_TOKEN?: string;
  CMS_REVALIDATE_SECRET?: string;
  CMS_SITE_ORIGIN?: string;
  VERCEL_AUTOMATION_BYPASS_SECRET?: string;
}
class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
type Revision = { id: string; draft_version: number; document_json: string; published_at: string };
type Job = { id: string; revision_id: string; draft_version: number; attempts: number };
const json = (value: unknown, status = 200) => Response.json(value, {
  status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
});
const writesEnabled = (env: Env) => env.CMS_ENVIRONMENT === "test" && env.CMS_WRITES_ENABLED === "true" && (env.CMS_WRITE_TOKEN?.length ?? 0) >= 32;

async function authorize(request: Request, env: Env) {
  if (!writesEnabled(env)) throw new HttpError(404, "Not found.");
  const authorization = request.headers.get("authorization") ?? "";
  const candidate = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!candidate || candidate.length > 512) throw new HttpError(401, "Unauthorized.");
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(env.CMS_WRITE_TOKEN!), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(candidate));
  if (!await crypto.subtle.verify("HMAC", key, signature, encoder.encode(env.CMS_WRITE_TOKEN!))) throw new HttpError(401, "Unauthorized.");
  // Browsers never call this API directly. No CORS permissions are granted.
  if (request.headers.has("origin")) throw new HttpError(403, "Use the server-side editor API.");
}
function publication(row: Revision | null) {
  return row ? { revisionId: row.id, version: row.draft_version, document: JSON.parse(row.document_json) as Document, publishedAt: row.published_at } : null;
}
async function readPublication(env: Env) {
  // Always begin at the primary: a freshly invalidated Next cache must not fill from a lagging replica.
  const started = performance.now();
  const row = await env.DB.withSession("first-primary").prepare(`
    SELECT r.* FROM cms_pages p JOIN cms_revisions r ON r.id = p.published_revision_id
    WHERE p.id = ? AND p.slug = ?
  `).bind(PAGE_ID, PAGE_ID).first<Revision>();
  // No content, headers or credentials: this lets preview tests verify actual origin reads.
  console.info(JSON.stringify({ event: "cms.public.d1-read", pageId: PAGE_ID,
    durationMs: Math.round((performance.now() - started) * 100) / 100, published: Boolean(row) }));
  return row;
}
async function editorState(env: Env) {
  const results = await env.DB.withSession("first-primary").batch([
    env.DB.prepare("SELECT version, document_json, updated_at FROM cms_drafts WHERE page_id = ?").bind(PAGE_ID),
    env.DB.prepare("SELECT r.* FROM cms_pages p JOIN cms_revisions r ON r.id = p.published_revision_id WHERE p.id = ?").bind(PAGE_ID),
    env.DB.prepare(`SELECT o.revision_id, r.draft_version, o.attempts, o.invalidated_at, o.confirmed_at, o.last_error, o.next_attempt_at
      FROM cms_pages p JOIN cms_revisions r ON r.id = p.published_revision_id
      JOIN cms_publish_outbox o ON o.revision_id = r.id WHERE p.id = ?`).bind(PAGE_ID),
  ]);
  const draft = results[0].results[0] as { version: number; document_json: string; updated_at: string } | undefined;
  return {
    draft: draft ? { version: draft.version, document: JSON.parse(draft.document_json), updatedAt: draft.updated_at } : null,
    publication: publication(results[1].results[0] as Revision | undefined ?? null),
    delivery: results[2].results[0] ?? null,
  };
}
async function importContent(env: Env, source: unknown) {
  const document = importLegacy(source), now = new Date().toISOString();
  // All inserts are in one transaction; repeated imports never overwrite an edited draft.
  await env.DB.batch([
    env.DB.prepare("INSERT INTO cms_pages (id, slug, page_type) VALUES (?, ?, 'page') ON CONFLICT(id) DO NOTHING").bind(PAGE_ID, PAGE_ID),
    env.DB.prepare("INSERT INTO cms_imports (page_id, source_id, source_json, imported_at) VALUES (?, 'home-hero', ?, ?) ON CONFLICT(page_id) DO NOTHING").bind(PAGE_ID, JSON.stringify(source), now),
    env.DB.prepare("INSERT INTO cms_drafts (page_id, version, document_json, updated_at) VALUES (?, 1, ?, ?) ON CONFLICT(page_id) DO NOTHING").bind(PAGE_ID, JSON.stringify(document), now),
  ]);
}
async function saveDraft(env: Env, input: Record<string, unknown>) {
  const document = validateDocument(input.document), version = expectedVersion(input.expectedVersion);
  const result = await env.DB.prepare(`UPDATE cms_drafts SET document_json = ?, version = version + 1, updated_at = ?
    WHERE page_id = ? AND version = ?`).bind(JSON.stringify(document), new Date().toISOString(), PAGE_ID, version).run();
  if (!result.meta.changes) throw new HttpError(409, "The draft changed in another editor. Reload before saving.");
}
async function publish(env: Env, version: number) {
  const id = crypto.randomUUID(), eventId = crypto.randomUUID(), now = new Date().toISOString();
  // The version predicate is evaluated INSIDE the transaction, including retries and racing editors.
  // Snapshot, public pointer and durable outbox are committed together or rolled back together.
  const result = await env.DB.batch([
    env.DB.prepare(`INSERT INTO cms_revisions (id, page_id, draft_version, document_json, published_at)
      SELECT ?, page_id, version, document_json, ? FROM cms_drafts WHERE page_id = ? AND version = ?
      ON CONFLICT(page_id, draft_version) DO NOTHING`).bind(id, now, PAGE_ID, version),
    env.DB.prepare(`UPDATE cms_pages SET published_revision_id = (
        SELECT id FROM cms_revisions WHERE page_id = ? AND draft_version = ?
      ) WHERE id = ? AND EXISTS (SELECT 1 FROM cms_drafts WHERE page_id = ? AND version = ?)`)
      .bind(PAGE_ID, version, PAGE_ID, PAGE_ID, version),
    env.DB.prepare(`INSERT INTO cms_publish_outbox (id, revision_id)
      SELECT ?, r.id FROM cms_revisions r JOIN cms_drafts d ON d.page_id = r.page_id AND d.version = r.draft_version
      WHERE r.page_id = ? AND r.draft_version = ? ON CONFLICT(revision_id) DO NOTHING`).bind(eventId, PAGE_ID, version),
  ]);
  if (!result[1].meta.changes) throw new HttpError(409, "The saved draft changed. Reload before publishing.");
}
function siteOrigin(env: Env) {
  if (!env.CMS_SITE_ORIGIN || (env.CMS_REVALIDATE_SECRET?.length ?? 0) < 32) throw new Error("Cache delivery is not configured.");
  const url = new URL(env.CMS_SITE_ORIGIN);
  if (url.origin !== env.CMS_SITE_ORIGIN || url.username || url.password ||
    (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))) {
    throw new Error("Invalid test site origin.");
  }
  return url.origin;
}
async function deliver(env: Env, job: Job) {
  const claimed = await env.DB.prepare(`UPDATE cms_publish_outbox SET lease_until = ?, attempts = attempts + 1
    WHERE id = ? AND confirmed_at IS NULL AND lease_until < ?`).bind(Date.now() + 60000, job.id, Date.now()).run();
  if (!claimed.meta.changes) return;
  try {
    const origin = siteOrigin(env);
    const event: PublishEvent = { eventId: job.id, revisionId: job.revision_id, pageId: PAGE_ID, path: PUBLIC_PATH, version: job.draft_version };
    const body = JSON.stringify(event), timestamp = String(Date.now());
    const bypass: Record<string, string> = env.VERCEL_AUTOMATION_BYPASS_SECRET ? { "x-vercel-protection-bypass": env.VERCEL_AUTOMATION_BYPASS_SECRET } : {};
    const response = await fetch(`${origin}/api/cms/revalidate`, {
      method: "POST", redirect: "manual", signal: AbortSignal.timeout(10000), body,
      headers: { ...bypass, "Content-Type": "application/json", "x-cms-timestamp": timestamp, "x-cms-signature": await sign(env.CMS_REVALIDATE_SECRET!, timestamp, body) },
    });
    if (!response.ok) throw new Error(`Cache callback returned ${response.status}.`);
    const ack = await response.json() as { eventId?: string };
    if (ack.eventId !== event.eventId) throw new Error("Cache callback did not acknowledge this event.");
    await env.DB.prepare("UPDATE cms_publish_outbox SET invalidated_at = ? WHERE id = ?").bind(new Date().toISOString(), job.id).run();
    const page = await fetch(`${origin}${PUBLIC_PATH}`, { headers: bypass, redirect: "manual", signal: AbortSignal.timeout(10000) });
    if (!page.ok) throw new Error(`Public page returned ${page.status}.`);
    const html = await readBody(page, 1024 * 1024);
    const visibleVersion = Number(html.match(/data-cms-version="(\d+)"/)?.[1]);
    const visibleId = html.match(/data-cms-revision="([a-f0-9-]+)"/)?.[1];
    // Later revisions also satisfy an older event. Retrying an old event never restores old content.
    if (!(visibleVersion > job.draft_version || (visibleVersion === job.draft_version && visibleId === job.revision_id))) {
      throw new Error("Cache expired; public revision is not visible yet.");
    }
    await env.DB.prepare("UPDATE cms_publish_outbox SET confirmed_at = ?, last_error = NULL, lease_until = 0 WHERE id = ?").bind(new Date().toISOString(), job.id).run();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delivery failed.";
    // No response bodies, secrets or database exceptions are persisted here.
    const safeMessage = /^(Cache|Public|Invalid test)/.test(message) ? message.slice(0, 160) : "Network delivery failed; retry is scheduled.";
    const delay = Math.min(3600000, 30000 * 2 ** Math.min(job.attempts, 7));
    await env.DB.prepare("UPDATE cms_publish_outbox SET last_error = ?, next_attempt_at = ?, lease_until = 0 WHERE id = ?").bind(safeMessage, Date.now() + delay, job.id).run();
  }
}
export async function drainOutbox(env: Env, force = false) {
  if (!writesEnabled(env)) return;
  const jobs = await env.DB.withSession("first-primary").prepare(`SELECT o.id, o.revision_id, o.attempts, r.draft_version
    FROM cms_publish_outbox o JOIN cms_revisions r ON r.id = o.revision_id
    WHERE o.confirmed_at IS NULL AND o.lease_until < ? AND (? = 1 OR o.next_attempt_at <= ?)
    ORDER BY r.draft_version DESC LIMIT 5`).bind(Date.now(), force ? 1 : 0, Date.now()).all<Job>();
  await Promise.all(jobs.results.map(job => deliver(env, job)));
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const path = new URL(request.url).pathname;
      if (request.method === "GET" && path === `/api/public/pages/${PAGE_ID}`) {
        const row = await readPublication(env);
        return row ? json(publication(row)) : json({ error: "Not published." }, 404);
      }
      if (!path.startsWith("/api/admin/")) return json({ error: "Not found." }, 404);
      await authorize(request, env);
      if (request.method === "GET" && path === "/api/admin/proof") return json(await editorState(env));
      if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
      if (!request.headers.get("content-type")?.startsWith("application/json")) throw new InputError("Expected JSON.");
      let input: Record<string, unknown>;
      try { input = record(JSON.parse(await readBody(request))); } catch (error) {
        if (error instanceof InputError) throw error;
        throw new InputError("Invalid JSON.");
      }
      switch (path) {
        case "/api/admin/import": await importContent(env, input.source); break;
        case "/api/admin/draft": await saveDraft(env, input); break;
        case "/api/admin/publish": await publish(env, expectedVersion(input.expectedVersion)); await drainOutbox(env, true); break;
        case "/api/admin/retry": await drainOutbox(env, true); break;
        default: return json({ error: "Not found." }, 404);
      }
      return json(await editorState(env));
    } catch (error) {
      if (error instanceof HttpError || error instanceof InputError) return json({ error: error.message }, error.status);
      return json({ error: "CMS request failed. Check the test database configuration and Worker logs." }, 500);
    }
  },
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) { ctx.waitUntil(drainOutbox(env)); },
} satisfies ExportedHandler<Env>;
