import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { admin, createWorker, legacy, migrate, revalidationSecret } from "./helpers.mjs";

test("D1 workflow: migration, authorization, drafts, atomic immutable publication and retries", async t => {
  let callbackWorks = false, db;
  const mf = await createWorker({ outboundService: async request => {
    if (new URL(request.url).pathname === "/api/cms/revalidate") {
      const body = await request.text();
      assert.equal(request.headers.get("x-cms-signature"), createHmac("sha256", revalidationSecret).update(`${request.headers.get("x-cms-timestamp")}.${body}`).digest("hex"));
      return Response.json(callbackWorks ? { eventId: JSON.parse(body).eventId } : { error: "test outage" }, { status: callbackWorks ? 200 : 503 });
    }
    const row = await db.prepare("SELECT r.id, r.draft_version FROM cms_pages p JOIN cms_revisions r ON r.id = p.published_revision_id").first();
    return new Response(`<div data-cms-revision="${row.id}" data-cms-version="${row.draft_version}"></div>`);
  } });
  t.after(() => mf.dispose());
  db = await mf.getD1Database("DB");
  await db.prepare("CREATE TABLE page_sections (id TEXT PRIMARY KEY, headline TEXT)").run();
  await db.prepare("INSERT INTO page_sections VALUES (?, ?)").bind("home-hero", "Keep this original").run();
  await migrate(db);
  await t.test("migration preserves the existing table and data", async () => {
    assert.equal((await db.prepare("SELECT headline FROM page_sections WHERE id = ?").bind("home-hero").first()).headline, "Keep this original");
  });
  await t.test("admin requires a server credential and rejects browser-origin calls", async () => {
    assert.equal((await mf.dispatchFetch("https://worker.test/api/admin/proof")).status, 401);
    assert.equal((await admin(mf, "proof", undefined, { origin: "https://evil.example" })).status, 403);
    assert.equal((await admin(mf, "proof", undefined, { authorization: "Bearer wrong" })).status, 401);
    assert.equal((await mf.dispatchFetch("https://worker.test/api/public/pages/cms-proof")).status, 404);
  });
  let state;
  await t.test("import is idempotent and retains all source fields", async () => {
    assert.equal((await admin(mf, "import", { source: legacy })).status, 200);
    state = await (await admin(mf, "import", { source: { ...legacy, headline: "Do not replace existing draft" } })).json();
    assert.equal(state.draft.document.section.headline, legacy.headline);
    const source = await db.prepare("SELECT source_json FROM cms_imports").first();
    assert.deepEqual(JSON.parse(source.source_json), legacy);
    assert.equal((await mf.dispatchFetch("https://worker.test/api/public/pages/cms-proof")).status, 404);
  });
  await t.test("callback outage preserves publication with a durable retry; duplicate publish is idempotent", async () => {
    state = await (await admin(mf, "publish", { expectedVersion: 1 })).json();
    const id = state.publication.revisionId;
    assert.equal(state.publication.version, 1);
    assert.equal(state.delivery.confirmed_at, null);
    assert.match(state.delivery.last_error, /503/);
    state = await (await admin(mf, "publish", { expectedVersion: 1 })).json();
    assert.equal(state.publication.revisionId, id);
    assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM cms_revisions").first()).n, 1);
    assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM cms_publish_outbox").first()).n, 1);
  });
  await t.test("published revision updates and deletes are rejected by SQLite", async () => {
    await assert.rejects(() => db.prepare("UPDATE cms_revisions SET document_json = '{}'").run(), /immutable/);
    await assert.rejects(() => db.prepare("DELETE FROM cms_revisions").run(), /immutable/);
  });
  await t.test("racing saves cannot overwrite each other, and drafts remain private", async () => {
    const document = structuredClone(state.draft.document);
    document.section.headline = "Unpublished draft";
    const results = await Promise.all([admin(mf, "draft", { expectedVersion: 1, document }), admin(mf, "draft", { expectedVersion: 1, document })]);
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
    const publicContent = await (await mf.dispatchFetch("https://worker.test/api/public/pages/cms-proof")).json();
    assert.equal(publicContent.document.section.headline, legacy.headline);
    assert.equal((await admin(mf, "publish", { expectedVersion: 1 })).status, 409);
  });
  await t.test("a failed outbox insert rolls back snapshot and public pointer together", async () => {
    await db.prepare("CREATE TRIGGER fail_outbox BEFORE INSERT ON cms_publish_outbox BEGIN SELECT RAISE(ABORT, 'injected failure'); END").run();
    assert.equal((await admin(mf, "publish", { expectedVersion: 2 })).status, 500);
    assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM cms_revisions").first()).n, 1);
    assert.equal((await (await admin(mf)).json()).publication.version, 1);
    await db.prepare("DROP TRIGGER fail_outbox").run();
  });
  await t.test("delivery recovers and confirms current HTML, including a superseded event", async () => {
    callbackWorks = true;
    state = await (await admin(mf, "publish", { expectedVersion: 2 })).json();
    assert.equal(state.publication.version, 2);
    assert.ok(state.delivery.invalidated_at);
    assert.ok(state.delivery.confirmed_at);
    assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM cms_publish_outbox WHERE confirmed_at IS NULL").first()).n, 0);
  });
  await t.test("invalid links and oversized bodies cannot become drafts", async () => {
    const document = structuredClone(state.draft.document);
    document.section.button_route = "javascript:alert(1)";
    assert.equal((await admin(mf, "draft", { expectedVersion: 2, document })).status, 400);
    assert.equal((await admin(mf, "draft", { excess: "x".repeat(50000) })).status, 400);
    assert.equal((await (await admin(mf)).json()).draft.version, 2);
  });
});

test("writes fail closed when disabled or configured as production", async () => {
  for (const bindings of [{ CMS_WRITES_ENABLED: "false" }, { CMS_ENVIRONMENT: "production" }, { CMS_WRITE_TOKEN: "" }]) {
    const mf = await createWorker({ bindings });
    try { assert.equal((await admin(mf, "import", { source: legacy })).status, 404); }
    finally { await mf.dispose(); }
  }
});
