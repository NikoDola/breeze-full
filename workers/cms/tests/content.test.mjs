import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { build } from "esbuild";
import { admin, bundle, createWorker, migrate, root } from "./helpers.mjs";

const load = async path => import(`data:text/javascript;base64,${Buffer.from(await bundle(new URL(path, import.meta.url))).toString("base64")}`);
const { contentDefinitions, validateContentDocument } = await load("../../../cms/shared/content.ts");
const { validateGlobal, validateReviews } = await load("../../../cms/shared/collections.ts");
const { globalSeed, createReviewsSeed } = await load("../../../cms/shared/collection-seeds.ts");
const { publicationPaths } = await load("../../../cms/shared/publication-paths.ts");

test("all 25 content seeds validate within the API limit; page identity and design are protected", () => {
  assert.equal(Object.keys(contentDefinitions).length, 25);
  for (const [id, { seed }] of Object.entries(contentDefinitions)) {
    assert.deepEqual(validateContentDocument(seed, id), seed, id);
    assert.ok(Buffer.byteLength(JSON.stringify({ pageId: id, expectedVersion: 1, document: seed })) < 49152, id);
    assert.throws(() => validateContentDocument(seed, id === "careers" ? "going-green" : "careers"));
    for (const key of ["style", "icon", "html"]) {
      assert.throws(() => validateContentDocument({ ...seed, content: { ...seed.content, [key]: "custom" } }, id));
    }
  }
  const careers = structuredClone(contentDefinitions.careers.seed);
  careers.content.cards.push({ id: "responsibilities", heading: "Responsibilities", items: [{ id: "safety", text: "Follow safety procedures." }] });
  assert.equal(validateContentDocument(careers).content.cards.length, 3);
  careers.content.cards.reverse();
  assert.equal(validateContentDocument(careers).content.cards[0].id, "responsibilities");
  careers.content.cards[1].id = careers.content.cards[0].id;
  assert.throws(() => validateContentDocument(careers));
  const promotions = structuredClone(contentDefinitions.promotions.seed);
  promotions.content.offers.reverse();
  assert.throws(() => validateContentDocument(promotions), /fixed entries/);
  const gallery = structuredClone(contentDefinitions.gallery.seed);
  gallery.content.photos[0].image = "https://unapproved.example/photo.jpg";
  assert.throws(() => validateContentDocument(gallery));
});

test("old Global and Reviews snapshots remain valid; location and shared copy reject unsafe input", () => {
  const { address, mapsHref, sharedCopy, ...oldGlobal } = globalSeed;
  assert.ok(address && mapsHref && sharedCopy);
  assert.deepEqual(validateGlobal(oldGlobal), oldGlobal);
  const { page, ...oldReviews } = createReviewsSeed();
  assert.ok(page);
  assert.deepEqual(validateReviews(oldReviews), oldReviews);
  assert.deepEqual(validateGlobal(globalSeed), globalSeed);
  for (const href of ["javascript:alert(1)", "https://google.com.evil.test/maps", "https://www.google.com/url?q=evil", "https://user@www.google.com/maps", "http://maps.google.com/", "https://www.google.com/maps\n"]) {
    assert.throws(() => validateGlobal({ ...globalSeed, mapsHref: href }));
  }
  assert.throws(() => validateGlobal({ ...globalSeed, address: { ...address, street: "   " } }));
  assert.throws(() => validateGlobal({ ...globalSeed, sharedCopy: { ...sharedCopy, css: "red" } }));
  assert.deepEqual(publicationPaths({ pageId: "promotions", path: "/promotions" }), ["/promotions", "/winter-promotions", "/summer-promotions"]);
  assert.deepEqual(publicationPaths({ pageId: "heating", path: "/heating" }), ["/heating", "/services"]);
});

