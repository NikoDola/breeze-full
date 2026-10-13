import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { build } from "esbuild";
import { root } from "./helpers.mjs";
const require = createRequire(resolve(root, "package.json"));
const { JSDOM } = require("jsdom");
async function load(path) {
  const output = await build({ entryPoints: [resolve(root, path)], bundle: true, write: false, outfile: "test.cjs",
    platform: "node", format: "cjs", packages: "external", jsx: "automatic" });
  const module = { exports: {} }; new Function("require", "module", "exports", output.outputFiles[0].text)(require, module, module.exports);
  return module.exports;
}

test("rich-text editing: paste safety, limits, selection, undo, controlled state and saving lock", async t => {
  const dom = new JSDOM("<!doctype html><div id='app'></div>", { url: "http://localhost", pretendToBeVisual: true });
  const saved = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node,
    MutationObserver: dom.window.MutationObserver, DOMParser: dom.window.DOMParser, ClipboardEvent: dom.window.Event,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window), requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
    cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window), innerHeight: 800, innerWidth: 1200, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  const rect = () => ({ top: 0, bottom: 20, left: 0, right: 100, width: 100, height: 20 });
  dom.window.Range.prototype.getBoundingClientRect = rect;
  dom.window.Range.prototype.getClientRects = () => [rect()];
  dom.window.scrollBy = () => {};
  t.after(async () => { await new Promise(resolve => setTimeout(resolve, 25)); dom.window.close(); for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  const { Editor } = require("@tiptap/core");
  const { headingExtensions } = await load("src/featured/admin-test/rich-text-extensions.ts");
  const { toTiptap, fromTiptap } = await load("src/featured/admin-test/rich-text-adapter.ts");
  const { sameEditorDocument } = await load("cms/shared/editor-document.ts");
  const { editableHome } = await load("cms/shared/home.ts");
  const { homeSeed } = await load("cms/shared/home-seed.ts");
  const plain = text => ({ version: 1, content: text ? [{ type: "text", text }] : [] });

  await t.test("clipboard preserves supported formatting, flattens blocks and strips scripts/links/styles", () => {
    const engine = new Editor({ element: document.createElement("div"), extensions: headingExtensions(), content: toTiptap(plain("")), enableInputRules: false, enablePasteRules: false });
    try {
      engine.view.pasteHTML('<p onclick="bad()"><strong>Hello</strong> <a href="javascript:bad()">world</a><img src="x" onerror="bad()"><script>bad()</script></p><p><em>Next</em> <span style="color:rgb(245, 130, 55)">orange</span> <span style="color:red;font-size:80px">plain</span></p>');
      const result = fromTiptap(engine.getJSON());
      assert.deepEqual(result.content, [
        { type: "text", text: "Hello", bold: true }, { type: "text", text: " world" }, { type: "break" },
        { type: "text", text: "Next", italic: true }, { type: "text", text: " " },
        { type: "text", text: "orange", color: "accent" }, { type: "text", text: " plain" },
      ]);
      assert.ok(!engine.getHTML().includes("javascript:") && !engine.getHTML().includes("<img") && !engine.getHTML().includes("script"));
      engine.commands.selectAll(); engine.view.pasteText("Line one\nLine two");
      assert.deepEqual(fromTiptap(engine.getJSON()).content, [{ type: "text", text: "Line one" }, { type: "break" }, { type: "text", text: "Line two" }]);
    } finally { engine.destroy(); }
  });

  await t.test("limits reject oversized edits without discarding the last valid text", async () => {
    let rejection = "";
    const engine = new Editor({ element: document.createElement("div"), extensions: headingExtensions(message => { rejection = message; }), content: toTiptap(plain("Keep this")) });
    try {
      engine.commands.selectAll(); engine.commands.insertContent({ type: "text", text: "x".repeat(601) });
      await Promise.resolve(); assert.match(rejection, /600/); assert.deepEqual(fromTiptap(engine.getJSON()), plain("Keep this"));
    } finally { engine.destroy(); }
  });

  await t.test("conversion and formatting undo compare cleanly with old drafts", () => {
    const upgraded = editableHome(homeSeed);
    assert.ok(sameEditorDocument(upgraded, homeSeed));
    const changed = structuredClone(upgraded); changed.slots.seasons.content.heading.content[0].bold = true;
    assert.ok(!sameEditorDocument(changed, homeSeed));
    delete changed.slots.seasons.content.heading.content[0].bold;
    assert.ok(sameEditorDocument(changed, homeSeed));
  });

  await t.test("actual React toolbar formats the selected word, echoes without resetting, and locks while saving", async () => {
    const React = require("react"), { createRoot } = require("react-dom/client");
    const { default: RichTextEditor } = await load("src/featured/admin-test/RichTextEditor.tsx");
    const container = document.getElementById("app"), mounted = createRoot(container);
    let current = plain("Hello world"), updates = 0, disabled = false, generation = 0;
    const render = () => mounted.render(React.createElement(RichTextEditor, { key: generation, label: "Heading", value: current, disabled, onChange(value) { updates++; current = value; render(); } }));
    try {
      await React.act(async () => { render(); });
      assert.equal(updates, 0, "loading cannot dirty the draft");
      let engine = container.querySelector('[role="textbox"]').editor;
      await React.act(async () => { engine.commands.setTextSelection({ from: 7, to: 12 }); });
      await React.act(async () => { container.querySelector('button[aria-label="Bold"]').click(); });
      assert.deepEqual(current, { version: 1, content: [{ type: "text", text: "Hello " }, { type: "text", text: "world", bold: true }] });
      assert.equal(engine.state.selection.from, 7); assert.equal(engine.state.selection.to, 12);
      await React.act(async () => { container.querySelector('button[aria-label="Breeze orange"]').click(); });
      assert.equal(current.content[1].color, "accent");
      await React.act(async () => { container.querySelector('button[title="Clear selected formatting"]').click(); });
      assert.deepEqual(current, plain("Hello world"));
      await React.act(async () => { container.querySelector('button[aria-label="Undo"]').click(); });
      assert.ok(engine.can().redo());
      await React.act(async () => { container.querySelector('button[aria-label="Redo"]').click(); });
      assert.deepEqual(current, plain("Hello world"));
      const updateCount = updates;
      await React.act(async () => { disabled = true; render(); });
      assert.equal(container.querySelector('[role="textbox"]').getAttribute("contenteditable"), "false");
      assert.ok([...container.querySelectorAll("button")].every(button => button.disabled));
      assert.equal(updates, updateCount, "saving lock cannot dirty the draft");
      await React.act(async () => { disabled = false; generation++; current = plain("Restored draft"); render(); });
      engine = container.querySelector('[role="textbox"]').editor;
      assert.equal(engine.getText(), "Restored draft"); assert.equal(engine.can().undo(), false, "discard/load clears prior draft undo history");
    } finally { await React.act(async () => { mounted.unmount(); }); }
  });
});
