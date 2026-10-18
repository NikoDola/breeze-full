import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { build } from "esbuild";
import { admin, bundle, createWorker, migrate, root } from "./helpers.mjs";

const require = createRequire(resolve(root, "package.json"));
const load = async path => import(`data:text/javascript;base64,${Buffer.from(await bundle(new URL(path, import.meta.url))).toString("base64")}`);
const { contentDefinitions, validateContentDocument, contentAssets } = await load("../../../cms/shared/content.ts");
const { validateReviews } = await load("../../../cms/shared/collections.ts");
const { createReviewsSeed } = await load("../../../cms/shared/collection-seeds.ts");
const placement = { assetId: "f27a01a0-4ab9-4cba-b399-16fefffa7596", alt: "Breeze service team", decorative: false, width: 1200, height: 630 };

async function loadComponent(path) {
  const output = await build({ entryPoints: [resolve(root, path)], bundle: true, write: false, outfile: "og-test.cjs",
    platform: "node", format: "cjs", packages: "external", jsx: "automatic", alias: { "@": resolve(root, "src") } });
  const module = { exports: {} };
  new Function("require", "module", "exports", output.outputFiles[0].text)(name => name === "server-only" ? {} : require(name), module, module.exports);
  return module.exports;
}

test("OG image validation preserves old snapshots and accepts only approved images or valid placements", () => {
  for (const [seed, validate] of [[contentDefinitions.heating.seed, validateContentDocument], [createReviewsSeed(), validateReviews]]) {
    assert.deepEqual(validate(seed), seed);
    for (const ogImage of [null, "/images/Guy-working.jpg", placement]) assert.deepEqual(validate({ ...seed, ogImage }).ogImage, ogImage);
    for (const ogImage of [undefined, "", "https://example.com/image.jpg", "/images/../secret.jpg", { ...placement, width: 0 }, { ...placement, assetId: "not-an-asset" }]) {
      assert.throws(() => validate({ ...seed, ogImage }));
    }
  }
  assert.deepEqual(contentAssets({ ...contentDefinitions.heating.seed, ogImage: placement }), [placement]);
});

test("content and Reviews OG uploads stay private until atomic publication and survive replacement in history", async t => {
  const mf = await createWorker(); t.after(() => mf.dispose());
  const db = await mf.getD1Database("DB"); await migrate(db);
  const bucket = await mf.getR2Bucket("MEDIA");
  for (const [pageId, seed] of [["heating", contentDefinitions.heating.seed], ["reviews", createReviewsSeed()]]) {
    await admin(mf, "import", { pageId });
    const assetId = crypto.randomUUID(), document = { ...seed, ogImage: { ...placement, assetId } };
    assert.equal((await admin(mf, "draft", { pageId, expectedVersion: 1, document })).status, 404);
    await db.prepare("INSERT INTO media_assets (id, filename, mime_type, original_key, original_bytes, master_key, thumbnail_key, width, height, status, created_at, updated_at) VALUES (?, 'social.png', 'image/png', ?, 12, ?, ?, 1200, 630, 'ready', 'now', 'now')")
      .bind(assetId, `${assetId}/original`, `${assetId}/master`, `${assetId}/thumb`).run();
    await bucket.put(`${assetId}/master`, "fixture-byte");
    const url = `https://worker.test/media/${assetId}/master-v1.webp`;
    const bad = { ...document, ogImage: { ...document.ogImage, width: 999 } };
    assert.equal((await admin(mf, "draft", { pageId, expectedVersion: 1, document: bad })).status, 400);
    assert.equal((await admin(mf, "draft", { pageId, expectedVersion: 1, document })).status, 200);
    assert.deepEqual((await (await admin(mf, `proof?pageId=${pageId}`)).json()).draft.document.ogImage, document.ogImage);
    assert.equal((await mf.dispatchFetch(url)).status, 404);
    await db.prepare("CREATE TRIGGER reject_og_outbox BEFORE INSERT ON cms_publish_outbox BEGIN SELECT RAISE(ABORT, 'test rollback'); END").run();
    assert.equal((await admin(mf, "publish", { pageId, expectedVersion: 2 })).status, 500);
    assert.equal((await db.prepare("SELECT COUNT(*) n FROM revision_assets WHERE asset_id = ?").bind(assetId).first()).n, 0);
    assert.equal((await mf.dispatchFetch(url)).status, 404);
    await db.prepare("DROP TRIGGER reject_og_outbox").run();
    assert.equal((await admin(mf, "publish", { pageId, expectedVersion: 2 })).status, 200);
    assert.equal((await mf.dispatchFetch(url)).status, 200);
    assert.deepEqual((await (await mf.dispatchFetch(`https://worker.test/api/public/pages/${pageId}`)).json()).document.ogImage, document.ogImage);
    assert.equal((await db.prepare("SELECT COUNT(*) n FROM revision_assets WHERE asset_id = ?").bind(assetId).first()).n, 1);
    assert.equal((await admin(mf, "draft", { pageId, expectedVersion: 2, document: { ...seed, ogImage: null } })).status, 200);
    assert.equal((await admin(mf, "publish", { pageId, expectedVersion: 3 })).status, 200);
    assert.equal((await mf.dispatchFetch(url)).status, 200, "historical images remain available");
    await assert.rejects(() => db.prepare("INSERT INTO cms_revisions(id,page_id,draft_version,document_json,published_at) VALUES (?, ?, 999, ?, 'now')").bind(crypto.randomUUID(), pageId, JSON.stringify(bad)).run(), /unavailable OG media/);
  }
  await db.prepare("DROP TRIGGER og_media_capture_publication").run();
  assert.equal((await (await admin(mf, "health")).json()).schemaReady, false);
  for (const [pageId, seed] of [["heating", contentDefinitions.heating.seed], ["reviews", createReviewsSeed()]]) {
    assert.equal((await admin(mf, "draft", { pageId, expectedVersion: 3, document: { ...seed, ogImage: placement } })).status, 503);
  }
});

