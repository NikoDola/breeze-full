import test from "node:test";
import assert from "node:assert/strict";

test("local media optimization remains scoped to development and never enables on Vercel", async () => {
  const keys = ["NODE_ENV", "VERCEL", "VERCEL_ENV", "CMS_TEST_ENABLED", "CMS_TEST_ORIGIN", "CMS_WORKER_URL", "CMS_LOCAL_PROOF_BUILD"];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const local = { NODE_ENV: "development", CMS_TEST_ENABLED: "true", CMS_TEST_ORIGIN: "http://localhost:3000", CMS_WORKER_URL: "http://127.0.0.1:8787" };
  const config = async overrides => {
    for (const key of keys) delete process.env[key];
    Object.assign(process.env, local, overrides);
    return (await import(`../../../next.config.mjs?case=${crypto.randomUUID()}`)).default.images;
  };
  try {
    const development = await config({});
    assert.equal(development.dangerouslyAllowLocalIP, true);
    assert.equal(development.maximumRedirects, 0);
    assert.deepEqual(development.remotePatterns[1], { protocol: "http", hostname: "127.0.0.1", port: "8787", pathname: "/media/**", search: "" });
    for (const overrides of [
      { VERCEL: "1", VERCEL_ENV: "preview", CMS_LOCAL_PROOF_BUILD: "true" },
      { VERCEL_ENV: "production", CMS_LOCAL_PROOF_BUILD: "true" },
      { NODE_ENV: "production" },
      { CMS_TEST_ENABLED: "false" },
      { CMS_TEST_ORIGIN: "https://example.com" },
      { CMS_WORKER_URL: "http://192.168.1.1:8787" },
      { CMS_WORKER_URL: "http://127.0.0.1:8787/other" },
    ]) {
      const images = await config(overrides);
      assert.equal(images.dangerouslyAllowLocalIP, false, JSON.stringify(overrides));
      assert.equal(images.remotePatterns.length, 1);
      assert.equal(images.remotePatterns[0].hostname, "breeze-test-api.nikodola.workers.dev");
    }
    assert.equal((await config({ NODE_ENV: "production", CMS_LOCAL_PROOF_BUILD: "true" })).dangerouslyAllowLocalIP, true);
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
