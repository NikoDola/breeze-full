import { build } from "esbuild";
import { Miniflare, Log, LogLevel, convertV4MiniflareOptions } from "miniflare";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

export const root = fileURLToPath(new URL("../../../", import.meta.url));
export const token = randomBytes(32).toString("hex");
export const revalidationSecret = randomBytes(32).toString("hex");
export const legacy = {
  id: "home-hero", eyebrow: "Welcome to Breeze", headline: "Your Comfort Is Our Priority",
  body: "Professional HVAC services in Nashville, Tennessee.", button_text: "Get a Free Quote",
  button_route: "/contact", bottom_note: "Residential & Commercial",
  images: ["hero1.webp", "hero2.webp", "hero3.webp"], updated_at: "2026-10-10 22:38:17",
};
export async function bundle(entry) {
  return (await build({ entryPoints: [fileURLToPath(entry)], bundle: true, write: false, format: "esm", platform: "neutral", target: "es2022" })).outputFiles[0].text;
}
export async function createWorker(options = {}) {
  const { bindings, ...rest } = options;
  return new Miniflare(convertV4MiniflareOptions({
    modules: true, script: await bundle(new URL("../src/index.ts", import.meta.url)),
    compatibilityDate: "2026-10-01", host: "127.0.0.1", port: 0,
    d1Databases: ["DB"], r2Buckets: ["MEDIA"], log: new Log(LogLevel.ERROR),
    ratelimits: {
      AUTH_RATE_LIMITER: { namespace_id: "1", simple: { limit: 120, period: 60 } },
      SERVICE_RATE_LIMITER: { namespace_id: "2", simple: { limit: 600, period: 60 } },
    },
    bindings: { CMS_ENVIRONMENT: "test", CMS_WRITES_ENABLED: "true", CMS_WRITE_TOKEN: token, ...bindings },
    ...rest,
  }));
}
export async function migrate(db) {
  for (const file of (await readdir(new URL("../migrations/", import.meta.url))).filter(name => name.endsWith(".sql")).sort()) {
  const sql = await readFile(new URL(`../migrations/${file}`, import.meta.url), "utf8");
  // Split only at CREATE boundaries so trigger bodies stay intact.
  for (const statement of sql.replace(/^--.*$/gm, "").trim().split(/;\s*(?=CREATE|ALTER|$)/).filter(s => s.trim())) {
    await db.prepare(statement).run();
  }
  }
}
export async function admin(mf, action = "proof", body, headers = {}) {
  return mf.dispatchFetch(`https://worker.test/api/admin/${action}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
