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
const { validateHomeDocument } = await load("../../../cms/shared/home.ts");
const { homeSeed } = await load("../../../cms/shared/home-seed.ts");
const placement = { assetId: "f27a01a0-4ab9-4cba-b399-16fefffa7596", alt: "Wide service team photo", decorative: false, width: 1600, height: 600 };

async function components() {
  const output = await build({ stdin: { resolveDir: root, contents: `
    export { default as View } from './src/components/sections/ContentPageView';
    export { default as Reviews } from './src/components/sections/ReviewsContent';
    export { default as ContentFields } from './src/featured/admin-test/ContentFields';
    export { ReviewsFields } from './src/featured/admin-test/CollectionFields';
    export { site } from './src/lib/site';
  ` }, bundle: true, write: false, outfile: "hero-test.cjs", platform: "node", format: "cjs", packages: "external", jsx: "automatic", alias: { "@": resolve(root, "src") } });
  const module = { exports: {} };
  new Function("require", "module", "exports", output.outputFiles[0].text)(require, module, module.exports);
  return module.exports;
}

test("hero overrides preserve all historical seeds and accept only approved references", () => {
  for (const [seed, validate] of [...Object.values(contentDefinitions).map(({ seed }) => [seed, validateContentDocument]), [createReviewsSeed(), validateReviews]]) {
    assert.deepEqual(validate(seed), seed);
    for (const heroImage of [null, "/images/Guy-working.jpg", placement]) assert.deepEqual(validate({ ...seed, heroImage }).heroImage, heroImage);
    for (const heroImage of [undefined, "", "https://example.com/banner.jpg", "/images/../private.jpg", { ...placement, width: 0 }, { ...placement, assetId: "invalid" }]) assert.throws(() => validate({ ...seed, heroImage }));
  }
  const promotions = { ...contentDefinitions.promotions.seed, heroImage: placement, offerHeroImages: { "winter-promotions": placement, "summer-promotions": null } };
  assert.deepEqual(validateContentDocument(promotions), promotions);
  assert.deepEqual(contentAssets(promotions), [placement, placement]);
  assert.throws(() => validateContentDocument({ ...promotions, offerHeroImages: { other: placement } }));
  assert.throws(() => validateContentDocument({ ...contentDefinitions.heating.seed, offerHeroImages: {} }));
  assert.throws(() => validateHomeDocument({ ...homeSeed, heroImage: placement }), "homepage artwork stays fixed");
});

test("every interior hero renders its override, defaults restore, and seasonal banners stay independent", async () => {
  const { View, Reviews, site } = await components();
  const React = require("react"), { renderToStaticMarkup } = require("react-dom/server");
  const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, { site, ...props }));
  const hero = html => html.match(/<section class="inner-hero"[\s\S]*?<\/section>/)[0];
  for (const [id, definition] of Object.entries(contentDefinitions)) {
    const document = { ...definition.seed, heroImage: placement };
    const preview = hero(render(View, { document, preview: true }));
    assert.ok(preview.includes(`/api/cms/media/${placement.assetId}/master`), id);
    assert.ok(!preview.includes("/media/" + placement.assetId + "/master-v1.webp"), id);
    const published = hero(render(View, { document, mediaOrigin: "https://live.example" }));
    assert.ok(published.includes(`https://live.example/media/${placement.assetId}/master-v1.webp`), id);
    const restored = hero(render(View, { document: { ...document, heroImage: null } }));
    if (definition.image) assert.ok(restored.includes(definition.image), id);
    else assert.ok(!restored.includes("inner-hero-photo"), id);
  }
  const reviews = { ...createReviewsSeed(), heroImage: placement };
  assert.ok(hero(render(Reviews, { document: reviews, preview: true })).includes(`/api/cms/media/${placement.assetId}/master`));
  assert.ok(hero(render(Reviews, { document: reviews, mediaOrigin: "https://live.example" })).includes("https://live.example/media/"));
  const promotions = { ...contentDefinitions.promotions.seed, heroImage: "/images/Guy-working.jpg", offerHeroImages: { "winter-promotions": placement } };
  assert.ok(hero(render(View, { document: promotions })).includes("/images/Guy-working.jpg"));
  assert.ok(hero(render(View, { document: promotions, offerSlug: "winter-promotions", preview: true })).includes(`/api/cms/media/${placement.assetId}/master`));
  assert.ok(hero(render(View, { document: promotions, offerSlug: "summer-promotions" })).includes("/images/summer-promotions.jpg"));
  assert.match(render(View, { document: promotions, offerSlug: "winter-promotions", preview: true }), /src="[^"]*(?:%2Fimages%2F|\/images\/)winter-promotions\.jpg/, "offer body photo is unchanged");
});

