import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { build } from "esbuild";
import { admin, bundle, createWorker, migrate, root } from "./helpers.mjs";

const load = async path => import(`data:text/javascript;base64,${Buffer.from(await bundle(new URL(path, import.meta.url))).toString("base64")}`);
const { editableHome, validateHomeDocument, homeSlotOrder, homeRichSectionRegistry } = await load("../../../cms/shared/home.ts");
const { homeHeroSeed } = await load("../../../cms/shared/home-hero.ts");
const { richTextPlainText } = await load("../../../cms/shared/rich-text.ts");
const { homeSeed } = await load("../../../cms/shared/home-seed.ts");
const { sameEditorDocument } = await load("../../../cms/shared/editor-document.ts");
const require = createRequire(resolve(root, "package.json"));
const React = require("react"), { renderToStaticMarkup } = require("react-dom/server"), { JSDOM } = require("jsdom");
const output = await build({ stdin: { contents: `
  export { default as HeroSection } from './src/components/sections/home/HeroSection';
  export { default as HomeContent } from './src/components/sections/home/HomeContent';
  export { default as HomeFields } from './src/featured/admin-test/HomeFields';
  export { default as HomePreview } from './src/featured/admin-test/HomePreview';
`, resolveDir: root }, bundle: true, write: false, outfile: "hero-test.cjs", platform: "node", format: "cjs",
  packages: "external", jsx: "automatic", loader: { ".css": "empty" }, alias: { "@": resolve(root, "src") } });
const module = { exports: {} };
const testRequire = name => name === "next/navigation" ? { usePathname: () => "/" } : require(name);
new Function("require", "module", "exports", output.outputFiles[0].text)(testRequire, module, module.exports);
const { HeroSection, HomeContent, HomeFields, HomePreview } = module.exports;
const baseline = JSON.parse(await readFile(new URL("./fixtures/home-hero-baseline.json", import.meta.url), "utf8"));

function rendered(component, props) {
  return new JSDOM(renderToStaticMarkup(React.createElement(component, props)));
}
function oldRichDocument() {
  const doc = structuredClone(editableHome(homeSeed));
  delete doc.slots.hero;
  doc.templateVersion = 2;
  return doc;
}
function oldSplitHeroDocument() {
  const doc = structuredClone(editableHome(homeSeed));
  const { heading, ...rest } = doc.slots.hero.content;
  doc.slots.hero = { type: "breeze.hero", version: 1, content: {
    headingLine1: "Home feels", headingAccent: "better", headingLine2: "with a", headingLine3: "little Breeze", ...rest,
  } };
  return doc;
}
const plainHeading = text => ({ version: 1, content: [{ type: "text", text }] });
function headingAppearance(heading) {
  return {
    lines: [...heading.querySelectorAll(".hero-title-line")].map(line => line.textContent),
    accents: [...heading.querySelectorAll("em, .period")].map(node => node.textContent),
  };
}
function assertFixedArtwork(doc) {
  assert.deepEqual([...doc.querySelectorAll('link[rel="preload"][as="image"]')].filter(node => node.getAttribute("media")).map(node => node.outerHTML), baseline.preloads.filter(html => html.includes("media=")));
  assert.equal(doc.querySelector(".hero-photo").outerHTML, baseline.photo);
  assert.equal(doc.querySelector(".hero-sticker").outerHTML, baseline.sticker);
  assert.equal(doc.querySelector(".hero-google-mark").outerHTML, baseline.googleMark);
}

