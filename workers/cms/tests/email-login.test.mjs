import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { admin, bundle, createWorker, migrate } from "./helpers.mjs";

const hash = () => randomBytes(32).toString("hex");
const challenge = extra => ({ id: randomBytes(16).toString("hex"), sourceKey: hash(), emailKey: hash(), bindingHash: hash(), codeHash: hash(), ...extra });
async function setup(t) {
  const mf = await createWorker(); t.after(() => mf.dispose());
  const db = await mf.getD1Database("DB"); await migrate(db);
  const code = await bundle(new URL("../src/email-login.ts", import.meta.url));
  const api = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
  return { mf, db,
    start: (value, now) => api.startEmailLogin(db, "test", value, now),
    complete: (value, status = "sent") => api.completeEmailLogin(db, "test", { id: value.id, status }),
    verify: (value, now) => api.verifyEmailLogin(db, "test", value, now) };
}

test("email codes require delivery, exact browser/inbox/hash and expire after ten minutes", async t => {
  const s = await setup(t), now = 2000000000, value = challenge();
  assert.deepEqual(await s.start(value, now), { accepted: true, retryAfter: 0 });
  assert.equal((await s.verify(value, now)).allowed, false, "pending codes cannot authenticate");
  await s.complete(value);
  for (const field of ["bindingHash", "emailKey", "codeHash"]) {
    assert.equal((await s.verify({ ...value, [field]: hash() }, now+1)).allowed, false, field);
  }
  assert.equal((await s.verify(value, now+599)).allowed, true);
  assert.equal((await s.verify(value, now+599)).allowed, false, "a used code cannot be replayed");
  const expired = challenge(); await s.start(expired, now); await s.complete(expired);
  assert.equal((await s.verify(expired, now+600)).allowed, false);
  const failed = challenge(); await s.start(failed, now); await s.complete(failed, "failed");
  assert.equal((await s.verify(failed, now+1)).allowed, false);
});

test("concurrent verification consumes a code exactly once", async t => {
  const s = await setup(t), now = 2000000000, value = challenge();
  await s.start(value, now); await s.complete(value);
  const results = await Promise.all(Array.from({ length: 10 }, () => s.verify(value, now+1)));
  assert.equal(results.filter(result => result.allowed).length, 1);
  assert.equal((await s.db.prepare("SELECT COUNT(*) AS count FROM cms_email_login_challenges WHERE status = 'consumed'").first()).count, 1);
});

test("five failures lock source and inbox for a fixed hour across resends and different IPs", async t => {
  const s = await setup(t), now = 2000000000, value = challenge();
  await s.start(value, now); await s.complete(value);
  const wrong = { ...value, codeHash: hash() };
  for (let i = 0; i < 4; i++) assert.equal((await s.verify(wrong, now+i)).retryAfter, 0);
  assert.equal((await s.verify(wrong, now+4)).retryAfter, 3600);
  assert.deepEqual(await s.verify(value, now+5), { allowed: false, retryAfter: 3599 });
  assert.equal((await s.verify({ ...value, sourceKey: hash() }, now+6)).retryAfter, 3598, "changing source cannot bypass the inbox lock");
  assert.equal((await s.start(challenge({ sourceKey: value.sourceKey }), now+65)).accepted, false, "source stays locked for other inboxes");
  assert.equal((await s.start(challenge({ emailKey: value.emailKey }), now+66)).accepted, false);
  assert.equal((await s.verify(value, now+3603)).retryAfter, 1);
  assert.equal((await s.start(challenge({ sourceKey: value.sourceKey, emailKey: value.emailKey }), now+3604)).accepted, true);
  assert.equal((await s.verify(value, now+3604)).allowed, false, "the old code has expired while locked");
});

test("resend cooldown and hourly send quota are atomic; new codes replace only the same browser's old code", async t => {
  const s = await setup(t), now = 2000000000, value = challenge();
  await s.start(value, now); await s.complete(value);
  const next = challenge({ sourceKey: value.sourceKey, emailKey: value.emailKey, bindingHash: value.bindingHash });
  assert.deepEqual(await s.start(next, now+59), { accepted: false, retryAfter: 1 });
  await s.start(next, now+60); await s.complete(next);
  assert.equal((await s.verify(value, now+61)).allowed, false, "resend invalidates the previous code in this browser");
  assert.equal((await s.verify(next, now+61)).allowed, true);
  const otherBrowser = challenge({ emailKey: value.emailKey });
  await s.start(otherBrowser, now+120); await s.complete(otherBrowser);
  const sameBrowserAgain = challenge({ sourceKey: value.sourceKey, emailKey: value.emailKey, bindingHash: value.bindingHash });
  await s.start(sameBrowserAgain, now+180); await s.complete(sameBrowserAgain);
  assert.equal((await s.verify(otherBrowser, now+181)).allowed, true, "other browsers keep their own challenge");
  const fifth = challenge({ emailKey: value.emailKey });
  assert.equal((await s.start(fifth, now+240)).accepted, true);
  assert.equal((await s.start(challenge({ emailKey: value.emailKey }), now+300)).accepted, false);
  const sharedSource = hash();
  const racing = await Promise.all(Array.from({ length: 8 }, () => s.start(challenge({ sourceKey: sharedSource }), now+400)));
  assert.equal(racing.filter(result => result.accepted).length, 1);
});

test("daily email budget is capped independently and resets at UTC midnight", async t => {
  const s = await setup(t), now = 2000000000;
  for (let i = 0; i < 50; i++) assert.equal((await s.start(challenge(), now)).accepted, true);
  const blocked = await s.start(challenge(), now);
  assert.equal(blocked.accepted, false); assert.equal(blocked.retryAfter, 86400-now%86400);
  assert.equal((await s.start(challenge(), Math.floor(now/86400)*86400+86400)).accepted, true);
});

test("email RPC rejects direct browser access, malformed hashes and extra fields", async t => {
  const { mf } = await setup(t), value = challenge();
  assert.equal((await admin(mf, "auth/email/request", value, { Authorization: "Bearer wrong" })).status, 401);
  assert.equal((await admin(mf, "auth/email/request", value, { Origin: "https://evil.example" })).status, 403);
  for (const invalid of [{ ...value, codeHash: "123456" }, { ...value, sourceKey: "203.0.113.1" }, { ...value, now: 0 }]) {
    assert.equal((await admin(mf, "auth/email/request", invalid)).status, 400);
  }
  assert.equal((await admin(mf, "auth/email/verify", { ...value, emailKey: "raw@email.example" })).status, 400);
});
