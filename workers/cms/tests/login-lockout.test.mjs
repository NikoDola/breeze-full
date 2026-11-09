import test from "node:test";
import assert from "node:assert/strict";
import { admin, bundle, createWorker, migrate } from "./helpers.mjs";

async function setup(t) {
  const mf = await createWorker();
  t.after(() => mf.dispose());
  const db = await mf.getD1Database("DB");
  await migrate(db);
  const code = await bundle(new URL("../src/login.ts", import.meta.url));
  const { recordLoginAttempt } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
  return { mf, db, attempt: (key, valid, now) => recordLoginAttempt(db, key, valid, now) };
}

test("five failures lock for exactly one hour, including correct passwords; retries do not extend it", async t => {
  const { db, attempt } = await setup(t);
  const start = 2000000000;
  for (let i = 0; i < 4; i++) assert.deepEqual(await attempt("client-a", false, start+i), { allowed: false, retryAfter: 0 });
  assert.deepEqual(await attempt("client-a", false, start+4), { allowed: false, retryAfter: 3600 });
  assert.deepEqual(await attempt("client-a", true, start+5), { allowed: false, retryAfter: 3599 });
  assert.deepEqual(await attempt("client-a", false, start+3603), { allowed: false, retryAfter: 1 });
  assert.equal((await db.prepare("SELECT locked_until FROM cms_login_attempts WHERE source_key = ?").bind("client-a").first()).locked_until, start+3604);
  assert.deepEqual(await attempt("client-a", true, start+3604), { allowed: true, retryAfter: 0 });
  assert.equal((await db.prepare("SELECT failed_attempts FROM cms_login_attempts WHERE source_key = ?").bind("client-a").first()).failed_attempts, 0);
});

test("success resets failures, stale failures expire, and other sources remain independent", async t => {
  const { db, attempt } = await setup(t);
  const start = 2000000000;
  for (let i = 0; i < 4; i++) await attempt("client-a", false, start);
  assert.deepEqual(await attempt("client-a", true, start+1), { allowed: true, retryAfter: 0 });
  for (let i = 0; i < 4; i++) assert.equal((await attempt("client-a", false, start+2)).retryAfter, 0);
  assert.equal((await attempt("client-a", false, start+3)).retryAfter, 3600);
  assert.equal((await attempt("client-b", true, start+3)).allowed, true);
  assert.equal((await attempt("client-a", false, start+3603)).retryAfter, 0);
  assert.equal((await db.prepare("SELECT failed_attempts FROM cms_login_attempts WHERE source_key = ?").bind("client-a").first()).failed_attempts, 1);
  for (let i = 0; i < 4; i++) await attempt("old-failures", false, start);
  assert.equal((await attempt("old-failures", false, start+3600)).retryAfter, 0);
  assert.equal((await db.prepare("SELECT failed_attempts FROM cms_login_attempts WHERE source_key = ?").bind("old-failures").first()).failed_attempts, 1);
});

test("simultaneous attempts cannot race past the fifth failure and old rows are cleaned up", async t => {
  const { db, attempt } = await setup(t);
  const now = 2000000000;
  const results = await Promise.all(Array.from({ length: 16 }, () => attempt("shared-source", false, now)));
  assert.equal(results.filter(result => result.retryAfter === 0).length, 4);
  assert.equal(results.filter(result => result.retryAfter === 3600).length, 12);
  assert.equal((await attempt("shared-source", true, now)).allowed, false);
  await attempt("cleanup", true, now+86401);
  assert.equal(await db.prepare("SELECT source_key FROM cms_login_attempts WHERE source_key = ?").bind("shared-source").first(), null);
});

test("login accounting requires the server token, rejects browser origins and arbitrary fields, and works with publishing disabled", async t => {
  const { mf } = await setup(t);
  const body = { key: "c".repeat(64), valid: false };
  assert.equal((await admin(mf, "auth/login", body, { Authorization: "Bearer wrong" })).status, 401);
  assert.equal((await admin(mf, "auth/login", body, { Origin: "https://evil.example" })).status, 403);
  for (const invalid of [{ ...body, key: "raw-ip" }, { ...body, valid: "true" }, { ...body, now: 0 }, { key: body.key }]) {
    assert.equal((await admin(mf, "auth/login", invalid)).status, 400);
  }
  for (let i = 0; i < 4; i++) assert.deepEqual(await (await admin(mf, "auth/login", body)).json(), { allowed: false, retryAfter: 0 });
  assert.deepEqual(await (await admin(mf, "auth/login", body)).json(), { allowed: false, retryAfter: 3600 });
  assert.equal((await (await admin(mf, "auth/login", { ...body, valid: true })).json()).allowed, false);
  const readOnly = await createWorker({ bindings: { CMS_WRITES_ENABLED: "false" } });
  t.after(() => readOnly.dispose());
  await migrate(await readOnly.getD1Database("DB"));
  assert.deepEqual(await (await admin(readOnly, "auth/login", { ...body, valid: true })).json(), { allowed: true, retryAfter: 0 });
});
