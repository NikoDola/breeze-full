import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createWorker, migrate, token } from "./helpers.mjs";
import { loadNext, localAuthEnvironment } from "./next-auth-helpers.mjs";

const approved = ["nikodola@gmail.com", "breezehc@gmail.com", "ranahbeard@gmail.com"];
const origin = "http://localhost:3000";
const headers = { host: "localhost:3000", origin, "x-cms-request": "editor", "content-type": "application/json" };
const request = (body, extra = {}, method = "POST") => new Request(origin+"/api/cms/session", {
  method, headers: { ...headers, ...extra }, body: method === "POST" ? JSON.stringify(body) : undefined,
});
function cookies(response) {
  return response.headers.getSetCookie().map(value => value.split(";")[0]);
}
async function setup(t) {
  const restore = localAuthEnvironment(), originalFetch = globalThis.fetch, originalWarn = console.warn;
  const mf = await createWorker();
  t.after(async () => { restore(); globalThis.fetch = originalFetch; console.warn = originalWarn; await mf.dispose(); });
  console.warn = () => {};
  process.env.CMS_WRITE_TOKEN = token;
  const db = await mf.getD1Database("DB"); await migrate(db);
  const auth = await loadNext("../../../src/lib/cms/access.ts");
  const api = await loadNext("../../../src/featured/admin-test/session-api.ts");
  const emails = [];
  const state = { delivery: "ok", workerDown: false, activationTimeout: false };
  globalThis.fetch = async (url, init) => {
    if (url === "https://api.resend.com/emails") {
      const body = JSON.parse(init.body);
      assert.equal(body.from, "Breeze admin <verification@nikodola.com>");
      assert.match(init.headers["Idempotency-Key"], /^breeze-login\/[a-f0-9]{32}$/);
      emails.push({ ...body, code: body.text.match(/code is: (\d{6})/)[1] });
      if (state.delivery === "timeout") throw new Error("timeout with secret provider details");
      return state.delivery === "ok" ? Response.json({ id: randomBytes(16).toString("hex") }) : Response.json({ message: "private provider error" }, { status: 403 });
    }
    if (state.workerDown && !url.endsWith("auth/throttle")) throw new Error("database offline");
    const response = await mf.dispatchFetch(url, init);
    if (state.activationTimeout && url.endsWith("/auth/email/complete") && JSON.parse(init.body).status === "sent") {
      state.activationTimeout = false;
      throw new Error("connection lost after activation");
    }
    return response;
  };
  const send = async (email = approved[0], cookie) => {
    const response = await api.POST(request({ action: "request-code", email }, cookie ? { cookie } : {}));
    return { response, cookie: cookies(response)[0], code: emails.at(-1)?.code };
  };
  const verify = (email, code, cookie) => api.POST(request({ action: "verify-code", email, code }, cookie ? { cookie } : {}));
  return { db, api, auth, emails, state, send, verify };
}

test("approved inboxes receive one-use codes; only verification creates a secure eight-hour session", async t => {
  const s = await setup(t);
  for (const email of approved) {
    await s.db.prepare("UPDATE cms_email_login_send_limits SET last_sent = 0").run();
    const pending = await s.send(` ${email.toUpperCase()} `);
    assert.equal(pending.response.status, 200);
    assert.equal(s.emails.at(-1).to[0], email);
    const body = await pending.response.json();
    assert.equal(body.resendAfter, 60); assert.ok(!JSON.stringify(body).includes(pending.code));
    assert.match(pending.response.headers.get("set-cookie"), /HttpOnly.*SameSite=Strict/i);
    assert.ok(!pending.cookie.includes(pending.code));
    assert.equal(s.auth.authorized(new Headers({ ...headers, cookie: pending.cookie })), false);
    const result = await s.verify(email, pending.code, pending.cookie);
    assert.equal(result.status, 200);
    const session = cookies(result).find(value => value.startsWith(s.auth.sessionCookieName()+"="));
    assert.match(result.headers.get("set-cookie"), /Max-Age=28800/i);
    assert.equal(s.auth.authorized(new Headers({ ...headers, cookie: session })), true);
    assert.equal((await s.verify(email, pending.code, pending.cookie)).status, 401);
  }
  const records = await s.db.prepare("SELECT * FROM cms_email_login_challenges").all();
  for (const row of records.results) {
    const raw = JSON.stringify(row);
    for (const email of approved) assert.ok(!raw.includes(email));
    for (const sent of s.emails) assert.notEqual(row.code_hash, sent.code);
  }
});