test("hero uploads remain private until atomic publication and replacements retain history", async t => {
  const mf = await createWorker(); t.after(() => mf.dispose());
  const db = await mf.getD1Database("DB"); await migrate(db);
  const bucket = await mf.getR2Bucket("MEDIA");
  for (const [pageId, seed] of [["heating", contentDefinitions.heating.seed], ["reviews", createReviewsSeed()], ["promotions", contentDefinitions.promotions.seed]]) {
    await admin(mf, "import", { pageId });
    const assetId = crypto.randomUUID(), image = { ...placement, assetId };
    const withImage = value => pageId === "promotions" ? { ...seed, offerHeroImages: { "winter-promotions": value } } : { ...seed, heroImage: value };
    const document = withImage(image), bad = withImage({ ...image, width: 999 });
    assert.equal((await admin(mf, "draft", { pageId, expectedVersion: 1, document })).status, 404);
    await db.prepare("INSERT INTO media_assets (id, filename, mime_type, original_key, original_bytes, master_key, thumbnail_key, width, height, status, created_at, updated_at) VALUES (?, 'banner.png', 'image/png', ?, 12, ?, ?, 1600, 600, 'ready', 'now', 'now')")
      .bind(assetId, `${assetId}/original`, `${assetId}/master`, `${assetId}/thumb`).run();
    await bucket.put(`${assetId}/master`, "fixture");
    const url = `https://worker.test/media/${assetId}/master-v1.webp`;
    const failedId = crypto.randomUUID();
    await db.prepare("INSERT INTO media_assets (id, filename, mime_type, original_key, original_bytes, width, height, status, created_at, updated_at) VALUES (?, 'failed.png', 'image/png', ?, 12, 1600, 600, 'failed', 'now', 'now')").bind(failedId, `${failedId}/original`).run();
    assert.equal((await admin(mf, "draft", { pageId, expectedVersion: 1, document: withImage({ ...image, assetId: failedId }) })).status, 400);
    assert.equal((await admin(mf, "draft", { pageId, expectedVersion: 1, document: bad })).status, 400);
    assert.equal((await admin(mf, "draft", { pageId, expectedVersion: 1, document })).status, 200);
    assert.equal((await mf.dispatchFetch(url)).status, 404);
    await db.prepare("CREATE TRIGGER reject_hero_outbox BEFORE INSERT ON cms_publish_outbox BEGIN SELECT RAISE(ABORT, 'test rollback'); END").run();
    assert.equal((await admin(mf, "publish", { pageId, expectedVersion: 2 })).status, 500);
    assert.equal((await db.prepare("SELECT COUNT(*) n FROM revision_assets WHERE asset_id = ?").bind(assetId).first()).n, 0);
    assert.equal((await mf.dispatchFetch(url)).status, 404);
    await db.prepare("DROP TRIGGER reject_hero_outbox").run();
    await assert.rejects(() => db.prepare("UPDATE media_assets SET status = 'failed' WHERE id = ?").bind(assetId).run(), /immutable/);
    assert.equal((await admin(mf, "publish", { pageId, expectedVersion: 2 })).status, 200);
    assert.equal((await mf.dispatchFetch(url)).status, 200);
    assert.equal((await db.prepare("SELECT COUNT(*) n FROM revision_assets WHERE asset_id = ?").bind(assetId).first()).n, 1);
    assert.deepEqual((await (await mf.dispatchFetch(`https://worker.test/api/public/pages/${pageId}`)).json()).document, document);
    assert.equal((await admin(mf, "draft", { pageId, expectedVersion: 2, document: withImage(null) })).status, 200);
    assert.equal((await admin(mf, "publish", { pageId, expectedVersion: 3 })).status, 200);
    assert.equal((await mf.dispatchFetch(url)).status, 200, "historical images remain available");
    await assert.rejects(() => db.prepare("INSERT INTO cms_revisions(id,page_id,draft_version,document_json,published_at) VALUES (?, ?, 999, ?, 'now')").bind(crypto.randomUUID(), pageId, JSON.stringify(bad)).run(), /unavailable hero media/);
  }
  await db.prepare("DROP TRIGGER hero_media_capture_publication").run();
  assert.equal((await (await admin(mf, "health")).json()).schemaReady, false);
  for (const [pageId, seed] of [["heating", contentDefinitions.heating.seed], ["reviews", createReviewsSeed()], ["promotions", contentDefinitions.promotions.seed]]) {
    const document = pageId === "promotions" ? { ...seed, offerHeroImages: { "winter-promotions": placement } } : { ...seed, heroImage: placement };
    assert.equal((await admin(mf, "draft", { pageId, expectedVersion: 3, document })).status, 503);
  }
});

