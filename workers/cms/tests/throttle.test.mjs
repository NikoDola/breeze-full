import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { admin, createWorker, token } from "./helpers.mjs";

test("native rate bindings enforce a shared source bucket across requests without touching D1", async t => {
  const mf = await createWorker({ bindings: { CMS_WRITES_ENABLED: "false" }, ratelimits: {
    AUTH_RATE_LIMITER: { namespace_id: "11", simple: { limit: 3, period: 60 } },
    SERVICE_RATE_LIMITER: { namespace_id: "12", simple: { limit: 600, period: 60 } },
  } });
  t.after(() => mf.dispose());
  // No migration or D1 initialization: auth throttling is independent of content.
  for (let i = 0; i < 3; i++) assert.equal((await (await admin(mf, "auth/throttle", { key: "a".repeat(64) })).json()).success, true);
  assert.equal((await (await admin(mf, "auth/throttle", { key: "a".repeat(64) })).json()).success, false);
  assert.equal((await (await admin(mf, "auth/throttle", { key: "b".repeat(64) })).json()).success, true);
  assert.equal((await admin(mf, "auth/throttle", { key: "a".repeat(64) }, { Authorization: "Bearer wrong" })).status, 401);
  assert.equal((await admin(mf, "auth/throttle", { key: "a".repeat(64) }, { Origin: "https://evil.example" })).status, 403);
  assert.equal((await admin(mf, "auth/throttle", { key: "raw-ip" })).status, 400);
});

test("direct Worker attempts are throttled before credentials; other sources remain usable", async t => {
  const mf = await createWorker({ ratelimits: {
    AUTH_RATE_LIMITER: { namespace_id: "21", simple: { limit: 120, period: 60 } },
    SERVICE_RATE_LIMITER: { namespace_id: "22", simple: { limit: 2, period: 60 } },
  } });
  t.after(() => mf.dispose());
  const request = (ip, credential = "wrong") => mf.dispatchFetch("https://worker.test/api/admin/auth/throttle", {
    method: "POST", headers: { "cf-connecting-ip": ip, authorization: `Bearer ${credential}`, "Content-Type": "application/json" },
    body: JSON.stringify({ key: "c".repeat(64) }),
  });
  assert.equal((await request("203.0.113.12")).status, 401);
  assert.equal((await request("203.0.113.12")).status, 401);
  const blocked = await request("203.0.113.12", token);
  assert.equal(blocked.status, 429); assert.equal(blocked.headers.get("retry-after"), "60");
  assert.equal((await request("203.0.113.13", token)).status, 200);
});

test("Preview and live rate-limit namespaces are distinct and normal editing has headroom", async () => {
  const configs = await Promise.all(["wrangler.jsonc", "wrangler.live.jsonc"].map(async file => JSON.parse(await readFile(new URL(`../${file}`, import.meta.url), "utf8"))));
  const ids = configs.flatMap(config => config.ratelimits.map(binding => binding.namespace_id));
  assert.equal(new Set(ids).size, 4);
  for (const config of configs) {
    assert.deepEqual(config.ratelimits.find(binding => binding.name === "AUTH_RATE_LIMITER").simple, { limit: 120, period: 60 });
    assert.deepEqual(config.ratelimits.find(binding => binding.name === "SERVICE_RATE_LIMITER").simple, { limit: 600, period: 60 });
  }
});
