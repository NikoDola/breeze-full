import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { build } from "esbuild";
import { admin, bundle, createWorker, legacy, migrate, root } from "./helpers.mjs";

const load = async path => import(`data:text/javascript;base64,${Buffer.from(await bundle(new URL(path, import.meta.url))).toString("base64")}`);
const { homeSeed } = await load("../../../cms/shared/home-seed.ts");
const { validatePageDocument, validateEvent } = await load("../../../cms/shared/contract.ts");
const { confirmsPublication } = await load("../../../cms/shared/publication-marker.ts");

test("homepage seed renders the original markup; hero, form and public CSS are unchanged", async () => {
  const baseline = JSON.parse(await readFile(new URL("./fixtures/home-baseline.json", import.meta.url), "utf8"));
  const require = createRequire(resolve(root, "package.json"));
  for (const [name, slot] of Object.entries({ SeasonsSection: "seasons", ContactSection: "contact", ReviewsSection: "reviews", AreaSection: "area" })) {
    const result = await build({ stdin: { contents: `import { createElement } from 'react'; import { renderToStaticMarkup } from 'react-dom/server'; import Section from './src/components/sections/home/${name}'; import {homeSeed} from './cms/shared/home-seed'; import {editableHome} from './cms/shared/home'; export const original = renderToStaticMarkup(createElement(Section)); export const seeded = renderToStaticMarkup(createElement(Section, {content: homeSeed.slots.${slot}.content})); export const rich = renderToStaticMarkup(createElement(Section, {content: editableHome(homeSeed).slots.${slot}.content}));`, resolveDir: root },
      bundle: true, write: false, outfile: "section.cjs", platform: "node", format: "cjs", packages: "external", alias: { "@": resolve(root, "src") }, jsx: "automatic" });
    const module = { exports: {} }; new Function("require", "module", "exports", result.outputFiles[0].text)(require, module, module.exports);
    assert.equal(module.exports.original, baseline.sections[name], `${name} default markup changed`);
    assert.equal(module.exports.seeded, baseline.sections[name], `${name} CMS markup changed`);
    assert.equal(module.exports.rich, baseline.sections[name], `${name} converted heading markup changed`);
  }
  for (const [file, hash] of Object.entries(baseline.protectedFiles)) assert.equal(createHash("sha256").update(await readFile(resolve(root, file))).digest("hex"), hash, file);
});

test("v2 contract permits content edits but rejects layout changes, unsafe links and cross-page documents", () => {
  assert.deepEqual(validatePageDocument("home", homeSeed), homeSeed);
  const invalid = mutate => { const doc = structuredClone(homeSeed); mutate(doc); assert.throws(() => validatePageDocument("home", doc)); };
  invalid(doc => { doc.slots.hero = {}; });
  invalid(doc => { delete doc.slots.area; });
  invalid(doc => { doc.slots.contact.content.form = []; });
  invalid(doc => { doc.slots.seasons.content.cards.reverse(); });
  invalid(doc => { doc.slots.reviews.content.items[1].id = doc.slots.reviews.content.items[0].id; });
  invalid(doc => { doc.slots.area.content.mapsHref = "javascript:alert(1)"; });
  invalid(doc => { doc.slots.area.content.mapsHref = "https://evil.example/maps"; });
  invalid(doc => { doc.slots.contact.version = 2; });
  invalid(doc => { doc.slots.reviews.content.items = []; });
  assert.throws(() => validatePageDocument("cms-proof", homeSeed));
  const event = { eventId: crypto.randomUUID(), revisionId: crypto.randomUUID(), pageId: "home", path: "/", version: 1 };
  assert.deepEqual(validateEvent(event), event);
  for (const value of [{ ...event, path: "/about-us" }, { ...event, pageId: "cms-proof" }, { ...event, pageId: undefined }, { ...event, pageId: "__proto__" }]) assert.throws(() => validateEvent(value));
  const marker = `<section data-cms-page="home" data-cms-version="1" data-cms-revision="${event.revisionId}">`;
  assert.ok(confirmsPublication(marker, event));
  assert.ok(!confirmsPublication(marker.replace('page="home"', 'page="cms-proof"'), event));
  assert.ok(!confirmsPublication(marker.replaceAll('"', '\\"'), event));
  assert.ok(!confirmsPublication(marker.replace('version="1"', 'version="0"'), event));
  assert.ok(!confirmsPublication(marker.replace(' data-cms-version', '></section><div data-cms-version'), event));
});

