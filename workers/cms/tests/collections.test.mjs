import { test } from "node:test";
import assert from "node:assert/strict";
import { admin, bundle, createWorker, migrate } from "./helpers.mjs";

const load = async path => import(`data:text/javascript;base64,${Buffer.from(await bundle(new URL(path, import.meta.url))).toString("base64")}`);
const { validateReviews, validateGlobal, favoriteReviews, orderedReviews } = await load("../../../cms/shared/collections.ts");
const { createReviewsSeed, globalSeed } = await load("../../../cms/shared/collection-seeds.ts");
const { homeSeed } = await load("../../../cms/shared/home-seed.ts");
const { withGlobalSettings } = await load("../../../src/lib/site.ts");

test("public email and form recipient are independent, safe, and compatible with historical documents", () => {
  const { formRecipientEmail: omitted, ...legacy } = globalSeed;
  assert.ok(omitted);
  assert.deepEqual(validateGlobal(legacy), legacy);
  assert.equal(withGlobalSettings(legacy).formRecipientEmail, legacy.email);
  const separated = validateGlobal({ ...legacy, email: "public@example.com", formRecipientEmail: "requests+service@example.com" });
  const site = withGlobalSettings(separated);
  assert.equal(site.emailHref, "mailto:public@example.com");
  assert.equal(site.formRecipientHref, "mailto:requests%2Bservice@example.com");
  assert.equal(withGlobalSettings({ ...separated, email: "new-public@example.com" }).formRecipientHref, site.formRecipientHref);
  assert.equal(withGlobalSettings({ ...separated, formRecipientEmail: "new-forms@example.com" }).emailHref, site.emailHref);
  for (const invalid of ["", null, 42, "bad@example.com?bcc=evil@example.com", "bad@example.com\r\nBcc:evil", "bad%0a@example.com", "a".repeat(255)]) {
    assert.throws(() => validateGlobal({ ...legacy, formRecipientEmail: invalid }));
  }
});

test("review import preserves full testimonials and published homepage excerpts", () => {
  const home = structuredClone(homeSeed);
  home.slots.reviews.content.items[0].quote = "Current published excerpt";
  const document = createReviewsSeed(home);
  assert.equal(document.items.length, 15);
  assert.equal(favoriteReviews(document)[0].quote, "Current published excerpt");
  assert.notEqual(orderedReviews(document)[0].quote, "Current published excerpt");
  assert.deepEqual(favoriteReviews(createReviewsSeed()), homeSeed.slots.reviews.content.items.map(({ name, quote }, index) => ({ id: createReviewsSeed().favoriteIds[index], name, quote })));
  // All legacy homepage entries remain in the library, including duplicate names.
  home.slots.reviews.content.items = Array.from({ length: 12 }, (_, i) => ({ id: `legacy-${i}`, name: "Same reviewer", quote: "x".repeat(3000) }));
  const extended = createReviewsSeed(home);
  assert.equal(extended.items.filter(item => item.name === "Same reviewer").length, 12);
  assert.equal(extended.favoriteIds.length, 3);
});

test("strict collection validators reject manipulated fields, invalid favorites and unsafe contact URLs", () => {
  const seed = createReviewsSeed();
  for (const mutate of [
    d => { d.html = "<script>"; }, d => { d.items[0].onclick = "alert(1)"; },
    d => { d.items[0].quote = "a".repeat(4001); }, d => { d.items[1].id = d.items[0].id; },
    d => { d.items[0].visible = "true"; }, d => { d.favoriteIds = ["missing"]; },
    d => { d.favoriteIds = [d.items[0].id, d.items[0].id]; },
    d => { d.items.find(item => item.id === d.favoriteIds[0]).visible = false; },
    d => { d.favoriteIds = d.items.slice(0, 4).map(item => item.id); },
  ]) { const doc = structuredClone(seed); mutate(doc); assert.throws(() => validateReviews(doc)); }
  for (const href of ["javascript:alert(1)", "http://instagram.com/breeze", "https://instagram.com.evil.test/breeze", "https://evil.test/breeze", "https://u:p@instagram.com/breeze", "https://instagram.com/", "https://instagram.com:444/breeze", "https://instagram.com/\nbreeze"]) {
    assert.throws(() => validateGlobal({ ...globalSeed, socials: [{ platform: "instagram", href }] }));
  }
  for (const email of ["test@example.com?bcc=evil@example.com", "test@example.com\r\nBcc:evil", "test%0d%0a@example.com"]) assert.throws(() => validateGlobal({ ...globalSeed, email }));
  assert.throws(() => validateGlobal({ ...globalSeed, phone: "javascript:alert(1)" }));
  assert.throws(() => validateGlobal({ ...globalSeed, socials: [{ platform: "__proto__", href: "https://instagram.com/breeze" }] }));
  const socials = [{ platform: "instagram", href: "https://www.instagram.com/breeze_test/" }];
  assert.deepEqual(validateGlobal({ ...globalSeed, socials }).socials, socials);
  assert.throws(() => validateGlobal({ ...globalSeed, socials: [...socials, ...socials] }));
});