test("old homepage versions open with default hero controls without modifying saved content", () => {
  const original = new JSDOM(`<h1>${baseline.heading}</h1>`);
  for (const doc of [homeSeed, oldRichDocument(), oldSplitHeroDocument()]) {
    const before = JSON.stringify(doc), converted = editableHome(doc);
    assert.deepEqual(validateHomeDocument(doc), doc);
    assert.equal(converted.templateVersion, 3);
    assert.equal(converted.slots.hero.version, 2);
    assert.deepEqual(converted.slots.hero.content, homeHeroSeed);
    assert.deepEqual(validateHomeDocument(converted), converted);
    assert.equal(sameEditorDocument(doc, converted), true, "opening or undoing to the defaults is not a change");
    assert.equal(JSON.stringify(doc), before);
    if (doc.templateVersion === 2) assert.deepEqual(converted.slots.contact, doc.slots.contact);
    const dom = rendered(HomeContent, { document: doc });
    assert.deepEqual(headingAppearance(dom.window.document.querySelector("#hero-title")), headingAppearance(original.window.document.querySelector("h1")));
    assert.equal(dom.window.document.querySelector(".hero-intro").innerHTML, baseline.introduction);
    assertFixedArtwork(dom.window.document);
    dom.window.close();
  }
  original.window.close();
  assert.deepEqual(homeSlotOrder, ["hero", "seasons", "contact", "reviews", "area"]);
});

test("saved split hero headings convert into one rich heading without losing words, colors or other edits", () => {
  const old = oldSplitHeroDocument();
  Object.assign(old.slots.hero.content, { headingLine1: "Stay comfortable", headingAccent: "every", headingLine2: "season", headingLine3: "with your local team", googleReviewCount: "185", buttonText: "Book service" });
  const before = JSON.stringify(old), converted = editableHome(old);
  assert.equal(richTextPlainText(converted.slots.hero.content.heading), "Stay comfortable\nevery season\nwith your local team.");
  assert.deepEqual(converted.slots.hero.content.heading.content.filter(node => node.color === "accent").map(node => node.text), ["every", "."]);
  assert.equal(converted.slots.hero.content.googleReviewCount, "185");
  assert.equal(converted.slots.hero.content.buttonText, "Book service");
  assert.equal(sameEditorDocument(old, converted), true);
  assert.equal(JSON.stringify(old), before);
  assert.deepEqual(validateHomeDocument(old), old);
  assert.deepEqual(validateHomeDocument(converted), converted);
});

test("hero validates review figures and rejects image, link, phone and layout overrides", () => {
  const invalid = mutate => { const doc = structuredClone(editableHome(homeSeed)); mutate(doc); assert.throws(() => validateHomeDocument(doc)); };
  for (const value of ["", "-1", "5.1", "4.99", "NaN", "1e0", " 5", 5, null]) invalid(doc => { doc.slots.hero.content.googleRating = value; });
  for (const value of ["", "-1", "1.5", "1,000", "01", "10000000", 180, null]) invalid(doc => { doc.slots.hero.content.googleReviewCount = value; });
  for (const [rating, count] of [["0", "0"], ["4.9", "180"], ["5.0", "9999999"]]) {
    const doc = editableHome(homeSeed);
    Object.assign(doc.slots.hero.content, { googleRating: rating, googleReviewCount: count });
    assert.deepEqual(validateHomeDocument(doc), doc);
  }
  for (const key of ["image", "heroImage", "images", "background", "buttonHref", "phone", "phoneHref", "style"]) invalid(doc => { doc.slots.hero.content[key] = "/images/hero1.webp"; });
  invalid(doc => { doc.heroImage = "/images/hero1.webp"; });
  invalid(doc => { delete doc.slots.hero; });
  invalid(doc => { doc.slots.hero.version = 3; });
  invalid(doc => { doc.slots.hero.type = "breeze.seasons"; });
  invalid(doc => { doc.slots.hero.content.heading = plainHeading(" "); });
  invalid(doc => { doc.slots.hero.content.heading = plainHeading("x".repeat(601)); });
  invalid(doc => { doc.slots.hero.content.heading.content[0].color = "red"; });
  invalid(doc => { doc.slots.hero.content.headingLine1 = "A split heading"; });
  invalid(doc => { doc.slots.hero.content.intro = "x".repeat(301); });
  for (const doc of [homeSeed, oldRichDocument()]) assert.throws(() => validateHomeDocument({ ...doc, slots: { ...doc.slots, hero: editableHome(homeSeed).slots.hero } }));
});