test("sharing metadata uses public media URLs and keeps the selected image out of no-image pages", async t => {
  const saved = Object.fromEntries(["CMS_WORKER_URL", "VERCEL"].map(key => [key, process.env[key]]));
  t.after(() => { for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  delete process.env.VERCEL;
  const { pageMetadata } = await loadComponent("src/lib/cms/metadata.ts");
  for (const origin of ["https://breeze-test-api.example.com", "https://breeze-live-api.example.com", "http://127.0.0.1:8787"]) {
    process.env.CMS_WORKER_URL = origin;
    const metadata = pageMetadata("Heating", "Page description", placement);
    assert.equal(metadata.openGraph.images[0].url, `${origin}/media/${placement.assetId}/master-v1.webp`);
    assert.equal(metadata.openGraph.images[0].width, 1200);
    assert.equal(metadata.openGraph.images[0].height, 630);
    assert.equal(metadata.openGraph.images[0].alt, placement.alt);
    assert.equal(metadata.openGraph.title, "Heating");
    assert.equal(metadata.openGraph.description, "Page description");
    assert.equal(metadata.twitter.card, "summary_large_image");
    assert.deepEqual(metadata.twitter.images, metadata.openGraph.images);
  }
  delete process.env.CMS_WORKER_URL;
  assert.equal(pageMetadata("Heating", "Description", "/images/Guy-working.jpg").openGraph.images[0].url, "/images/Guy-working.jpg");
  for (const image of [undefined, null]) assert.deepEqual(pageMetadata("Heating", "Description", image), { title: "Heating", description: "Description" });
});

test("Search settings selects, replaces and removes OG images through the existing upload library", async t => {
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM("<!doctype html><div id='app'></div>", { url: "http://localhost", pretendToBeVisual: true });
  const saved = new Map();
  const asset = { id: placement.assetId, filename: "social.png", status: "ready", width: 1200, height: 630, default_alt: placement.alt, original_bytes: 1200 };
  for (const [key, value] of Object.entries({ window: dom.window, self: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node, IS_REACT_ACT_ENVIRONMENT: true,
    fetch: async () => Response.json({ assets: [asset], nextOffset: null }) })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  t.after(() => { dom.window.close(); for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  const { default: ContentFields } = await loadComponent("src/featured/admin-test/ContentFields.tsx");
  const React = require("react"), { createRoot } = require("react-dom/client");
  const container = document.getElementById("app"), mounted = createRoot(container);
  let current = structuredClone(contentDefinitions.heating.seed), disabled = false;
  const render = () => mounted.render(React.createElement(ContentFields, { document: current, disabled, onBusyChange: () => {}, onChange: next => { current = next; render(); } }));
  const button = label => [...container.querySelectorAll("button")].find(item => item.textContent === label);
  const click = async label => { assert.ok(button(label), label); await React.act(async () => button(label).click()); };
  try {
    await React.act(async () => render());
    await click("Search settings");
    await click("Upload or choose OG image");
    assert.ok(container.querySelector('input[type="file"]'), "existing upload input is available");
    await React.act(async () => new Promise(resolve => setTimeout(resolve, 250)));
    await React.act(async () => container.querySelector('[aria-label="Select social.png"]').click());
    assert.deepEqual(current.ogImage, placement);
    assert.ok(container.querySelector(`img[src*="/api/cms/media/${placement.assetId}/master"]`), "draft uses the authenticated preview");
    await click("Replace OG image");
    await click("Mini-split condenser mounting");
    assert.equal(current.ogImage, "/images/Guy-working.jpg");
    disabled = true; await React.act(async () => render());
    assert.equal(button("Remove OG image").disabled, true);
    disabled = false; await React.act(async () => render());
    await click("Remove OG image");
    assert.equal(current.ogImage, null);
    assert.deepEqual(current.content, contentDefinitions.heating.seed.content);
  } finally { await React.act(async () => mounted.unmount()); }
});
