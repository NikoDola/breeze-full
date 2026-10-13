import test from "node:test";
import assert from "node:assert/strict";
import { admin, bundle, createWorker, migrate } from "./helpers.mjs";
const load = async path => import(`data:text/javascript;base64,${Buffer.from(await bundle(new URL(path, import.meta.url))).toString("base64")}`);
const { validateRichText } = await load("../../../cms/shared/rich-text.ts");
const { editableHome, validateHomeDocument } = await load("../../../cms/shared/home.ts");
const { homeSeed } = await load("../../../cms/shared/home-seed.ts");
const heading = text => ({ version: 1, content: [{ type: "text", text }] });

test("inline validation rejects executable/unknown structure and bounds complexity", () => {
  const invalid = [
    { ...heading("hello"), html: "<script>alert(1)</script>" },
    { version: 2, content: [] }, { version: 1, content: [{ type: "image", src: "https://evil.example" }] },
    { version: 1, content: [{ type: "break", marks: [] }] },
    ...[{ color: "red" }, { color: "url(javascript:alert(1))" }, { style: {} }, { bold: false }, { italic: "true" }, { content: [] }, { onClick: "alert(1)" }, { attrs: {} }]
      .map(extra => ({ version: 1, content: [{ type: "text", text: "hello", ...extra }] })),
    heading("x".repeat(601)), heading("\0"), heading("   "),
    { version: 1, content: Array.from({ length: 257 }, () => ({ type: "text", text: "x" })) },
    { version: 1, content: [...Array.from({ length: 9 }, () => ({ type: "break" })), { type: "text", text: "hello" }] },
    JSON.parse('{"version":1,"content":[{"type":"text","text":"x","__proto__":{"polluted":true}}]}'),
  ];
  for (const value of invalid) assert.throws(() => validateRichText(value), undefined, JSON.stringify(value));
  assert.deepEqual(validateRichText(heading("<img src=x onerror=alert(1)>")), heading("<img src=x onerror=alert(1)>"), "markup-like text stays literal text");
  assert.deepEqual(validateRichText({ version: 1, content: [] }, "Heading", false), { version: 1, content: [] });
});

test("normalization is stable and conversion preserves history without changing schemaVersion 3", () => {
  const original = JSON.stringify(homeSeed), converted = editableHome(homeSeed);
  assert.equal(converted.schemaVersion, 2); assert.equal(converted.templateVersion, 2);
  assert.deepEqual(validateHomeDocument(homeSeed), homeSeed);
  assert.deepEqual(validateHomeDocument(converted), converted);
  assert.deepEqual(editableHome(converted), converted);
  assert.equal(JSON.stringify(homeSeed), original);
  assert.deepEqual(converted.slots.seasons.content.heading.content, [
    { type: "text", text: "A good day starts" }, { type: "break" }, { type: "text", text: "at the " },
    { type: "text", text: "right temperature.", color: "accent" },
  ]);
  assert.deepEqual(validateRichText({ version: 1, content: [
    { type: "text", color: "accent", bold: true, text: "A" },
    { bold: true, text: "B", type: "text", color: "accent" },
  ] }), { version: 1, content: [{ type: "text", text: "AB", bold: true, color: "accent" }] });
  const mismatched = structuredClone(converted); mismatched.slots.contact.version = 1;
  assert.throws(() => validateHomeDocument(mismatched));
});

test("rich drafts preserve old revisions, enforce conflicts and retry one immutable publication", async t => {
  const mf = await createWorker(); t.after(() => mf.dispose());
  const db = await mf.getD1Database("DB"); await migrate(db);
  await admin(mf, "import", { pageId: "home" });
  const old = await (await admin(mf, "publish", { pageId: "home", expectedVersion: 1 })).json();
  const history = await db.prepare("SELECT document_json FROM cms_revisions WHERE id = ?").bind(old.publication.revisionId).first();
  const doc = editableHome(homeSeed);
  doc.slots.contact.content.heading = { version: 1, content: [{ type: "text", text: "A new heading", bold: true, italic: true, color: "accent" }] };
  assert.equal((await admin(mf, "draft", { pageId: "home", document: doc, expectedVersion: 1 })).status, 200);
  assert.equal((await admin(mf, "draft", { pageId: "home", document: homeSeed, expectedVersion: 1 })).status, 409);
  const bad = structuredClone(doc); bad.slots.contact.content.heading.content[0].color = "red";
  assert.equal((await admin(mf, "draft", { pageId: "home", document: bad, expectedVersion: 2 })).status, 400);
  assert.equal((await (await mf.dispatchFetch("https://worker.test/api/public/pages/home")).json()).revisionId, old.publication.revisionId);
  const state = await (await admin(mf, "publish", { pageId: "home", expectedVersion: 2 })).json();
  const first = (await (await admin(mf, "delivery/claim", { pageId: "home", force: true })).json()).claim;
  await admin(mf, "delivery/ack", { pageId: "home", eventId: first.event.eventId, leaseToken: first.leaseToken, stage: "failed", reason: "invalidation" });
  const retry = (await (await admin(mf, "delivery/claim", { pageId: "home", force: true })).json()).claim;
  assert.equal(retry.event.revisionId, state.publication.revisionId);
  assert.equal((await (await admin(mf, "publish", { pageId: "home", expectedVersion: 2 })).json()).publication.revisionId, state.publication.revisionId);
  assert.equal((await db.prepare("SELECT count(*) n FROM cms_revisions WHERE page_id = 'home'").first()).n, 2);
  assert.deepEqual(await db.prepare("SELECT document_json FROM cms_revisions WHERE id = ?").bind(old.publication.revisionId).first(), history);
  // Older content can be restored through a new draft/publication, never editing history.
  await admin(mf, "draft", { pageId: "home", document: homeSeed, expectedVersion: 2 });
  const restored = await (await admin(mf, "publish", { pageId: "home", expectedVersion: 3 })).json();
  assert.deepEqual(restored.publication.document, homeSeed);
  assert.notEqual(restored.publication.revisionId, old.publication.revisionId);
});
