import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { transform } from "esbuild";

async function moduleFrom(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const result = await transform(source, { loader: "ts", format: "esm" });
  return import(`data:text/javascript;base64,${Buffer.from(result.code).toString("base64")}`);
}
const { editorStatus } = await moduleFrom("../../../src/featured/admin-test/editor-state.ts");
const { cmsImageSource, cmsSiteImages } = await moduleFrom("../../../src/lib/cms/images.ts");
const document = { schemaVersion: 1, title: "Proof", seoTitle: "", seoDescription: "", section: { eyebrow: "", headline: "Your comfort", body: "", button_text: "", button_route: "", bottom_note: "", images: [] } };
const state = {
  draft: { version: 4, document, updatedAt: "2026-10-12T01:00:00Z" },
  publication: { version: 4, revisionId: "revision", document, publishedAt: "2026-10-12T01:00:00Z" },
  delivery: { revision_id: "revision", draft_version: 4, attempts: 1, invalidated_at: "2026-10-12T01:00:01Z", confirmed_at: "2026-10-12T01:00:02Z", last_error: null, next_attempt_at: 0, lease_until: 0 },
};
const status = changes => editorStatus({ state, baseVersion: 4, dirty: false, operation: null, now: 1000, ...changes });

test("unsaved edits remain distinct from the confirmed saved publication", () => {
  const result = status({ dirty: true });
  assert.equal(result.label, "Unsaved changes");
  assert.equal(result.deliveryLabel, "Visible on the website");
});
test("a saved newer draft is not described as already published", () => {
  const result = status({ baseVersion: 5, state: { ...state, draft: { ...state.draft, version: 5 } } });
  assert.equal(result.label, "Saved draft");
});
test("failed delivery preserves the published state and exposes safe retry", () => {
  const result = status({ state: { ...state, delivery: { ...state.delivery, confirmed_at: null, last_error: "Cache invalidation failed." } } });
  assert.equal(result.label, "Published · refresh failed");
  assert.equal(result.deliveryFailed, true);
  assert.equal(result.leaseActive, false);
});
test("an active delivery lease blocks retry until expiry", () => {
  const pending = { ...state, delivery: { ...state.delivery, confirmed_at: null, lease_until: 2000 } };
  assert.equal(status({ state: pending }).leaseActive, true);
  assert.equal(status({ state: pending, now: 2000 }).leaseActive, false);
  assert.equal(status({ state: pending, now: 2001 }).deliveryLabel, "Awaiting page confirmation");
});
test("publishing and retry remain explicit while a request runs", () => {
  assert.equal(status({ operation: "publish" }).label, "Publishing your draft…");
  assert.equal(status({ operation: "retry" }).label, "Retrying website refresh…");
});
test("late confirmation clears a previous delivery failure", () => {
  const result = status({ state: { ...state, delivery: { ...state.delivery, last_error: "An old failure" } } });
  assert.equal(result.label, "Published");
  assert.equal(result.deliveryFailed, false);
});
test("unsafe image references are never emitted as image sources", () => {
  for (const reference of ["javascript:alert(1)", "data:image/svg+xml,secret", "//other.example/image.jpg", "https://user:password@example.com/image.jpg", "/api/cms/editor", "/api/private.jpg", "/images/../private.jpg", "/images/%2e%2e/private.jpg", "https://example.com\\image.jpg"]) assert.equal(cmsImageSource(reference), null);
  assert.equal(cmsImageSource("hero1.webp"), "/images/hero1.webp");
  assert.equal(cmsImageSource("/images/hero-full.webp"), "/images/hero-full.webp");
  assert.equal(cmsImageSource("https://assets.example.com/image.webp"), "https://assets.example.com/image.webp");
  assert.ok(cmsSiteImages.every(image => cmsImageSource(image.source)));
});
