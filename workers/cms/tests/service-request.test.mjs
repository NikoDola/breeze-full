import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { build } from "esbuild";
import { root } from "./helpers.mjs";

const require = createRequire(resolve(root, "package.json"));
const React = require("react"), { JSDOM } = require("jsdom");
let pathname = "/";
const output = await build({ stdin: { contents: `
  export { default as Form } from './src/components/sections/ServiceRequestForm';
  export { default as Header } from './src/components/sections/SiteHeader';
`, resolveDir: root }, bundle: true, write: false, outfile: "form-test.cjs", platform: "node", format: "cjs",
  packages: "external", jsx: "automatic", alias: { "@": resolve(root, "src") } });
const module = { exports: {} };
new Function("require", "module", "exports", output.outputFiles[0].text)(name => {
  if (name === "next/navigation") return { usePathname: () => pathname };
  if (name === "next/link") return function Link(props) { return React.createElement("a", props); };
  return require(name);
}, module, module.exports);
const { Form, Header } = module.exports;

test("server rendering never starts the booking app; direct booking and phone fallbacks stay available", () => {
  const { renderToStaticMarkup } = require("react-dom/server");
  pathname = null; // Static renderers may not provide a pathname context.
  const html = renderToStaticMarkup(React.createElement(Form));
  assert.doesNotMatch(html, /<iframe|<script/);
  assert.match(html, /href="https:\/\/book.housecallpro.com\/lead-form\//);
  assert.match(html, /href="tel:/);
  assert.match(html, /Load service form/);
  pathname = "/admin-test/preview";
  const preview = renderToStaticMarkup(React.createElement(Form));
  assert.doesNotMatch(preview, /<iframe|Load service form/);
  assert.match(preview, /Submissions are disabled/);
});

async function mount(t, { path = "/", hash = "", observer = true, header = false } = {}) {
  pathname = path;
  const dom = new JSDOM("<!doctype html><div id='app'></div>", { url: `http://localhost${path}${hash}`, pretendToBeVisual: true });
  const observers = [], saved = new Map();
  class Observer {
    constructor(callback, options) { this.callback = callback; this.options = options; this.disconnected = false; observers.push(this); }
    observe(element) { this.element = element; }
    disconnect() { this.disconnected = true; }
  }
  if (observer) dom.window.IntersectionObserver = Observer;
  const scrolled = [];
  dom.window.Element.prototype.scrollIntoView = function(options) { scrolled.push({ element: this, options }); };
  for (const [key, value] of Object.entries({ window: dom.window, self: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node, Event: dom.window.Event,
    IntersectionObserver: observer ? Observer : undefined, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  const { createRoot } = require("react-dom/client"), container = document.getElementById("app"), mounted = createRoot(container);
  t.after(async () => {
    await React.act(async () => mounted.unmount());
    dom.window.close();
    for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  });
  await React.act(async () => mounted.render(React.createElement(React.Fragment, null, header && React.createElement(Header), React.createElement(Form))));
  return { dom, container, observers, scrolled };
}

test("booking loads near the form, stays mounted after scrolling away, and keeps validated resizing", async t => {
  const { container, observers } = await mount(t);
  assert.equal(container.querySelector("iframe"), null);
  assert.equal(observers.length, 1);
  const observer = observers[0];
  assert.equal(observer.options.rootMargin, "200px 0px");
  assert.equal(observer.element.id, "service-form");
  await React.act(async () => observer.callback([{ isIntersecting: false }]));
  assert.equal(container.querySelector("iframe"), null, "offscreen form must not start third-party scripts");
  await React.act(async () => observer.callback([{ isIntersecting: true }]));
  const frame = container.querySelector("iframe");
  assert.equal(frame.getAttribute("src"), "/integrations/housecall-pro.html");
  assert.equal(frame.getAttribute("height"), "900", "reserve the original space");
  assert.equal(observer.disconnected, true);
  const message = async (height, overrides = {}) => React.act(async () => window.dispatchEvent(new window.MessageEvent("message", {
    origin: window.location.origin, source: frame.contentWindow, data: { type: "breeze.hcp.resize", height }, ...overrides,
  })));
  await message(1500, { origin: "https://other.example" });
  await message(1500, { source: window });
  await message(99999);
  assert.equal(frame.style.height, "");
  await message("1120px");
  assert.equal(frame.style.height, "1120px");
  await React.act(async () => frame.dispatchEvent(new window.Event("load")));
  assert.equal(container.querySelector('[role="status"]'), null);
  await React.act(async () => observer.callback([{ isIntersecting: false }]));
  assert.equal(container.querySelector("iframe"), frame, "scrolling must not discard an unfinished request");
});

test("Request service begins loading before smooth scrolling and respects modified clicks", async t => {
  const { container, scrolled } = await mount(t, { header: true });
  const link = container.querySelector('a[href="#service-form"]');
  await React.act(async () => link.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true })));
  assert.equal(container.querySelector("iframe"), null);
  assert.equal(scrolled.length, 0);
  await React.act(async () => link.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true })));
  assert.ok(container.querySelector("iframe"));
  assert.equal(window.location.hash, "#service-form");
  assert.equal(scrolled.length, 1);
  assert.deepEqual(scrolled[0].options, { behavior: "smooth", block: "start" });
});

test("deep links and manual loading work without waiting for visibility", async t => {
  for (const hash of ["#contact", "#service-form"]) {
    await t.test(hash, async t => {
      const { container } = await mount(t, { path: "/contact-us", hash });
      assert.ok(container.querySelector("iframe"));
    });
  }
  await t.test("hash navigation", async t => {
    const { container } = await mount(t);
    await React.act(async () => {
      window.history.replaceState(null, "", "#service-form");
      window.dispatchEvent(new window.HashChangeEvent("hashchange"));
    });
    assert.ok(container.querySelector("iframe"));
  });
  await t.test("manual fallback without IntersectionObserver", async t => {
    const { container } = await mount(t, { observer: false });
    assert.equal(container.querySelector("iframe"), null);
    await React.act(async () => container.querySelector("button").click());
    const frame = container.querySelector("iframe");
    assert.ok(frame);
    await React.act(async () => frame.dispatchEvent(new window.Event("load")));
    assert.equal(document.activeElement, frame);
  });
});

test("CMS preview never observes or activates the live booking form", async t => {
  const { container, observers } = await mount(t, { path: "/admin-test/preview", hash: "#service-form" });
  assert.equal(observers.length, 0);
  await React.act(async () => container.querySelector("#service-form").dispatchEvent(new window.Event("breeze:load-service-form")));
  assert.equal(container.querySelector("iframe"), null);
});
