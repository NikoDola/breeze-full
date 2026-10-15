import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { build } from "esbuild";
import { root } from "./helpers.mjs";
const require = createRequire(resolve(root, "package.json"));
const { JSDOM } = require("jsdom");

test("content preview accepts only valid parent drafts, blocks form submission, and previews both review placements", async t => {
  const dom = new JSDOM("<!doctype html><div id='app'></div>", { url: "http://localhost", pretendToBeVisual: true });
  const saved = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, self: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  t.after(() => { dom.window.close(); for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  const output = await build({ stdin: { contents: `
    export {default as Preview} from './src/featured/admin-test/ContentPreview';
    export {contentDefinitions} from './cms/shared/content';
    export {createReviewsSeed} from './cms/shared/collection-seeds';
    export {site} from './src/lib/site';
  `, resolveDir: root }, bundle: true, write: false, outfile: "preview.cjs", platform: "node", format: "cjs", packages: "external", alias: { "@": resolve(root, "src") }, jsx: "automatic" });
  const module = { exports: {} };
  new Function("require", "module", "exports", output.outputFiles[0].text)(name => name === "next/navigation" ? { usePathname: () => "/careers" } : require(name), module, module.exports);
  const { Preview, contentDefinitions, createReviewsSeed, site } = module.exports;
  const React = require("react"), { createRoot } = require("react-dom/client");
  const container = document.getElementById("app"), mounted = createRoot(container);
  const send = async (doc, options = {}) => React.act(async () => window.dispatchEvent(new window.MessageEvent("message", {
    origin: options.origin ?? window.location.origin, source: options.source === undefined ? window.parent : options.source,
    data: { type: "breeze.cms.content-preview", document: doc },
  })));
  try {
    await React.act(async () => mounted.render(React.createElement(Preview, { initialDocument: contentDefinitions.careers.seed, site, services: [] })));
    const draft = structuredClone(contentDefinitions.careers.seed); draft.content.heading = "Updated careers heading";
    await send(draft);
    assert.equal(container.querySelector("h1").textContent, `${draft.content.heading}.`);
    for (const [doc, options] of [[contentDefinitions.careers.seed, { origin: "https://other.example" }], [contentDefinitions.careers.seed, { source: null }], [contentDefinitions["going-green"].seed, {}], [{ ...draft, content: { ...draft.content, heading: "" } }, {}]]) {
      await send(doc, options);
      assert.equal(container.querySelector("h1").textContent, `${draft.content.heading}.`);
    }
    const click = new window.MouseEvent("click", { bubbles: true, cancelable: true });
    container.querySelector('a[href^="mailto:"]').dispatchEvent(click);
    assert.equal(click.defaultPrevented, true);
    const submit = new window.Event("submit", { bubbles: true, cancelable: true });
    container.querySelector("form").dispatchEvent(submit);
    assert.equal(submit.defaultPrevented, true);
    assert.equal(container.querySelector(".form-status"), null);
    const reviews = createReviewsSeed();
    await React.act(async () => mounted.render(React.createElement(Preview, { key: "reviews", initialDocument: reviews, site, services: [] })));
    reviews.page.heading = "Updated client heading";
    await send(reviews);
    assert.equal(container.querySelector("h1").textContent, `${reviews.page.heading}.`);
    await React.act(async () => [...container.querySelectorAll('[aria-label="Review preview"] button')].find(button => button.textContent === "Homepage favorites").click());
    assert.ok(container.querySelector("#reviews"));
    assert.equal(container.querySelector("h1"), null);
    const gallery = structuredClone(contentDefinitions.gallery.seed);
    gallery.content.photos[0].image = { assetId: crypto.randomUUID(), alt: "Detailed uploaded image description", decorative: false, width: 120, height: 80 };
    await React.act(async () => mounted.render(React.createElement(Preview, { key: "gallery", initialDocument: gallery, site, services: [] })));
    const photo = container.querySelector(".gallery-image-1");
    assert.equal(photo.alt, "Detailed uploaded image description");
    assert.ok(photo.src.includes("/api/cms/media/"));
    await React.act(async () => container.querySelector(".gallery-button-1").click());
    assert.ok(container.querySelector('.gallery-layout-2[role="dialog"]'));
    gallery.content.photos.shift();
    await send(gallery);
    assert.equal(container.querySelector('.gallery-layout-2[role="dialog"]'), null, "Removing an open photo closes its preview safely");
  } catch (error) { if (error instanceof AggregateError) throw error.errors[0]; throw error; }
  finally { await React.act(async () => mounted.unmount()); }
});