test("unknown inboxes get a generic response and no email, and old passwords/Basic headers cannot authenticate", async t => {
  const s = await setup(t);
  const unknown = await s.send("unknown@example.com");
  assert.equal(unknown.response.status, 200); assert.equal(s.emails.length, 0);
  assert.match((await unknown.response.json()).message, /If this email has admin access/);
  assert.equal((await s.verify("unknown@example.com", "123456", unknown.cookie)).status, 401);
  assert.equal((await s.api.POST(request({ username: "editor", password: "old password" }))).status, 400);
  assert.equal(s.auth.authorized(new Headers({ ...headers, authorization: "Basic ZWRpdG9yOnBhc3N3b3Jk" })), false);
  assert.throws(() => s.auth.createEditorSession("unknown@example.com"));
});

test("CSRF, malformed input and wrong hosts never send a code; verification is browser-bound", async t => {
  const s = await setup(t), body = { action: "request-code", email: approved[0] };
  assert.equal((await s.api.POST(request(body, { origin: "https://evil.example" }))).status, 403);
  assert.equal((await s.api.POST(request(body, { host: "evil.example" }))).status, 404);
  assert.equal((await s.api.POST(request({ ...body, extra: true }))).status, 400);
  assert.equal((await s.api.POST(request({ ...body, email: "<nikodola@gmail.com>" }))).status, 400);
  assert.equal(s.emails.length, 0);
  const pending = await s.send();
  assert.equal((await s.verify(approved[0], pending.code)).status, 401);
  assert.equal((await s.verify(approved[1], pending.code, pending.cookie)).status, 401);
  assert.equal((await s.verify(approved[0], pending.code, pending.cookie)).status, 200);
});

test("five incorrect codes lock for an hour and resends, refreshes or spoofed headers cannot reset failures", async t => {
  const s = await setup(t), pending = await s.send();
  const wrong = pending.code === "111111" ? "222222" : "111111";
  for (let i = 0; i < 2; i++) assert.equal((await s.verify(approved[0], wrong, pending.cookie)).status, 401);
  await s.db.prepare("UPDATE cms_email_login_send_limits SET last_sent = 0").run();
  const resent = await s.send(approved[0], pending.cookie);
  assert.equal(resent.response.status, 200);
  const wrongAgain = resent.code === "111111" ? "222222" : "111111";
  for (let i = 0; i < 2; i++) assert.equal((await s.verify(approved[0], wrongAgain, resent.cookie)).status, 401);
  const fifth = await s.verify(approved[0], wrongAgain, resent.cookie);
  assert.equal(fifth.status, 429); assert.equal(fifth.headers.get("retry-after"), "3600");
  assert.equal((await s.verify(approved[0], resent.code, resent.cookie)).status, 429);
  const retry = await s.api.POST(request({ action: "request-code", email: approved[0] }, { "x-forwarded-for": "203.0.113.5" }));
  assert.equal(retry.status, 429); assert.equal(s.emails.length, 2);
  const cookie = `${s.auth.sessionCookieName()}=${s.auth.createEditorSession(approved[0])}`;
  assert.equal(await s.auth.protectEditorRequest(new Request(origin+"/api/cms/editor", { headers: { ...headers, cookie } })), null);
});

test("resends have a persistent cooldown; provider errors/timeouts never activate codes or leak details", async t => {
  const s = await setup(t), pending = await s.send();
  assert.equal((await s.send(approved[0], pending.cookie)).response.status, 429);
  assert.equal(s.emails.length, 1);
  for (const outcome of ["error", "timeout"]) {
    await s.db.prepare("UPDATE cms_email_login_send_limits SET last_sent = 0").run();
    s.state.delivery = outcome;
    const failed = await s.send(approved[0], pending.cookie);
    assert.equal(failed.response.status, 503);
    assert.ok(!(await failed.response.text()).includes("provider"));
  }
  assert.equal((await s.db.prepare("SELECT COUNT(*) AS count FROM cms_email_login_challenges WHERE status = 'failed'").first()).count, 2);
});

test("missing provider configuration and protection outages fail closed; signed-in sessions remain usable", async t => {
  const s = await setup(t);
  process.env.RESEND_API_KEY = "";
  assert.equal((await s.send()).response.status, 503); assert.equal(s.emails.length, 0);
  process.env.RESEND_API_KEY = "re_test";
  s.state.workerDown = true;
  assert.equal((await s.send()).response.status, 503); assert.equal(s.emails.length, 0);
  assert.equal((await s.verify(approved[0], "123456")).status, 503);
  const cookie = `${s.auth.sessionCookieName()}=${s.auth.createEditorSession(approved[0])}`;
  assert.equal(await s.auth.protectEditorRequest(new Request(origin, { headers: { ...headers, cookie } })), null);
});