test("hero edits render escaped copy, accurate rating and accessible labels while retaining fixed artwork and destinations", () => {
  const document = editableHome(homeSeed);
  Object.assign(document.slots.hero.content, {
    heading: { version: 1, content: [
      { type: "text", text: "Comfort <script>alert(1)</script>" }, { type: "break" },
      { type: "text", text: "starts", color: "accent", bold: true, italic: true }, { type: "text", text: " at home" }, { type: "break" },
      { type: "text", text: "with Breeze" },
    ] },
    intro: "Your local team.\nReady to help.", googleRating: "4.9", googleReviewCount: "180", buttonText: "Request service", phoneButtonText: "Phone",
  });
  const site = { phone: "615-555-0123", phoneHref: "tel:+16155550123" };
  const dom = rendered(HomeContent, { document: validateHomeDocument(document), site }), doc = dom.window.document;
  assert.equal(doc.querySelector("#hero-title .hero-title-line").textContent, "Comfort <script>alert(1)</script>");
  assert.equal(doc.querySelector("#hero-title script"), null);
  assert.equal(doc.querySelector("#hero-title em").textContent, "starts");
  assert.equal(doc.querySelector("#hero-title em i strong").textContent, "starts");
  assert.equal(doc.querySelectorAll("#hero-title").length, 1);
  assert.equal(doc.querySelector("#hero-title").textContent.endsWith("with Breeze"), true, "punctuation is edited in the heading, never appended automatically");
  assert.equal(doc.querySelector(".hero-intro").innerHTML, "Your local team.<br>Ready to help.");
  assert.equal(doc.querySelector(".hero-google-rating strong").textContent, "4.9");
  assert.equal(doc.querySelector(".hero-google-stars span:last-child").style.width, "98%");
  assert.equal(doc.querySelector(".hero-google-count").textContent, "180 Google reviews");
  assert.equal(doc.querySelector(".hero-google-reviews").getAttribute("aria-label"), "Rated 4.9 out of 5 on Google from 180 reviews. Read our client reviews.");
  assert.equal(doc.querySelector(".hero-google-reviews").getAttribute("href"), "/reviews");
  assert.equal(doc.querySelector(".hero-buttons .orange").getAttribute("href"), "#contact");
  assert.equal(doc.querySelector(".hero-buttons .orange").textContent, "Request service ↗");
  assert.equal(doc.querySelector(".hero-buttons .ghost").textContent, "Phone 615-555-0123");
  assert.equal(doc.querySelector(".hero-buttons .ghost").getAttribute("href"), site.phoneHref);
  assertFixedArtwork(doc);
  dom.window.close();
  const single = rendered(HeroSection, { content: { ...homeHeroSeed, googleReviewCount: "1" } });
  assert.equal(single.window.document.querySelector(".hero-google-count").textContent, "1 Google review");
  single.window.close();
});

test("hero editor uses one color-enabled heading field without split heading inputs or an image picker", () => {
  const headingFields = Object.entries(homeRichSectionRegistry.hero.fields).filter(([key]) => key.startsWith("heading"));
  assert.deepEqual(headingFields.map(([key, field]) => [key, field.kind]), [["heading", "rich-text"]]);
  assert.match(headingFields[0][1].help, /Default or Orange/);
  const dom = rendered(HomeFields, { document: homeSeed, slot: "hero", disabled: false, resetKey: 0, onChange() {}, onSlotChange() {}, onOpenReviews() {} });
  const doc = dom.window.document;
  assert.equal(doc.querySelector('input[role="combobox"]').value, "1. Hero");
  assert.equal(doc.querySelectorAll("label input").length, 4);
  assert.equal(doc.querySelectorAll("label textarea").length, 1);
  assert.equal(doc.querySelector('input[inputmode="decimal"]').value, "5.0");
  assert.equal(doc.querySelector('input[inputmode="numeric"]').value, "167");
  assert.equal(doc.querySelector('input[type="file"]'), null);
  assert.ok(!doc.body.textContent.includes("Heading — first line"));
  assert.ok(!doc.body.textContent.includes("Heading — highlighted word"));
  assert.ok(doc.body.textContent.includes("hero image stays fixed"));
  dom.window.close();
});