test("every content page imports, saves, publishes and retries without overwriting drafts or other pages", async t => {
  const mf = await createWorker(); t.after(() => mf.dispose());
  const db = await mf.getD1Database("DB"); await migrate(db);
  const previous = await (await admin(mf, "import", { pageId: "global" })).json();
  for (const [pageId, { seed }] of Object.entries(contentDefinitions)) {
    const imported = await admin(mf, "import", { pageId });
    assert.equal(imported.status, 200, pageId);
    assert.deepEqual((await imported.json()).draft.document, seed);
    assert.equal((await mf.dispatchFetch(`https://worker.test/api/public/pages/${pageId}`)).status, 404);
    const document = structuredClone(seed); document.seoDescription = `Edited description for ${pageId}`;
    assert.equal((await admin(mf, "draft", { pageId, expectedVersion: 1, document })).status, 200, pageId);
    assert.equal((await admin(mf, "draft", { pageId, expectedVersion: 1, document })).status, 409);
    assert.deepEqual((await (await admin(mf, "import", { pageId })).json()).draft.document, document);
    assert.equal((await mf.dispatchFetch(`https://worker.test/api/public/pages/${pageId}`)).status, 404);
    const published = await admin(mf, "publish", { pageId, expectedVersion: 2 });
    assert.equal(published.status, 200, `${pageId}: ${await published.clone().text()}`);
    const state = await published.json();
    assert.deepEqual((await (await mf.dispatchFetch(`https://worker.test/api/public/pages/${pageId}`)).json()).document, document);
    assert.equal((await (await admin(mf, "publish", { pageId, expectedVersion: 2 })).json()).publication.revisionId, state.publication.revisionId);
    const { claim } = await (await admin(mf, "delivery/claim", { pageId, force: true })).json();
    assert.equal(claim.event.path, `/${pageId}`);
    for (const stage of ["invalidated", "confirmed"]) assert.equal((await admin(mf, "delivery/ack", { pageId, eventId: claim.event.eventId, leaseToken: claim.leaseToken, stage })).status, 200);
    assert.equal((await db.prepare("SELECT COUNT(*) n FROM cms_revisions WHERE page_id = ?").bind(pageId).first()).n, 1);
  }
  assert.deepEqual((await (await admin(mf, "proof?pageId=global")).json()).draft, previous.draft);
  assert.equal((await mf.dispatchFetch("https://worker.test/api/public/pages/not-a-page")).status, 404);
});

test("schema 6 gallery images become public atomically and remain referenced by immutable history", async t => {
  const mf = await createWorker(); t.after(() => mf.dispose());
  const db = await mf.getD1Database("DB"); await migrate(db);
  await admin(mf, "import", { pageId: "gallery" });
  const document = structuredClone(contentDefinitions.gallery.seed), assetId = crypto.randomUUID();
  document.content.photos[0].image = { assetId, alt: "Installed HVAC unit", decorative: false, width: 120, height: 80 };
  assert.equal((await admin(mf, "draft", { pageId: "gallery", expectedVersion: 1, document })).status, 404);
  await db.prepare("INSERT INTO media_assets (id, filename, mime_type, original_key, original_bytes, master_key, thumbnail_key, width, height, status, created_at, updated_at) VALUES (?, 'unit.webp', 'image/webp', ?, 12, ?, ?, 120, 80, 'ready', 'now', 'now')")
    .bind(assetId, `${assetId}/original`, `${assetId}/master`, `${assetId}/thumb`).run();
  await (await mf.getR2Bucket("MEDIA")).put(`${assetId}/master`, "fixture-byte");
  const url = `https://worker.test/media/${assetId}/master-v1.webp`;
  assert.equal((await admin(mf, "draft", { pageId: "gallery", expectedVersion: 1, document })).status, 200);
  assert.equal((await mf.dispatchFetch(url)).status, 404);
  await db.prepare("CREATE TRIGGER reject_content_outbox BEFORE INSERT ON cms_publish_outbox BEGIN SELECT RAISE(ABORT, 'test rollback'); END").run();
  assert.equal((await admin(mf, "publish", { pageId: "gallery", expectedVersion: 2 })).status, 500);
  assert.equal((await db.prepare("SELECT COUNT(*) n FROM revision_assets").first()).n, 0);
  assert.equal((await mf.dispatchFetch(url)).status, 404);
  await db.prepare("DROP TRIGGER reject_content_outbox").run();
  assert.equal((await admin(mf, "publish", { pageId: "gallery", expectedVersion: 2 })).status, 200);
  assert.equal((await mf.dispatchFetch(url)).status, 200);
  assert.equal((await db.prepare("SELECT COUNT(*) n FROM revision_assets WHERE asset_id = ?").bind(assetId).first()).n, 1);
  assert.equal((await admin(mf, "draft", { pageId: "gallery", expectedVersion: 2, document: contentDefinitions.gallery.seed })).status, 200);
  assert.equal((await admin(mf, "publish", { pageId: "gallery", expectedVersion: 3 })).status, 200);
  assert.equal((await mf.dispatchFetch(url)).status, 200, "historical published assets remain available");
  const bad = structuredClone(document); bad.content.photos[0].image.width = 999;
  await assert.rejects(() => db.prepare("INSERT INTO cms_revisions(id,page_id,draft_version,document_json,published_at) VALUES (?, 'gallery', 999, ?, 'now')").bind(crypto.randomUUID(), JSON.stringify(bad)).run(), /unavailable content media/);
  await db.prepare("DROP TRIGGER content_media_capture_publication").run();
  assert.equal((await (await admin(mf, "health")).json()).schemaReady, false);
  assert.equal((await admin(mf, "draft", { pageId: "gallery", expectedVersion: 3, document })).status, 503);
});