test("an uncertain activation disables the delivered code without automatically sending again", async t => {
  const s = await setup(t);
  s.state.activationTimeout = true;
  const pending = await s.send();
  assert.equal(pending.response.status, 503);
  assert.equal(s.emails.length, 1);
  assert.equal((await s.db.prepare("SELECT status FROM cms_email_login_challenges").first()).status, "failed");
});

test("HTTPS Preview issues host-only secure challenge and session cookies", async t => {
  const s = await setup(t);
  const preview = "https://breeze-full-git-cms-testing-nikodolas-projects.vercel.app";
  Object.assign(process.env, { VERCEL: "1", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "cms-testing",
    CMS_TEST_ORIGIN: preview, CMS_WORKER_URL: "https://breeze-test-api.nikodola.workers.dev" });
  const secureHeaders = { ...headers, host: new URL(preview).host, origin: preview, "x-vercel-forwarded-for": "203.0.113.9" };
  const send = await s.api.POST(new Request(preview+"/api/cms/session", { method: "POST", headers: secureHeaders,
    body: JSON.stringify({ action: "request-code", email: approved[0] }) }));
  assert.equal(send.status, 200);
  assert.match(send.headers.get("set-cookie"), /^__Host-breeze-cms-challenge=/);
  assert.match(send.headers.get("set-cookie"), /; Secure(?:;|$)/i);
  assert.ok(!send.headers.get("set-cookie").includes("Domain="));
  const verify = await s.api.POST(new Request(preview+"/api/cms/session", { method: "POST",
    headers: { ...secureHeaders, cookie: cookies(send)[0] },
    body: JSON.stringify({ action: "verify-code", email: approved[0], code: s.emails[0].code }) }));
  assert.equal(verify.status, 200);
  const session = verify.headers.getSetCookie().find(value => value.startsWith("__Host-breeze-cms-session="));
  assert.match(session, /; Secure(?:;|$)/i); assert.match(session, /HttpOnly/i); assert.match(session, /SameSite=Strict/i);
});

test("email sessions reject tampering, expiry, scope changes and secret rotation; sign-out removes both cookies", async t => {
  const s = await setup(t);
  const value = s.auth.createEditorSession(approved[0]);
  const h = new Headers({ ...headers, cookie: `${s.auth.sessionCookieName()}=${value}` });
  assert.equal(s.auth.authorized(h), true);
  assert.equal(s.auth.sessionAuthorized(h, Date.now()+8*3600*1000+1000), false);
  h.set("cookie", `${s.auth.sessionCookieName()}=${value}x`); assert.equal(s.auth.authorized(h), false);
  h.set("cookie", `${s.auth.sessionCookieName()}=${value}`); h.set("host", "evil.example"); assert.equal(s.auth.authorized(h), false);
  h.set("host", "localhost:3000");
  const secret = process.env.CMS_AUTH_SECRET;
  process.env.CMS_AUTH_SECRET = randomBytes(32).toString("hex"); assert.equal(s.auth.authorized(h), false);
  process.env.CMS_AUTH_SECRET = secret;
  const { loginDigest } = await loadNext("../../../src/lib/cms/email-settings.ts");
  for (const identity of [{ version: 1, email: approved[0] }, { version: 2, email: "unknown@example.com" }]) {
    const payload = Buffer.from(JSON.stringify({ ...identity, expires: Math.floor(Date.now()/1000)+3600 })).toString("base64url");
    h.set("cookie", `${s.auth.sessionCookieName()}=${payload}.${loginDigest("session", process.env.CMS_WRITE_TOKEN, payload)}`);
    assert.equal(s.auth.authorized(h), false, "old session versions and unapproved emails are rejected even with a matching signature");
  }
  const out = await s.api.DELETE(request(null, {}, "DELETE"));
  assert.equal(out.status, 200); assert.equal(out.headers.getSetCookie().length, 2);
  assert.ok(out.headers.getSetCookie().every(item => /Max-Age=0/i.test(item)));
  Object.assign(process.env, { VERCEL: "1", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "cms-testing",
    CMS_TEST_ORIGIN: "https://breeze-full-git-cms-testing-nikodolas-projects.vercel.app", CMS_WORKER_URL: "https://breeze-test-api.nikodola.workers.dev" });
  assert.equal(s.auth.sessionCookieName(), "__Host-breeze-cms-session");
  h.set("host", new URL(process.env.CMS_TEST_ORIGIN).host); assert.equal(s.auth.authorized(h), false);
});
