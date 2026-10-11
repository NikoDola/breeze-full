import {
  PAGE_ID, PUBLIC_PATH, InputError, expectedVersion, importLegacy,
  readBody, record, validateDocument, type Document, type DeliveryClaim,
} from "../../../cms/shared/contract";

export interface Env {
  DB: D1Database;
  CMS_ENVIRONMENT: string;
  CMS_WRITES_ENABLED: string;
  CMS_WRITE_TOKEN?: string;
}
class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
type Revision = { id: string; draft_version: number; document_json: string; published_at: string };
type Job = { id: string; revision_id: string; attempts: number };
const json = (value: unknown, status = 200) => Response.json(value, {
  status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
});
const writesEnabled = (env: Env) => env.CMS_ENVIRONMENT === "test" && env.CMS_WRITES_ENABLED === "true" && (env.CMS_WRITE_TOKEN?.length ?? 0) >= 32;

async function authorize(request: Request, env: Env, health = false) {
  if (env.CMS_ENVIRONMENT !== "test" || (env.CMS_WRITE_TOKEN?.length ?? 0) < 32 || (!health && !writesEnabled(env))) throw new HttpError(404, "Not found.");
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
    env.DB.prepare(`SELECT o.revision_id, r.draft_version, o.attempts, o.invalidated_at, o.confirmed_at, o.last_error, o.next_attempt_at, o.lease_until
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
// The Worker never calls Vercel and never receives a Vercel credential.
async function claimDelivery(env: Env, force: boolean): Promise<DeliveryClaim | null> {
  const now = Date.now(), leaseToken = crypto.randomUUID();
  const row = await env.DB.prepare(`UPDATE cms_publish_outbox
    SET lease_until = ?, lease_token = ?, attempts = attempts + 1, invalidated_at = NULL
    WHERE revision_id = (SELECT published_revision_id FROM cms_pages WHERE id = ?)
      AND confirmed_at IS NULL AND lease_until < ? AND (? = 1 OR next_attempt_at <= ?)
    RETURNING id, revision_id, attempts`)
    .bind(now + 90000, leaseToken, PAGE_ID, now, force ? 1 : 0, now).first<Job>();
  if (!row) return null;
  const revision = await env.DB.withSession("first-primary").prepare("SELECT draft_version FROM cms_revisions WHERE id = ?")
    .bind(row.revision_id).first<{ draft_version: number }>();
  if (!revision) throw new Error("Revision missing.");
  return { leaseToken, event: { eventId: row.id, revisionId: row.revision_id,
    pageId: PAGE_ID, path: PUBLIC_PATH, version: revision.draft_version } };
}
const deliveryErrors: Record<string, string> = {
  identity: "Preview identity unavailable. Publication is saved; retry cache refresh.",
  invalidation: "Cache invalidation failed. Publication is saved; retry cache refresh.",
  verification: "Published revision is not confirmed on the public page. Retry cache refresh.",
};
async function acknowledge(env: Env, input: Record<string, unknown>) {
  if (typeof input.eventId !== "string" || typeof input.leaseToken !== "string" ||
      !/^[a-f0-9-]{36}$/.test(input.eventId) || !/^[a-f0-9-]{36}$/.test(input.leaseToken)) {
    throw new InputError("Invalid delivery acknowledgement.");
  }
  const now = Date.now(), at = new Date(now).toISOString();
  let statement: D1PreparedStatement;
  const predicate = "WHERE id = ? AND lease_token = ? AND lease_until > ? AND confirmed_at IS NULL";
  if (input.stage === "invalidated") {
    statement = env.DB.prepare(`UPDATE cms_publish_outbox SET invalidated_at = ? ${predicate}`)
      .bind(at, input.eventId, input.leaseToken, now);
  } else if (input.stage === "confirmed") {
    statement = env.DB.prepare(`UPDATE cms_publish_outbox SET confirmed_at = ?, last_error = NULL,
      lease_until = 0, lease_token = NULL, next_attempt_at = 0 ${predicate} AND invalidated_at IS NOT NULL`)
      .bind(at, input.eventId, input.leaseToken, now);
  } else if (input.stage === "failed" && typeof input.reason === "string" && Object.hasOwn(deliveryErrors, input.reason)) {
    statement = env.DB.prepare(`UPDATE cms_publish_outbox SET last_error = ?, lease_until = 0, lease_token = NULL,
      next_attempt_at = ? + MIN(3600000, 30000 * (1 << MIN(attempts - 1, 7))) ${predicate}`)
      .bind(deliveryErrors[input.reason], now, input.eventId, input.leaseToken, now);
  } else throw new InputError("Invalid delivery stage.");
  const result = await statement.run();
  if (!result.meta.changes) throw new HttpError(409, "Delivery lease expired, already completed, or stage is out of order. Refresh status.");
  if (input.stage === "confirmed") {
    // A confirmed newer snapshot also fulfills older publications; never restore an old snapshot.
    await env.DB.prepare(`UPDATE cms_publish_outbox SET confirmed_at = ?, invalidated_at = COALESCE(invalidated_at, ?),
      last_error = NULL, lease_until = 0, lease_token = NULL, next_attempt_at = 0
      WHERE confirmed_at IS NULL AND revision_id IN (SELECT id FROM cms_revisions WHERE page_id = ? AND draft_version < (
        SELECT r.draft_version FROM cms_revisions r JOIN cms_publish_outbox o ON o.revision_id = r.id WHERE o.id = ?))`)
      .bind(at, at, PAGE_ID, input.eventId).run();
  }
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
      await authorize(request, env, path === "/api/admin/health" && request.method === "GET");
      if (request.method === "GET" && path === "/api/admin/health") {
        const columns = await env.DB.prepare("PRAGMA table_info(cms_publish_outbox)").all<{ name: string }>();
        return json({ environment: env.CMS_ENVIRONMENT, writesEnabled: writesEnabled(env),
          schemaReady: columns.results.some(column => column.name === "lease_token"), deliveryOwner: "nextjs" });
      }
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
        case "/api/admin/publish": await publish(env, expectedVersion(input.expectedVersion)); break;
        case "/api/admin/delivery/claim": return json({ claim: await claimDelivery(env, input.force === true) });
        case "/api/admin/delivery/ack": await acknowledge(env, input); break;
        default: return json({ error: "Not found." }, 404);
      }
      return json(await editorState(env));
    } catch (error) {
      if (error instanceof HttpError || error instanceof InputError) return json({ error: error.message }, error.status);
      return json({ error: "CMS request failed. Check the test database configuration and Worker logs." }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