test("reviews/global reuse protected D1 drafts, immutable idempotent publishing and page-owned retries", async t => {
  const mf = await createWorker(); t.after(() => mf.dispose());
  const db = await mf.getD1Database("DB"); await migrate(db);
  await admin(mf, "import", { pageId: "home" });
  const home = structuredClone(homeSeed); home.slots.reviews.content.items[0].quote = "Published custom excerpt";
  await admin(mf, "draft", { pageId: "home", expectedVersion: 1, document: home });
  await admin(mf, "publish", { pageId: "home", expectedVersion: 2 });
  const historical = await db.prepare("SELECT document_json FROM cms_revisions WHERE page_id = 'home'").first();
  for (const pageId of ["reviews", "global"]) {
    assert.equal((await mf.dispatchFetch(`https://worker.test/api/admin/proof?pageId=${pageId}`)).status, 401);
    let state = await (await admin(mf, "import", { pageId })).json();
    if (pageId === "reviews") assert.equal(favoriteReviews(state.draft.document)[0].quote, "Published custom excerpt");
    assert.equal((await mf.dispatchFetch(`https://worker.test/api/public/pages/${pageId}`)).status, 404);
    const doc = structuredClone(state.draft.document);
    if (pageId === "reviews") doc.items.push({ id: "new-review", name: "Test only", quote: "<script>literal text</script>", homeQuote: "", visible: true });
    else { doc.email = "test@example.com"; doc.formRecipientEmail = "forms@example.com"; }
    const saved = await admin(mf, "draft", { pageId, expectedVersion: 1, document: doc }); assert.equal(saved.status, 200);
    assert.equal((await admin(mf, "draft", { pageId, expectedVersion: 1, document: doc })).status, 409);
    assert.equal((await admin(mf, "draft", { pageId, expectedVersion: 2, document: { ...doc, unsafe: true } })).status, 400);
    if (pageId === "global") assert.equal((await admin(mf, "draft", { pageId, expectedVersion: 2, document: { ...doc, formRecipientEmail: "forms@example.com?bcc=evil@example.com" } })).status, 400);
    assert.equal((await admin(mf, "draft", { pageId, expectedVersion: 2, document: { ...doc, title: "x".repeat(50000) } })).status, 400);
    assert.equal((await admin(mf, "draft", { pageId, expectedVersion: 2, document: doc }, { origin: "https://evil.test" })).status, 403);
    state = await (await admin(mf, "import", { pageId })).json(); assert.deepEqual(state.draft.document, doc);
    state = await (await admin(mf, "publish", { pageId, expectedVersion: 2 })).json();
    const revisionId = state.publication.revisionId;
    assert.equal((await (await admin(mf, "publish", { pageId, expectedVersion: 2 })).json()).publication.revisionId, revisionId);
    assert.deepEqual((await (await mf.dispatchFetch(`https://worker.test/api/public/pages/${pageId}`)).json()).document, doc);
    const { claim } = await (await admin(mf, "delivery/claim", { pageId, force: true })).json();
    assert.equal(claim.event.path, pageId === "reviews" ? "/reviews" : "/");
    const ack = { eventId: claim.event.eventId, leaseToken: claim.leaseToken };
    assert.equal((await admin(mf, "delivery/ack", { ...ack, pageId: "home", stage: "invalidated" })).status, 409);
    assert.equal((await admin(mf, "delivery/ack", { ...ack, pageId, stage: "failed", reason: "invalidation" })).status, 200);
    const retry = (await (await admin(mf, "delivery/claim", { pageId, force: true })).json()).claim;
    assert.equal(retry.event.revisionId, revisionId);
    assert.notEqual(retry.leaseToken, claim.leaseToken);
    const nextAck = { pageId, eventId: retry.event.eventId, leaseToken: retry.leaseToken };
    await admin(mf, "delivery/ack", { ...nextAck, stage: "invalidated" });
    assert.equal((await admin(mf, "delivery/ack", { ...nextAck, stage: "confirmed" })).status, 200);
    assert.equal((await db.prepare("SELECT COUNT(*) n FROM cms_revisions WHERE page_id = ?").bind(pageId).first()).n, 1);
  }
  assert.deepEqual(await db.prepare("SELECT document_json FROM cms_revisions WHERE page_id = 'home'").first(), historical);
  await assert.rejects(() => db.prepare("UPDATE cms_revisions SET document_json = '{}'").run(), /immutable/);
});