test("hero pickers select, replace and restore images without changing page content", async t => {
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM("<!doctype html><div id='app'></div>", { url: "http://localhost", pretendToBeVisual: true });
  const saved = new Map();
  const asset = { id: placement.assetId, filename: "banner.png", status: "ready", width: placement.width, height: placement.height, default_alt: placement.alt, original_bytes: 1200 };
  for (const [key, value] of Object.entries({ window: dom.window, self: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node, IS_REACT_ACT_ENVIRONMENT: true,
    fetch: async () => Response.json({ assets: [asset], nextOffset: null }) })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  t.after(() => { dom.window.close(); for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  const { ContentFields, ReviewsFields } = await components();
  const React = require("react"), { createRoot } = require("react-dom/client");
  const container = document.getElementById("app"), mounted = createRoot(container);
  let current, disabled = false, Component;
  const render = () => mounted.render(React.createElement(Component, { document: current, disabled, onBusyChange: () => {}, onChange: next => { current = next; render(); } }));
  const button = label => [...container.querySelectorAll("button")].find(item => item.textContent === label);
  const click = async label => { assert.ok(button(label), label); await React.act(async () => button(label).click()); };
  try {
    for (const [Fields, seed] of [[ContentFields, contentDefinitions.heating.seed], [ReviewsFields, createReviewsSeed()]]) {
      Component = Fields; current = structuredClone(seed);
      await React.act(async () => render());
      if (Fields === ReviewsFields) await React.act(async () => container.querySelector("summary").click());
      await click("Replace hero image");
      assert.ok(container.querySelector('input[type="file"]'));
      await React.act(async () => new Promise(resolve => setTimeout(resolve, 250)));
      await React.act(async () => container.querySelector('[aria-label="Select banner.png"]').click());
      assert.deepEqual(current.heroImage, placement);
      assert.ok(container.querySelector(`img[src*="/api/cms/media/${placement.assetId}/master"]`));
      await click("Replace hero image");
      await click("Mini-split condenser mounting");
      assert.equal(current.heroImage, "/images/Guy-working.jpg");
      disabled = true; await React.act(async () => render());
      assert.equal(button("Restore default hero").disabled, true);
      disabled = false; await React.act(async () => render());
      await click("Restore default hero");
      assert.equal(current.heroImage, null);
      assert.deepEqual(current.content ?? current.items, seed.content ?? seed.items);
      assert.equal(current.ogImage, undefined);
    }
  } finally { await React.act(async () => mounted.unmount()); }
});
