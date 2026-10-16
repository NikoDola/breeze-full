import { spawn, execFile } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const nextRequire = createRequire(require.resolve("next/package.json"));
const inheritedEnv = { ...process.env };
// Use the same .env file precedence and variable expansion as `next dev`.
nextRequire("@next/env").loadEnvConfig(root, true);

const children = new Set();
let stopping = false;

async function stop(code) {
  if (stopping) return;
  stopping = true;
  await Promise.all([...children].map(child => new Promise(resolve => {
    if (!child.pid) return resolve();
    // Wrangler and Next both spawn descendants. Stop only the trees we own.
    if (process.platform === "win32") {
      execFile("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true }, resolve);
    } else {
      const timer = setTimeout(() => {
        try { process.kill(-child.pid, "SIGKILL"); } catch { /* Already stopped. */ }
        resolve();
      }, 3000);
      child.once("close", () => { clearTimeout(timer); resolve(); });
      try { process.kill(-child.pid, "SIGTERM"); } catch { clearTimeout(timer); resolve(); }
    }
  })));
  process.exit(code);
}

process.on("SIGINT", () => void stop(0));
process.on("SIGTERM", () => void stop(0));

function launch(name, cli, args, cwd = root) {
  const child = spawn(process.execPath, [cli, ...args], {
    cwd, env: inheritedEnv, windowsHide: true,
    // Next owns terminal input; Wrangler must not consume Ctrl+C or hotkeys.
    stdio: name === "CMS Worker" ? ["ignore", "inherit", "inherit"] : "inherit",
    detached: process.platform !== "win32",
  });
  children.add(child);
  child.once("error", error => {
    console.error(`[dev] Could not start ${name}: ${error.message}`);
    void stop(1);
  });
  child.once("exit", (code, signal) => {
    children.delete(child);
    if (stopping) return;
    if (name === "CMS Worker") {
      console.error(`[dev] CMS Worker stopped (${signal ?? code}). Stopping the website.`);
      void stop(code || 1);
    } else {
      void stop(code ?? (signal ? 1 : 0));
    }
  });
  return child;
}

function localWorkerUrl() {
  if (process.env.VERCEL || process.env.VERCEL_ENV === "production" ||
      process.env.CMS_LIVE_ENABLED === "true" || process.env.CMS_TEST_ENABLED !== "true") return null;
  let site;
  try { site = new URL(process.env.CMS_TEST_ORIGIN); } catch { return null; }
  if (site.origin !== process.env.CMS_TEST_ORIGIN || site.username || site.password ||
      site.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(site.hostname)) return null;
  if (!process.env.CMS_WORKER_URL) return null;
  const worker = new URL(process.env.CMS_WORKER_URL);
  if (worker.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(worker.hostname)) return null;
  if (worker.origin !== process.env.CMS_WORKER_URL || worker.username || worker.password) {
    throw new Error("CMS_WORKER_URL must be a loopback origin without a path or credentials.");
  }
  return worker;
}

async function workerReady(worker) {
  let response;
  let value;
  try {
    response = await fetch(new URL("/api/public/pages/home", worker), {
      redirect: "error", signal: AbortSignal.timeout(1000),
    });
    value = await response.json();
  } catch {
    if (!response) return false;
    throw new Error(`The service at ${worker.origin} did not return CMS content. Check CMS_WORKER_URL.`);
  }
  if ((response.status === 200 && value?.revisionId && value?.document) ||
      (response.status === 404 && value?.error === "Not published.")) return true;
  throw new Error(`The CMS at ${worker.origin} returned HTTP ${response.status}. ` +
    "Check the Worker output; if the local schema is missing, run: npm --prefix workers/cms run migrate:local");
}

try {
  const args = process.argv.slice(2);
  // CLI help should work without starting services.
  const worker = args.includes("--help") || args.includes("-h") ? null : localWorkerUrl();
  if (worker) {
    if (await workerReady(worker)) {
      console.log(`[dev] Using the CMS Worker already running at ${worker.origin}.`);
    } else {
      const workerDir = join(root, "workers", "cms");
      let cli;
      try {
        cli = join(dirname(createRequire(join(workerDir, "package.json")).resolve("wrangler/package.json")), "bin", "wrangler.js");
      } catch {
        throw new Error("Install the local CMS dependencies first: npm --prefix workers/cms install");
      }
      console.log(`[dev] Starting local CMS Worker at ${worker.origin}...`);
      launch("CMS Worker", cli, ["dev", "--local", "--ip", "127.0.0.1", "--port", worker.port || "80",
        "--show-interactive-dev-session=false"], workerDir);
      const deadline = Date.now() + 60000;
      while (!await workerReady(worker)) {
        if (Date.now() >= deadline) throw new Error(`The local CMS did not become ready at ${worker.origin} within 60 seconds.`);
        await delay(300);
      }
      console.log("[dev] Local CMS is ready. Starting Next.js...");
    }
  }
  launch("Next.js", require.resolve("next/dist/bin/next"), ["dev", ...args]);
} catch (error) {
  console.error(`[dev] ${error.message}`);
  await stop(1);
}
