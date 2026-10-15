import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { build } from "esbuild";
import { root } from "./helpers.mjs";

const require = createRequire(resolve(root, "package.json"));
const { JSDOM } = require("jsdom");

test("homepage and contact-area previews show live draft contacts without unrelated sections", async t => {
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
  const output = await build({ stdin: { contents: `
    export { default as HomePreview } from './src/featured/admin-test/HomePreview';
    export { homeSeed } from './cms/shared/home-seed';
    export { globalSeed } from './cms/shared/collection-seeds';
    export { withGlobalSettings } from './src/lib/site';
  `, resolveDir: root }, bundle: true, write: false, outfile: "test.cjs", platform: "node", format: "cjs",
    packages: "external", alias: { "@": resolve(root, "src") }, jsx: "automatic" });
  const module = { exports: {} };
  const previewRequire = name => name === "next/navigation" ? { usePathname: () => "/" } : require(name);
  new Function("require", "module", "exports", output.outputFiles[0].text)(previewRequire, module, module.exports);
  const { HomePreview, homeSeed, globalSeed, withGlobalSettings } = module.exports;
  const React = require("react"), { createRoot } = require("react-dom/client");
  const container = document.getElementById("app"), mounted = createRoot(container);
  const initialDocument = structuredClone(homeSeed);
  initialDocument.slots.contact.content.intro = "Currently published homepage introduction.";
  const send = async (doc, options = {}) => React.act(async () => window.dispatchEvent(new window.MessageEvent("message", {
    origin: options.origin ?? window.location.origin, source: options.source === undefined ? window.parent : options.source,
    data: { type: options.type ?? "breeze.cms.global-preview", document: doc },
  })));
  const assertContacts = (phone, href, email) => {
    for (const selector of [".site-header", ".hero", ".contact", ".site-footer"]) {
      const link = container.querySelector(`${selector} a[href^='tel:']`);
      assert.equal(link?.getAttribute("href"), href, selector);
      assert.ok(link.textContent.includes(phone), selector);
    }
    assert.equal(container.querySelector(".footer-email span").textContent, email);
    assert.equal(container.querySelector(".footer-email").getAttribute("href"), `mailto:${email}`);
  };
  try {
    await React.act(async () => mounted.render(React.createElement(HomePreview, {
      site: withGlobalSettings(globalSeed), initialDocument,
    })));
    assert.ok(container.querySelector("#heating-cooling"));
    assert.ok(container.querySelector("#area"));
    assert.ok(container.textContent.includes(initialDocument.slots.contact.content.intro));
    assert.ok(!container.textContent.includes("Contact & social links"));
    const draft = { ...globalSeed, phone: "615-555-0123", email: "draft@example.com", formRecipientEmail: "requests@example.com",
      socials: [{ platform: "instagram", href: "https://www.instagram.com/breeze_test/" }] };
    await send(draft);
    assertContacts(draft.phone, "tel:+16155550123", draft.email);
    assert.equal(container.querySelector(".footer-socials a").getAttribute("href"), draft.socials[0].href);
    assert.ok(container.textContent.includes(initialDocument.slots.contact.content.intro), "Global edits retain the published homepage");
    for (const [doc, options] of [
      [globalSeed, { origin: "https://other.example" }], [globalSeed, { source: null }],
      [{ ...draft, email: "" }, {}], [{ ...draft, phoneIcon: "client override" }, {}],
    ]) {
      await send(doc, options);
      assertContacts(draft.phone, "tel:+16155550123", draft.email);
    }
    await send({ ...globalSeed, socials: [] });
    assertContacts(globalSeed.phone, withGlobalSettings(globalSeed).phoneHref, globalSeed.email);
    assert.equal(container.querySelector(".footer-socials"), null, "Switching to Published removes draft social links");
    const homeDraft = structuredClone(initialDocument);
    homeDraft.slots.contact.content.intro = "Unsaved homepage introduction.";
    await send(homeDraft, { type: "breeze.cms.home-preview" });
    assert.ok(container.textContent.includes(homeDraft.slots.contact.content.intro), "Homepage editing still updates the shared preview");
    const click = new window.MouseEvent("click", { bubbles: true, cancelable: true });
    container.querySelector(".footer-email").dispatchEvent(click);
    assert.equal(click.defaultPrevented, true);
    const submit = new window.Event("submit", { bubbles: true, cancelable: true });
    container.querySelector("#service-form").dispatchEvent(submit);
    assert.equal(submit.defaultPrevented, true);
    assert.equal(container.querySelector(".form-status"), null, "Preview cannot prepare or send service requests");

    await React.act(async () => mounted.render(React.createElement(HomePreview, {
      key: "global", mode: "global", site: withGlobalSettings(globalSeed), initialDocument,
    })));
    assert.equal(container.querySelector(".hero"), null, "Global starts with the footer instead of the full homepage");
    assert.equal(container.querySelector("#heating-cooling"), null);
    assert.equal(container.querySelector("#area"), null);
    const socialLinks = [...container.querySelectorAll(".footer-socials a")];
    assert.deepEqual(socialLinks.map(link => link.getAttribute("href")), [
      "https://www.facebook.com/breezehc/", "https://www.instagram.com/breeze_heating_and_cooling_/",
    ]);
    for (const link of socialLinks) {
      assert.ok(link.getAttribute("aria-label"));
      assert.equal(link.querySelector("svg").getAttribute("fill"), "none");
      assert.equal(link.querySelector("svg").getAttribute("stroke"), "currentColor");
      assert.equal(link.textContent, "", "Social links display outline icons only");
    }
    assert.ok(container.querySelector(".footer-reach > a[href^='tel:']").nextElementSibling.classList.contains("footer-email"));
    assert.equal(container.querySelector(".footer-socials").previousElementSibling.className, "footer-reach");
    assert.equal(container.querySelector(".footer-socials").parentElement.className, "footer-contact");
    await send(draft);
    assert.equal(container.querySelector(".footer-email span").textContent, draft.email);
    const choose = async name => React.act(async () => [...container.querySelectorAll('[aria-label="Contact preview location"] button')]
      .find(button => button.textContent === name).click());
    assert.deepEqual([...container.querySelectorAll('[aria-label="Contact preview location"] button')].map(button => button.textContent),
      ["Footer", "Header", "Hero", "Service request", "Contact location", "Contact banner"]);
    for (const [location, selector] of [["Header", ".site-header"], ["Hero", ".hero"], ["Service request", ".contact"]]) {
      await choose(location);
      assert.ok(container.querySelector(selector), location);
      for (const link of container.querySelectorAll('a[href^="tel:"]')) assert.equal(link.getAttribute("href"), "tel:+16155550123", location);
      for (const link of container.querySelectorAll('a[href^="mailto:"]')) assert.equal(link.getAttribute("href"), "mailto:draft@example.com", location);
      assert.equal(container.querySelector("#heating-cooling"), null, location);
      assert.equal(container.querySelector("#reviews"), null, location);
      assert.equal(container.querySelector("#area"), null, location);
    }
    await choose("Contact location");
    const locationDraft = structuredClone(draft);
    locationDraft.address.street = "125 Test Street";
    locationDraft.mapsHref = "https://maps.app.goo.gl/example";
    await send(locationDraft);
    assert.ok(container.textContent.includes("125 Test Street"));
    assert.ok(container.querySelector("iframe").src.includes("125%20Test%20Street"));
    assert.ok(container.querySelector('a[href="https://maps.app.goo.gl/example"]'));
    await choose("Contact banner");
    locationDraft.sharedCopy.cta.heading = "Updated contact banner";
    await send(locationDraft);
    assert.ok(container.textContent.includes("Updated contact banner"));
    await choose("Footer");
    await send({ ...globalSeed, socials: [] });
    assert.equal(container.querySelector(".footer-socials"), null, "Published can deliberately hide social links");
  } catch (error) {
    if (error instanceof AggregateError) throw error.errors[0];
    throw error;
  } finally { await React.act(async () => mounted.unmount()); }
});