test("all public content templates render; Careers alternates colors by position and articles remain independent", async () => {
  const result = await build({ stdin: { resolveDir: root, contents: `
    import {createElement} from 'react'; import {renderToStaticMarkup} from 'react-dom/server';
    import View from './src/components/sections/ContentPageView';
    import {contentDefinitions} from './cms/shared/content'; import {site} from './src/lib/site';
    const services = Object.entries(contentDefinitions).filter(([,d])=>d.group==='HVAC').map(([slug,d])=>({slug,title:d.seed.content.heading,icon:d.icon,image:d.image,tagline:d.seed.content.tagline,blurb:d.seed.content.summary}));
    export const renders = Object.fromEntries(Object.entries(contentDefinitions).map(([id,d])=>[id,renderToStaticMarkup(createElement(View,{document:d.seed,site,services}))]));
    const document=structuredClone(contentDefinitions.careers.seed); document.content.cards.push({id:'responsibilities',heading:'Responsibilities',items:[{id:'safety',text:'Follow safety procedures.'}]});
    export const careers=renderToStaticMarkup(createElement(View,{document,site}));
    const article=structuredClone(contentDefinitions['going-green'].seed); article.content.blocks[0].text='Independent green heading';
    export const green=renderToStaticMarkup(createElement(View,{document:article,site}));
    export const offers=['winter-promotions','summer-promotions'].map(offerSlug=>renderToStaticMarkup(createElement(View,{document:contentDefinitions.promotions.seed,site,offerSlug})));
  ` }, bundle: true, write: false, outfile: "content.cjs", platform: "node", format: "cjs", packages: "external", alias: { "@": resolve(root, "src") }, jsx: "automatic" });
  const module = { exports: {} };
  new Function("require", "module", "exports", result.outputFiles[0].text)(createRequire(resolve(root, "package.json")), module, module.exports);
  const { renders, careers, green, offers } = module.exports;
  for (const [id, html] of Object.entries(renders)) { assert.ok(html.includes("<h1"), id); assert.ok(!html.includes("undefined"), id); }
  assert.ok(careers.includes("Responsibilities"));
  assert.deepEqual([...careers.matchAll(/careers-card-([12])/g)].map(match => match[1]), ["1", "2", "1"]);
  assert.ok(green.includes("Independent green heading"));
  assert.ok(!renders["meet-the-hvac-experts"].includes("Independent green heading"));
  assert.ok(offers.every(html => html.includes("<h1")));
});
