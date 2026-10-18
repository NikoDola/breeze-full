import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { JSDOM } from "jsdom";

// Check actual production HTML and asset budgets, not development bundles.
const buildDirectory = resolve(process.argv[2] ?? ".next");
const results = [];
for (const page of ["index", "contact-us", "emergency", "summer-promotions", "winter-promotions"]) {
  const html = await readFile(resolve(buildDirectory, "server/app", `${page}.html`), "utf8");
  const dom = new JSDOM(html), document = dom.window.document;
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
  const styles = await Promise.all([...stylesheets].map(link => {
    const href = link.getAttribute("href");
    assert.ok(href.startsWith("/_next/static/"), `${page}: unexpected external stylesheet`);
    return readFile(resolve(buildDirectory, href.slice("/_next/".length)), "utf8");
  }));
  const cssBytes = styles.reduce((size, style) => size + Buffer.byteLength(style), 0);
  assert.ok(stylesheets.length <= 4 && cssBytes <= 190 * 1024, `${page}: route CSS budget exceeded`);
  assert.equal(document.querySelector('iframe[src*="housecall"], script[src*="housecall"], script[src*="stripe"], script[src*="recaptcha"]'), null,
    `${page}: a third-party form resource is loading before the visitor approaches the form`);
  assert.ok(document.querySelector('#service-form a[href^="https://book.housecallpro.com/lead-form/"]'), `${page}: direct booking fallback is missing`);
  if (page === "index") {
    assert.ok(document.querySelector('link[rel="preload"][href="/images/hero-full.webp"][media="(max-width: 700px)"]'));
    assert.ok(document.querySelector('link[rel="preload"][href="/images/hero-bg.webp"][media="(min-width: 700.01px)"]'));
    assert.ok(stylesheets.length <= 2 && cssBytes <= 54 * 1024, "homepage CSS budget exceeded");
    assert.ok(gzipSync(html).length <= 18 * 1024, "homepage HTML budget exceeded (avoid duplicating the styles in HTML/RSC)");
    assert.ok(styles.some(style => style.includes(".hero-photo")), "hero styles are missing");
    assert.ok(styles.every(style => !style.includes(".inner-hero") && !style.includes("editor-module__")), "unrelated page styles leaked onto the homepage");
  }
  results.push({ route: page === "index" ? "/" : `/${page}`, stylesheets: stylesheets.length, cssBytes,
    htmlBytes: Buffer.byteLength(html), gzipHtmlBytes: gzipSync(html).length });
  dom.window.close();
}
console.table(results);
console.log("Production HTML checks passed. These checks do not measure a Lighthouse score.");
