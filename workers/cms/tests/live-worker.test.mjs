import test from "node:test";
import assert from "node:assert/strict";
import { admin, createWorker, migrate, legacy, token } from "./helpers.mjs";

test("live Worker retains publication security and refuses Preview upload origins/credentials", async t => {
  const origin = "https://breeze-full.vercel.app", credential = crypto.randomUUID() + crypto.randomUUID();
  const mf = await createWorker({ bindings: { CMS_ENVIRONMENT: "live", CMS_UPLOAD_ORIGIN: origin, CMS_WRITE_TOKEN: credential } });
  t.after(() => mf.dispose());
  await migrate(await mf.getD1Database("DB"));
  const request = (path, body) => admin(mf, path, body, { Authorization: `Bearer ${credential}` });
  assert.equal((await admin(mf, "health")).status, 401); // Test credential cannot access live storage.
  assert.notEqual(token, credential);
  assert.equal((await request("health")).status, 200);
  const input = { filename: "test.png", mime: "image/png", bytes: 10, origin };
  assert.equal((await request("media/grant", { ...input, origin: "https://breeze-full-git-cms-testing-nikodolas-projects.vercel.app" })).status, 403);
  assert.equal((await request("media/grant", input)).status, 200);
  assert.equal((await request("import", { source: legacy })).status, 200);
  const state = await (await request("publish", { expectedVersion: 1 })).json();
  assert.equal(state.publication.version, 1);
  assert.equal((await (await request("publish", { expectedVersion: 1 })).json()).publication.revisionId, state.publication.revisionId);
  assert.equal((await mf.dispatchFetch("https://worker.test/api/public/pages/cms-proof")).status, 200);
});

test("live Worker fails closed without its pinned client origin", async () => {
  const mf = await createWorker({ bindings: { CMS_ENVIRONMENT: "live", CMS_UPLOAD_ORIGIN: "http://localhost:3000" } });
  try { assert.equal((await admin(mf, "health")).status, 404); }
  finally { await mf.dispose(); }
});