test("homepage preview accepts valid hero drafts and focuses the hero while rejecting foreign or invalid messages", async t => {
  const dom = new JSDOM("<!doctype html><div id='app'></div>", { url: "http://localhost", pretendToBeVisual: true });
  const saved = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, self: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  t.after(() => {
    dom.window.close();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const { createRoot } = require("react-dom/client");
  const container = document.getElementById("app"), mounted = createRoot(container);
  const { site } = await load("../../../src/lib/site.ts");
  const send = async (document, origin = window.location.origin) => React.act(async () => window.dispatchEvent(new window.MessageEvent("message", {
    origin, source: window.parent, data: { type: "breeze.cms.home-preview", document },
  })));
  try {
    await React.act(async () => mounted.render(React.createElement(HomePreview, { site, initialDocument: homeSeed })));
    const draft = editableHome(homeSeed);
    Object.assign(draft.slots.hero.content, { heading: plainHeading("A private draft"), googleRating: "4.8", googleReviewCount: "181" });
    await send(draft);
    assert.equal(container.querySelector("#hero-title .hero-title-line").textContent, "A private draft");
    assert.equal(container.querySelector(".hero-google-count").textContent, "181 Google reviews");
    const invalid = structuredClone(draft); invalid.slots.hero.content.googleRating = "7";
    await send(invalid);
    await send(homeSeed, "https://other.example");
    assert.equal(container.querySelector(".hero-google-count").textContent, "181 Google reviews");
    const focused = [];
    window.matchMedia = () => ({ matches: true });
    container.querySelector("#hero").scrollIntoView = options => focused.push(options);
    container.querySelector("#hero").animate = () => {};
    await React.act(async () => window.dispatchEvent(new window.MessageEvent("message", {
      origin: window.location.origin, source: window.parent, data: { type: "breeze.cms.preview-focus", sectionId: "hero" },
    })));
    assert.deepEqual(focused, [{ behavior: "instant", block: "start" }]);
  } finally { await React.act(async () => mounted.unmount()); }
});

test("hero drafts remain private until published, reject stale or invalid saves, and preserve older revisions", async t => {
  const mf = await createWorker(); t.after(() => mf.dispose());
  const db = await mf.getD1Database("DB"); await migrate(db);
  await admin(mf, "import", { pageId: "home" });
  const old = await (await admin(mf, "publish", { pageId: "home", expectedVersion: 1 })).json();
  const oldRevision = await db.prepare("SELECT document_json FROM cms_revisions WHERE id = ?").bind(old.publication.revisionId).first();
  const document = editableHome(old.publication.document);
  Object.assign(document.slots.hero.content, { googleReviewCount: "180", googleRating: "4.9", buttonText: "Request service" });
  let result = await admin(mf, "draft", { pageId: "home", document, expectedVersion: 1 });
  assert.equal(result.status, 200);
  assert.deepEqual((await result.json()).draft.document, document);
  assert.equal((await admin(mf, "draft", { pageId: "home", document, expectedVersion: 1 })).status, 409);
  const bad = structuredClone(document); bad.slots.hero.content.image = "/images/hero1.webp";
  assert.equal((await admin(mf, "draft", { pageId: "home", document: bad, expectedVersion: 2 })).status, 400);
  const before = await (await mf.dispatchFetch("https://worker.test/api/public/pages/home")).json();
  assert.equal(before.revisionId, old.publication.revisionId);
  const published = await (await admin(mf, "publish", { pageId: "home", expectedVersion: 2 })).json();
  assert.deepEqual(published.publication.document, document);
  assert.notEqual(published.publication.revisionId, old.publication.revisionId);
  const live = await (await mf.dispatchFetch("https://worker.test/api/public/pages/home")).json();
  assert.deepEqual(live.document.slots.hero.content, document.slots.hero.content);
  assert.equal((await (await admin(mf, "publish", { pageId: "home", expectedVersion: 2 })).json()).publication.revisionId, published.publication.revisionId);
  assert.deepEqual(await db.prepare("SELECT document_json FROM cms_revisions WHERE id = ?").bind(old.publication.revisionId).first(), oldRevision);
});
