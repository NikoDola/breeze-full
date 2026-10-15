import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const require = createRequire(new URL("../../../package.json", import.meta.url));
async function load(path) {
  const output = await build({ entryPoints: [fileURLToPath(new URL(path, import.meta.url))], bundle: true, write: false,
    platform: "node", format: "cjs", packages: "external", alias: { "@": root + "src" },
    plugins: [{ name: "server-only", setup(builder) {
      builder.onResolve({ filter: /^server-only$/ }, () => ({ path: "empty", namespace: "test" }));
      builder.onLoad({ filter: /.*/, namespace: "test" }, () => ({ contents: "" }));
    } }] });
  const module = { exports: {} };
  new Function("require", "module", "exports", output.outputFiles[0].text)(require, module, module.exports);
  return module.exports;
}
function localEnvironment() {
  const saved = { ...process.env };
  Object.assign(process.env, { CMS_TEST_ENABLED: "true", CMS_TEST_ORIGIN: "http://localhost:3000", CMS_TEST_USERNAME: "editor",
    CMS_TEST_PASSWORD: randomBytes(32).toString("hex"), CMS_WRITE_TOKEN: randomBytes(32).toString("hex"),
    CMS_WORKER_URL: "http://127.0.0.1:8787", CMS_LIVE_ENABLED: "false", VERCEL: "", VERCEL_ENV: "development" });
  return () => { for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]; Object.assign(process.env, saved); };
}

test("signed sessions reject tampering, expiry, wrong hosts and credential rotation", async t => {
  const restore = localEnvironment(); t.after(restore);
  const auth = await load("../../../src/lib/cms/access.ts");
  const token = auth.createEditorSession();
  const headers = new Headers({ host: "localhost:3000", cookie: `${auth.sessionCookieName()}=${token}` });
  assert.equal(auth.authorized(headers), true);
  assert.equal(auth.sessionAuthorized(headers), true);
  assert.equal(auth.sessionAuthorized(headers, Date.now() + auth.SESSION_SECONDS * 1000 + 1000), false);
  const payload = Buffer.from(token.split(".")[0], "base64url").toString();
  assert.ok(!payload.includes(process.env.CMS_TEST_PASSWORD) && !payload.includes(process.env.CMS_WRITE_TOKEN));
  headers.set("cookie", `${auth.sessionCookieName()}=${token}tampered`); assert.equal(auth.authorized(headers), false);
  headers.set("cookie", `${auth.sessionCookieName()}=${token}`);
  headers.set("host", "evil.example"); assert.equal(auth.authorized(headers), false);
  headers.set("host", "localhost:3000");
  const password = process.env.CMS_TEST_PASSWORD;
  process.env.CMS_TEST_PASSWORD = randomBytes(32).toString("hex"); assert.equal(auth.authorized(headers), false);
  process.env.CMS_TEST_PASSWORD = password;
  const writeToken = process.env.CMS_WRITE_TOKEN;
  process.env.CMS_WRITE_TOKEN = randomBytes(32).toString("hex"); assert.equal(auth.authorized(headers), false);
  process.env.CMS_WRITE_TOKEN = writeToken;
  Object.assign(process.env, { VERCEL: "1", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "cms-testing",
    CMS_TEST_ORIGIN: "https://breeze-full-git-cms-testing-nikodolas-projects.vercel.app", CMS_WORKER_URL: "https://breeze-test-api.nikodola.workers.dev" });
  assert.equal(auth.sessionCookieName(), "__Host-breeze-cms-session");
  headers.set("host", new URL(process.env.CMS_TEST_ORIGIN).host);
  headers.set("cookie", `${auth.sessionCookieName()}=${token}`);
  assert.equal(auth.authorized(headers), false);
});

test("login and logout keep CSRF, throttling, cookie protection and cached Basic sign-out", async t => {
  const restore = localEnvironment(); const originalFetch = globalThis.fetch;
  t.after(() => { restore(); globalThis.fetch = originalFetch; });
  const auth = await load("../../../src/lib/cms/access.ts");
  const api = await load("../../../src/featured/admin-test/session-api.ts");
  const origin = "http://localhost:3000";
  let allowed = true, calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ success: allowed, degraded: false }); };
  const request = (body, extra = {}, method = "POST") => new Request(origin + "/api/cms/session", {
    method, headers: { host: "localhost:3000", origin, "x-cms-request": "editor", "content-type": "application/json", ...extra },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
  const credentials = { username: "editor", password: process.env.CMS_TEST_PASSWORD };
  assert.equal((await api.POST(request(credentials, { origin: "https://evil.example" }))).status, 403);
  assert.equal((await api.POST(request(credentials, { host: "evil.example" }))).status, 404);
  assert.equal(calls, 0, "invalid origins and hosts must not reach the limiter");
  const rejected = await api.POST(request({ ...credentials, password: "wrong" }));
  assert.equal(rejected.status, 401); assert.equal(rejected.headers.get("www-authenticate"), null);
  assert.equal(rejected.headers.get("set-cookie"), null);
  const signedIn = await api.POST(request(credentials)); assert.equal(signedIn.status, 200);
  const cookie = signedIn.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=Strict/i); assert.match(cookie, /Path=\//i);
  assert.match(cookie, /Max-Age=28800/i); assert.ok(!cookie.includes(credentials.password));
  const headers = new Headers({ host: "localhost:3000", cookie: cookie.split(";")[0], origin, "x-cms-request": "editor" });
  assert.equal(auth.authorized(headers), true);
  assert.equal(auth.protectEditor(new Request(origin + "/api/cms/editor", { method: "POST", headers })), null);
  headers.set("origin", "https://evil.example");
  assert.equal(auth.protectEditor(new Request(origin + "/api/cms/editor", { method: "POST", headers })).status, 403);
  const signedOut = await api.DELETE(request(null, {}, "DELETE"));
  headers.set("cookie", signedOut.headers.get("set-cookie").split(";")[0]);
  headers.set("authorization", `Basic ${Buffer.from(`editor:${credentials.password}`).toString("base64")}`);
  assert.equal(auth.authorized(headers), false, "sign-out blocks previously cached Basic credentials");
  allowed = false;
  const limited = await api.POST(request(credentials)); assert.equal(limited.status, 429); assert.equal(limited.headers.get("set-cookie"), null);
  process.env.CMS_TEST_ENABLED = "false"; assert.equal((await api.POST(request(credentials))).status, 404);
  Object.assign(process.env, { CMS_TEST_ENABLED: "true", VERCEL: "1", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "cms-testing",
    CMS_TEST_ORIGIN: "https://breeze-full-git-cms-testing-nikodolas-projects.vercel.app", CMS_WORKER_URL: "https://breeze-test-api.nikodola.workers.dev" });
  allowed = true;
  const preview = process.env.CMS_TEST_ORIGIN;
  const secure = await api.POST(new Request(preview + "/api/cms/session", { method: "POST",
    headers: { host: new URL(preview).host, origin: preview, "x-cms-request": "editor", "content-type": "application/json",
      "x-vercel-forwarded-for": "203.0.113.8" },
    body: JSON.stringify(credentials) }));
  assert.equal(secure.status, 200);
  assert.match(secure.headers.get("set-cookie"), /^__Host-breeze-cms-session=/);
  assert.match(secure.headers.get("set-cookie"), /; Secure(?:;|$)/i);
});
