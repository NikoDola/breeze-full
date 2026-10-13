import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

async function loadServerModule(url) {
  const result = await build({ entryPoints: [fileURLToPath(url)], bundle: true, write: false, platform: "node", format: "esm",
    plugins: [{ name: "server-only-test-boundary", setup(builder) {
      builder.onResolve({ filter: /^server-only$/ }, () => ({ path: "server-only", namespace: "test-empty" }));
      builder.onLoad({ filter: /.*/, namespace: "test-empty" }, () => ({ contents: "" }));
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
}

test("Next editor gate fails closed in production, checks credentials and blocks CSRF", async () => {
  const { authorized, editorEnabled, protectEditor } = await loadServerModule(new URL("../../../src/lib/cms/access.ts", import.meta.url));
  const { cmsOrigin } = await loadServerModule(new URL("../../../src/lib/cms/scope.ts", import.meta.url));
  const saved = { ...process.env };
  try {
    const password = randomBytes(32).toString("hex");
    Object.assign(process.env, { CMS_TEST_ENABLED: "false", CMS_TEST_ORIGIN: "http://localhost:3000", CMS_TEST_USERNAME: "editor",
      CMS_TEST_PASSWORD: password, CMS_WRITE_TOKEN: randomBytes(32).toString("hex"), VERCEL: "", VERCEL_ENV: "development" });
    assert.equal(editorEnabled(), false);
    process.env.CMS_TEST_ENABLED = "true";
    assert.equal(editorEnabled(), true);
    const headers = new Headers({ host: "localhost:3000", authorization: `Basic ${Buffer.from(`editor:${password}`).toString("base64")}` });
    assert.equal(authorized(headers), true);
    headers.set("host", "evil.example"); assert.equal(authorized(headers), false);
    headers.set("host", "localhost:3000");
    assert.equal(protectEditor(new Request("http://localhost:3000/api/cms/editor", { method: "POST", headers }))?.status, 403);
    headers.set("origin", "http://localhost:3000"); headers.set("x-cms-request", "editor");
    assert.equal(protectEditor(new Request("http://localhost:3000/api/cms/editor", { method: "POST", headers })), null);
    process.env.CMS_TEST_PASSWORD = ""; assert.equal(editorEnabled(), false);
    process.env.CMS_TEST_PASSWORD = password;
    process.env.VERCEL_ENV = "production"; assert.equal(editorEnabled(), false); assert.equal(cmsOrigin(), null);
    Object.assign(process.env, { VERCEL: "1", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "cms-testing", CMS_TEST_ORIGIN: "https://breeze-full-git-cms-testing-nikodolas-projects.vercel.app" });
    assert.equal(editorEnabled(), true);
    process.env.VERCEL_GIT_COMMIT_REF = "main"; assert.equal(editorEnabled(), false);
    process.env.VERCEL_GIT_COMMIT_REF = "cms-testing";
    process.env.CMS_TEST_ORIGIN = "https://breeze-full.vercel.app"; assert.equal(editorEnabled(), false);
    process.env.VERCEL_ENV = ""; assert.equal(editorEnabled(), false);
    process.env.VERCEL = ""; assert.equal(editorEnabled(), false); // Non-Vercel remote hosts require a future auth implementation.
  } finally {
    for (const name of Object.keys(process.env)) if (!(name in saved)) delete process.env[name];
    Object.assign(process.env, saved);
  }
});

test("client CMS requires explicit main/production scope, separate credentials and cache namespace", async () => {
  const { authorized, editorEnabled, protectEditor } = await loadServerModule(new URL("../../../src/lib/cms/access.ts", import.meta.url));
  const { cmsScope, cmsCacheTag } = await loadServerModule(new URL("../../../src/lib/cms/scope.ts", import.meta.url));
  const { workerOrigin } = await loadServerModule(new URL("../../../src/lib/cms/worker.ts", import.meta.url));
  const saved = { ...process.env };
  try {
    const live = "https://breeze-full.vercel.app", preview = "https://breeze-full-git-cms-testing-nikodolas-projects.vercel.app";
    const password = randomBytes(32).toString("hex");
    Object.assign(process.env, { VERCEL: "1", VERCEL_ENV: "production", VERCEL_GIT_COMMIT_REF: "main",
      CMS_LIVE_ENABLED: "true", CMS_LIVE_ORIGIN: live, CMS_LIVE_USERNAME: "client", CMS_LIVE_PASSWORD: password,
      CMS_TEST_ENABLED: "true", CMS_TEST_ORIGIN: preview, CMS_TEST_USERNAME: "tester", CMS_TEST_PASSWORD: randomBytes(32).toString("hex"),
      CMS_WRITE_TOKEN: randomBytes(32).toString("hex"), CMS_WORKER_URL: "https://breeze-live-api.nikodola.workers.dev" });
    assert.equal(editorEnabled(), true);
    assert.equal(cmsScope().oidcEnvironment, "production");
    assert.equal(cmsCacheTag("home"), "cms:live:breeze:page:home");
    assert.equal(workerOrigin(), process.env.CMS_WORKER_URL);
    const headers = new Headers({ host: "breeze-full.vercel.app", origin: live, "x-cms-request": "editor",
      authorization: `Basic ${Buffer.from(`client:${password}`).toString("base64")}` });
    assert.equal(authorized(headers), true);
    assert.equal(protectEditor(new Request(live + "/api/cms/editor", { method: "POST", headers })), null);
    headers.set("origin", preview);
    assert.equal(protectEditor(new Request(live + "/api/cms/editor", { method: "POST", headers })).status, 403);
    headers.set("authorization", `Basic ${Buffer.from(`tester:${process.env.CMS_TEST_PASSWORD}`).toString("base64")}`);
    assert.equal(authorized(headers), false);
    const baseline = { ...process.env };
    for (const overrides of [
      { CMS_LIVE_ENABLED: "false" }, { CMS_LIVE_ORIGIN: preview },
      { CMS_LIVE_PASSWORD: "" }, { CMS_WORKER_URL: "https://breeze-test-api.nikodola.workers.dev" },
      { VERCEL_ENV: "preview" }, { VERCEL_GIT_COMMIT_REF: "cms-testing" }, { VERCEL: "" },
    ]) {
      Object.assign(process.env, baseline, overrides);
      assert.equal(editorEnabled(), false, JSON.stringify(Object.keys(overrides)));
    }
    Object.assign(process.env, baseline, { CMS_LIVE_ENABLED: "false", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "cms-testing" });
    assert.throws(workerOrigin, /scope/); // Preview cannot point at the live Worker.
    assert.equal(cmsCacheTag("home"), "cms:preview:cms-testing:page:home");
  } finally {
    for (const name of Object.keys(process.env)) if (!(name in saved)) delete process.env[name];
    Object.assign(process.env, saved);
  }
});

test("webhook HMAC expires and covers timestamp plus exact body", async () => {
  const { sign, verify } = await loadServerModule(new URL("../../../cms/shared/signature.ts", import.meta.url));
  const secret = randomBytes(32).toString("hex"), timestamp = String(Date.now()), body = '{"event":"publish"}';
  const signature = await sign(secret, timestamp, body);
  assert.equal(await verify(secret, timestamp, body, signature), true);
  assert.equal(await verify(secret, timestamp, `${body} `, signature), false);
  const old = String(Date.now() - 600000);
  assert.equal(await verify(secret, old, body, await sign(secret, old, body)), false);
  assert.equal(await verify(secret, timestamp, body, "invalid"), false);
});
