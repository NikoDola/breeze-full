import { build } from "esbuild";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const require = createRequire(new URL("../../../package.json", import.meta.url));
export async function loadNext(path) {
  const output = await build({ entryPoints: [fileURLToPath(new URL(path, import.meta.url))], bundle: true, write: false,
    platform: "node", format: "cjs", packages: "external", alias: { "@": root+"src" },
    plugins: [{ name: "server-only", setup(builder) {
      builder.onResolve({ filter: /^server-only$/ }, () => ({ path: "empty", namespace: "test" }));
      builder.onLoad({ filter: /.*/, namespace: "test" }, () => ({ contents: "" }));
    } }] });
  const module = { exports: {} };
  new Function("require", "module", "exports", output.outputFiles[0].text)(require, module, module.exports);
  return module.exports;
}
export function localAuthEnvironment() {
  const saved = { ...process.env };
  Object.assign(process.env, { CMS_TEST_ENABLED: "true", CMS_TEST_ORIGIN: "http://localhost:3000",
    CMS_AUTH_SECRET: randomBytes(32).toString("hex"), CMS_WRITE_TOKEN: randomBytes(32).toString("hex"),
    RESEND_API_KEY: "re_"+randomBytes(24).toString("hex"), CMS_WORKER_URL: "http://127.0.0.1:8787",
    CMS_LIVE_ENABLED: "false", VERCEL: "", VERCEL_ENV: "development" });
  return () => { for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]; Object.assign(process.env, saved); };
}
