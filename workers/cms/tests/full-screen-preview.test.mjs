import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const require = createRequire(resolve(root, "package.json"));
const { JSDOM } = require("jsdom");

async function loadComponent(name) {
  const output = await build({ absWorkingDir: root, entryPoints: [`src/featured/admin-test/${name}.tsx`], bundle: true,
    write: false, outfile: "preview-test.cjs", platform: "node", format: "cjs", packages: "external", jsx: "automatic",
    alias: { "@": resolve(root, "src") }, loader: { ".css": "empty" } });
  const module = { exports: {} };
  new Function("require", "module", "exports", output.outputFiles[0].text)(require, module, module.exports);
  return module.exports.default;
}

test("mobile preview closes safely and adapts to the available screen without losing editor focus", async t => {
  const dom = new JSDOM("<!doctype html><div id='app'></div>", { url: "http://localhost", pretendToBeVisual: true });
  const saved = new Map();
  const observers = new Set();
  class ResizeObserver {
    constructor(callback) { this.callback = callback; observers.add(this); }
    observe() {}
    disconnect() { observers.delete(this); }
  }
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node, ResizeObserver, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  // jsdom has no native modal implementation. Queue close events like the browser
  // so Strict Mode's effect cleanup cannot accidentally close a reopened dialog.
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
    this.querySelector("button")?.focus();
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    if (!this.open) return;
    this.removeAttribute("open");
    queueMicrotask(() => this.dispatchEvent(new window.Event("close")));
  };
  t.after(() => {
    dom.window.close();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const [FullScreenPreview, HomePreviewFrame] = await Promise.all([loadComponent("FullScreenPreview"), loadComponent("HomePreviewFrame")]);
  const React = require("react"), { createRoot } = require("react-dom/client");
  const container = document.getElementById("app");

  await t.test("Cancel preview and native dismissal restore scrolling and focus, including Strict Mode", async () => {
    let closed = 0;
    function EditorHarness() {
      const [open, setOpen] = React.useState(false);
      return React.createElement(React.Fragment, null,
        React.createElement("button", { id: "expand-preview", onClick: () => setOpen(true) }, "Expand preview"),
        open && React.createElement(FullScreenPreview, { onClose() { closed++; setOpen(false); } }, "Preview content"));
    }
    const mounted = createRoot(container);
    document.body.style.overflow = "scroll";
    try {
      await React.act(async () => mounted.render(React.createElement(React.StrictMode, null, React.createElement(EditorHarness))));
      const opener = document.getElementById("expand-preview");
      opener.focus();
      await React.act(async () => opener.click());
      assert.equal(container.querySelector("dialog").open, true);
      assert.equal(closed, 0, "queued cleanup events must not dismiss an open preview");
      assert.equal(document.body.style.overflow, "hidden");
      const cancel = container.querySelector("dialog button");
      assert.equal(cancel.textContent, "Cancel preview");
      assert.equal(document.activeElement, cancel);
      await React.act(async () => cancel.click());
      assert.equal(container.querySelector("dialog"), null);
      assert.equal(closed, 1);
      assert.equal(document.body.style.overflow, "scroll");
      assert.equal(document.activeElement, opener);

      await React.act(async () => opener.click());
      await React.act(async () => container.querySelector("dialog").close());
      assert.equal(closed, 2);
      assert.equal(document.body.style.overflow, "scroll");
      assert.equal(document.activeElement, opener);
      await React.act(async () => opener.click());
    } finally { await React.act(async () => mounted.unmount()); }
    assert.equal(document.body.style.overflow, "scroll", "unmounting also releases the scroll lock");
  });

  await t.test("full-screen iframe follows width and height changes and ignores hidden measurements", async () => {
    const mounted = createRoot(container);
    const props = { document: { schemaVersion: 5 }, viewport: "mobile", fillContainer: true };
    const resize = async (width, height) => React.act(async () => {
      for (const observer of observers) observer.callback([{ contentRect: { width, height } }]);
    });
    try {
      await React.act(async () => mounted.render(React.createElement(HomePreviewFrame, props)));
      await resize(375, 650);
      const frame = container.querySelector("iframe");
      assert.equal(frame.style.width, "375px");
      assert.equal(frame.style.height, "650px");
      assert.equal(frame.style.transform, "scale(1)");
      await resize(0, 0);
      assert.equal(frame.style.width, "375px");
      assert.equal(frame.style.height, "650px");
      await resize(768, 320);
      assert.equal(frame.style.width, "768px");
      assert.equal(frame.style.height, "320px");
      await React.act(async () => mounted.render(React.createElement(HomePreviewFrame, { ...props, viewport: "desktop", fillContainer: false })));
      assert.equal(frame.style.width, "1280px");
      assert.equal(frame.style.transform, "scale(0.6)");
      assert.ok(Math.abs(parseFloat(frame.style.height) * 0.6 - 320) < 0.01);
    } finally { await React.act(async () => mounted.unmount()); }
    assert.equal(observers.size, 0);
  });
});