test("home import, drafts, immutable publication and delivery remain isolated from v1 content", async t => {
  const mf = await createWorker(); t.after(() => mf.dispose());
  const db = await mf.getD1Database("DB"); await migrate(db);
  await admin(mf, "import", { source: legacy });
  const proof = await (await admin(mf, "publish", { expectedVersion: 1 })).json();
  const oldRows = await db.prepare("SELECT * FROM cms_revisions WHERE page_id = 'cms-proof'").all();
  let state = await (await admin(mf, "import", { pageId: "home", source: { malicious: "ignored" } })).json();
  assert.deepEqual(state.draft.document, homeSeed);
  assert.equal((await mf.dispatchFetch("https://worker.test/api/public/pages/home")).status, 404);
  const doc = structuredClone(homeSeed); doc.slots.contact.content.intro = "A private homepage draft";
  assert.equal((await admin(mf, "draft", { pageId: "cms-proof", expectedVersion: 1, document: doc })).status, 400);
  assert.equal((await admin(mf, "draft", { pageId: "home", expectedVersion: 1, document: proof.draft.document })).status, 400);
  assert.equal((await admin(mf, "draft", { pageId: "home", expectedVersion: 1, document: doc })).status, 200);
  state = await (await admin(mf, "import", { pageId: "home" })).json();
  assert.deepEqual(state.draft.document, doc);
  assert.equal((await mf.dispatchFetch("https://worker.test/api/public/pages/home")).status, 404);
  state = await (await admin(mf, "publish", { pageId: "home", expectedVersion: 2 })).json();
  const revision = state.publication.revisionId;
  assert.equal((await (await admin(mf, "publish", { pageId: "home", expectedVersion: 2 })).json()).publication.revisionId, revision);
  assert.equal((await (await mf.dispatchFetch("https://worker.test/api/public/pages/home")).json()).revisionId, revision);
  await assert.rejects(() => db.prepare("UPDATE cms_revisions SET document_json = '{}' WHERE id = ?").bind(revision).run(), /immutable/);
  const { claim } = await (await admin(mf, "delivery/claim", { pageId: "home", force: true })).json();
  assert.equal(claim.event.path, "/"); assert.equal(claim.event.pageId, "home");
  const ack = { eventId: claim.event.eventId, leaseToken: claim.leaseToken };
  assert.equal((await admin(mf, "delivery/ack", { ...ack, stage: "invalidated", pageId: "cms-proof" })).status, 409);
  assert.equal((await admin(mf, "delivery/ack", { ...ack, stage: "failed", reason: "invalidation", pageId: "home" })).status, 200);
  const retry = (await (await admin(mf, "delivery/claim", { pageId: "home", force: true })).json()).claim;
  assert.equal(retry.event.revisionId, revision);
  for (const stage of ["invalidated", "confirmed"]) assert.equal((await admin(mf, "delivery/ack", { pageId: "home", eventId: retry.event.eventId, leaseToken: retry.leaseToken, stage })).status, 200);
  assert.equal((await db.prepare("SELECT COUNT(*) n FROM cms_revisions WHERE page_id = 'home'").first()).n, 1);
  assert.deepEqual((await db.prepare("SELECT * FROM cms_revisions WHERE page_id = 'cms-proof'").all()).results, oldRows.results);
  assert.equal((await (await admin(mf)).json()).delivery.confirmed_at, null, "confirming home must not retire proof jobs");
  assert.equal((await admin(mf, "proof?pageId=about-us")).status, 400);
});
