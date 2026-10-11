import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { admin, createWorker, migrate, legacy, token, revalidationSecret } from "./helpers.mjs";

test("Next delivery failure preserves D1 publication, retries without duplicates, and sends no Preview credentials to Worker", async () => {
  const bundled = await build({ entryPoints: [fileURLToPath(new URL("../../../src/lib/cms/delivery.ts", import.meta.url))],
    bundle: true, write: false, platform: "node", format: "esm", plugins: [{ name: "local-server-boundary", setup(b) {
      b.onResolve({ filter: /^(server-only|@vercel\/oidc)$/ }, ({ path }) => ({ path, namespace: "test" }));
      b.onLoad({ filter: /.*/, namespace: "test" }, ({ path }) => ({ contents: path === "server-only" ? "" :
        'export async function getVercelOidcToken() { throw new Error("OIDC must not run on loopback"); }' }));
    } }] });
  const { deliverPublication } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`);
  const mf = await createWorker(), saved = { ...process.env }, originalFetch = globalThis.fetch;
  try {
    const db = await mf.getD1Database("DB"); await migrate(db);
    await admin(mf, "import", { source: legacy });
    const initial = await (await admin(mf, "publish", { expectedVersion: 1 })).json();
    Object.assign(process.env, { VERCEL: "", VERCEL_ENV: "development", CMS_TEST_ENABLED: "true",
      CMS_TEST_ORIGIN: "http://127.0.0.1:3100", CMS_WORKER_URL: "http://127.0.0.1:8787",
      CMS_WRITE_TOKEN: token, CMS_REVALIDATE_SECRET: revalidationSecret });
    let failure = "invalidation";
    globalThis.fetch = async (url, init) => {
      assert.equal(init.redirect, "error");
      if (String(url).startsWith(process.env.CMS_WORKER_URL)) {
        assert.ok(!init.headers["x-vercel-trusted-oidc-idp-token"]);
        assert.ok(!init.headers["x-cms-signature"]);
        return mf.dispatchFetch(url, init);
      }
      assert.ok(String(url).startsWith(process.env.CMS_TEST_ORIGIN));
      assert.ok(!init.headers.Authorization);
      if (String(url).endsWith("/api/cms/revalidate")) {
        if (failure === "invalidation") return new Response("Unavailable", { status: 503 });
        return Response.json({ eventId: JSON.parse(init.body).eventId });
      }
      if (failure === "verification") return new Response("Unavailable", { status: 503 });
      return new Response(`<div data-cms-version="1" data-cms-revision="${initial.publication.revisionId}"></div>`);
    };
    let state = await deliverPublication();
    assert.equal(state.publication.revisionId, initial.publication.revisionId);
    assert.equal(state.delivery.confirmed_at, null);
    assert.match(state.delivery.last_error, /invalidation failed/);
    failure = "verification";
    state = await deliverPublication();
    assert.ok(state.delivery.invalidated_at);
    assert.equal(state.delivery.confirmed_at, null);
    failure = "";
    state = await deliverPublication();
    assert.ok(state.delivery.confirmed_at);
    assert.equal(state.delivery.attempts, 3);
    assert.equal(state.publication.revisionId, initial.publication.revisionId);
    assert.equal((await db.prepare("SELECT COUNT(*) n FROM cms_revisions").first()).n, 1);
    assert.equal((await deliverPublication()).delivery.attempts, 3);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of Object.keys(process.env)) if (!(name in saved)) delete process.env[name];
    Object.assign(process.env, saved);
    await mf.dispose();
  }
});
