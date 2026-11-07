import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { build } from "esbuild";
import { root } from "./helpers.mjs";

const require = createRequire(resolve(root, "package.json"));
const { JSDOM } = require("jsdom");

test("Select Section searches numbered page-order options and supports choosing, cancelling and keyboard navigation", async t => {
  const dom = new JSDOM("<!doctype html><div id='app'></div><button id='outside'>Outside</button>", { url: "http://localhost", pretendToBeVisual: true });
  const saved = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
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
  const output = await build({ entryPoints: [resolve(root, "src/featured/admin-test/HomeSectionSelect.tsx")], bundle: true,
    write: false, outfile: "section-select.cjs", platform: "node", format: "cjs", packages: "external", jsx: "automatic",
    alias: { "@": resolve(root, "src") }, loader: { ".css": "empty" } });
  const module = { exports: {} };
  new Function("require", "module", "exports", output.outputFiles[0].text)(require, module, module.exports);
  const SelectSection = module.exports.default;
  const React = require("react"), { createRoot } = require("react-dom/client");
  const container = document.getElementById("app"), mounted = createRoot(container);
  let selected = "hero", disabled = false;
  const changes = [];
  const render = () => mounted.render(React.createElement(SelectSection, { value: selected, disabled, onChange(value) { changes.push(value); selected = value; render(); } }));
  const input = () => container.querySelector('[role="combobox"]');
  const options = () => [...container.querySelectorAll('[role="option"]')];
  const key = async value => React.act(async () => input().dispatchEvent(new window.KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true })));
  const search = async value => React.act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(input(), value);
    input().dispatchEvent(new window.Event("input", { bubbles: true }));
  });
  try {
    await React.act(async () => render());
    assert.equal(container.querySelector("label").textContent, "Select Section");
    assert.equal(container.querySelector("label").htmlFor, input().id);
    assert.equal(input().value, "1. Hero");
    assert.equal(input().getAttribute("aria-expanded"), "false");
    await React.act(async () => input().focus());
    assert.equal(input().getAttribute("aria-expanded"), "true");
    assert.deepEqual(options().map(option => option.textContent), ["1. Hero", "2. Heating & cooling", "3. Contact introduction", "4. Reviews", "5. Service area"]);
    assert.equal(document.getElementById(input().getAttribute("aria-activedescendant")).textContent, "1. Hero");
    await search("ReViEw");
    assert.deepEqual(options().map(option => option.textContent), ["4. Reviews"]);
    assert.deepEqual(changes, [], "searching cannot switch a section or touch its content");
    await key("Enter");
    assert.deepEqual(changes, ["reviews"]);
    assert.equal(input().value, "4. Reviews");
    assert.equal(input().getAttribute("aria-expanded"), "false");

    await React.act(async () => input().click());
    await search("area");
    assert.equal(options()[0].textContent, "5. Service area");
    await key("Escape");
    assert.equal(input().value, "4. Reviews");
    assert.deepEqual(changes, ["reviews"]);
    await React.act(async () => input().click());
    await search("no such section");
    assert.equal(options().length, 0);
    assert.equal(container.querySelector('[role="status"]').textContent, "No sections found.");
    await key("Enter");
    assert.deepEqual(changes, ["reviews"]);
    await React.act(async () => document.getElementById("outside").focus());
    assert.equal(input().value, "4. Reviews");
    assert.equal(input().getAttribute("aria-expanded"), "false");

    await React.act(async () => input().focus());
    await key("ArrowDown");
    assert.equal(document.getElementById(input().getAttribute("aria-activedescendant")).textContent, "5. Service area");
    await key("Enter");
    assert.equal(input().value, "5. Service area");
    await React.act(async () => container.querySelector('button[aria-label="Show sections"]').click());
    await search("2.");
    await React.act(async () => options()[0].click());
    assert.equal(input().value, "2. Heating & cooling");
    assert.deepEqual(changes, ["reviews", "area", "seasons"]);
    await React.act(async () => { disabled = true; render(); });
    assert.equal(input().disabled, true);
    assert.equal(container.querySelector("button").disabled, true);
  } finally { await React.act(async () => mounted.unmount()); }
});
