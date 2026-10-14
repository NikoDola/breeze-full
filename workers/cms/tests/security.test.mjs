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

test("proof is dormant by default, retains isolated test support, and cannot be enabled on the client site", async () => {
  const { cmsProofEnabled, cmsPageEnabled } = await loadServerModule(new URL("../../../src/lib/cms/scope.ts", import.meta.url));
  const saved = { ...process.env };
  try {
    Object.assign(process.env, { VERCEL: "", VERCEL_ENV: "development", CMS_LIVE_ENABLED: "false",
      CMS_TEST_ENABLED: "true", CMS_TEST_ORIGIN: "http://localhost:3000",
      CMS_PROOF_ENABLED: "false", CMS_LOCAL_PROOF_BUILD: "false" });
    assert.equal(cmsProofEnabled(), false);
    assert.equal(cmsPageEnabled("cms-proof"), false);
    assert.equal(cmsPageEnabled("home"), true);
    process.env.CMS_LOCAL_PROOF_BUILD = "true";
    assert.equal(cmsProofEnabled(), true);
    Object.assign(process.env, { VERCEL: "1", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "cms-testing",
      CMS_TEST_ORIGIN: "https://breeze-full-git-cms-testing-nikodolas-projects.vercel.app" });
    assert.equal(cmsProofEnabled(), false, "A local proof-build flag cannot expose the proof on Vercel");
    process.env.CMS_PROOF_ENABLED = "true";
    assert.equal(cmsProofEnabled(), true, "Future Preview testing needs explicit opt-in");
    Object.assign(process.env, { CMS_LIVE_ENABLED: "true", VERCEL_ENV: "production", VERCEL_GIT_COMMIT_REF: "main",
      CMS_LIVE_ORIGIN: "https://breeze-full.vercel.app", CMS_WORKER_URL: "https://breeze-live-api.nikodola.workers.dev" });
    assert.equal(cmsProofEnabled(), false);
    assert.equal(cmsPageEnabled("cms-proof"), false);
    assert.equal(cmsPageEnabled("home"), true);
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

test("distributed editor gate limits before password comparison and survives outages without bypassing auth", async () => {
  const { protectEditorRequest } = await loadServerModule(new URL("../../../src/lib/cms/access.ts", import.meta.url));
  const { throttleKey } = await loadServerModule(new URL("../../../src/lib/cms/throttle.ts", import.meta.url));
  const saved = { ...process.env }, originalFetch = globalThis.fetch, originalWarn = console.warn;
  const password = randomBytes(32).toString("hex");
  let calls = 0, success = true, outage = false;
  try {
    Object.assign(process.env, { VERCEL: "1", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "cms-testing", CMS_LIVE_ENABLED: "false",
      CMS_TEST_ENABLED: "true", CMS_TEST_ORIGIN: "https://breeze-full-git-cms-testing-nikodolas-projects.vercel.app",
      CMS_WORKER_URL: "https://breeze-test-api.nikodola.workers.dev", CMS_TEST_USERNAME: "tester", CMS_TEST_PASSWORD: password,
      CMS_WRITE_TOKEN: randomBytes(32).toString("hex") });
    console.warn = () => {};
    const origin = process.env.CMS_TEST_ORIGIN;
    const headers = { host: new URL(origin).host, origin, "x-cms-request": "editor", "x-vercel-forwarded-for": "203.0.113.5",
      authorization: `Basic ${Buffer.from(`tester:${password}`).toString("base64")}` };
    globalThis.fetch = async (url, init) => {
      calls++; assert.equal(url, process.env.CMS_WORKER_URL + "/api/admin/auth/throttle");
      assert.equal(init.headers.Authorization, `Bearer ${process.env.CMS_WRITE_TOKEN}`);
      const body = JSON.parse(init.body); assert.match(body.key, /^[a-f0-9]{64}$/);
      assert.ok(!init.body.includes(password) && !init.body.includes("203.0.113.5"));
      if (outage) throw new Error("offline");
      return Response.json({ success, degraded: false });
    };
    const request = extra => new Request(origin + "/api/cms/editor", { method: "POST", headers: { ...headers, ...extra } });
    assert.equal(await protectEditorRequest(request()), null);
    assert.equal((await protectEditorRequest(request({ authorization: "Basic wrong" }))).status, 401);
    success = false;
    const blocked = await protectEditorRequest(request());
    assert.equal(blocked.status, 429); assert.equal(blocked.headers.get("retry-after"), "60");
    assert.equal((await protectEditorRequest(request({ authorization: "Basic another-guess" }))).status, 429);
    success = true; assert.equal(await protectEditorRequest(request()), null, "window recovery does not need account unlock");
    outage = true;
    assert.equal(await protectEditorRequest(request()), null, "limiter outage cannot lock out valid admins");
    assert.equal((await protectEditorRequest(request({ authorization: "Basic wrong" }))).status, 401);
    assert.equal((await protectEditorRequest(request({ origin: "https://evil.example" }))).status, 403);
    const before = calls;
    assert.equal((await protectEditorRequest(new Request(origin, { headers: { host: new URL(origin).host } }))).status, 401);
    assert.equal(calls, before, "normal Basic challenge is free");
    const key = throttleKey(new Headers(headers));
    assert.equal(throttleKey(new Headers({ ...headers, "x-forwarded-for": "198.51.100.8", "x-real-ip": "198.51.100.8" })), key);
    assert.notEqual(throttleKey(new Headers({ ...headers, "x-vercel-forwarded-for": "203.0.113.6" })), key);
    assert.equal(throttleKey(new Headers({ ...headers, "x-vercel-forwarded-for": "fake, 203.0.113.5" })), null);
    Object.assign(process.env, { VERCEL: "", VERCEL_ENV: "development", CMS_TEST_ORIGIN: "http://localhost:3000" });
    assert.equal(throttleKey(new Headers(headers)), throttleKey(new Headers({ ...headers, "x-vercel-forwarded-for": "203.0.113.6" })));
  } finally {
    globalThis.fetch = originalFetch; console.warn = originalWarn;
    for (const name of Object.keys(process.env)) if (!(name in saved)) delete process.env[name];
    Object.assign(process.env, saved);
  }
});

test("report-only CSP permits admin preview/media and has no production unsafe-eval", async () => {
  const { adminReportPolicy } = await loadServerModule(new URL("../../../src/lib/cms/csp.ts", import.meta.url));
  const policy = adminReportPolicy("test-nonce", false, "https://breeze-test-api.nikodola.workers.dev");
  assert.ok(policy.includes("'nonce-test-nonce' 'strict-dynamic'"));
  assert.ok(!policy.includes("'unsafe-eval'"));
  assert.ok(policy.includes("style-src 'self' 'unsafe-inline'"));
  assert.ok(policy.includes("frame-src 'self' https://www.google.com"));
  assert.ok(policy.includes("connect-src 'self' https://breeze-test-api.nikodola.workers.dev"));
  assert.ok(adminReportPolicy("test", true).includes("'unsafe-eval'"));
});
