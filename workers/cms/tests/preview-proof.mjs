// Explicitly opt in to mutations of the isolated proof page. Never targets production.
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const origin = "https://breeze-full-git-cms-testing-nikodolas-projects.vercel.app";
const worker = "https://breeze-test-api.nikodola.workers.dev";
assert.equal(process.env.CMS_TEST_ORIGIN, origin);
assert.equal(process.env.CMS_WORKER_URL, worker);
for (const name of ["CMS_TEST_PASSWORD", "CMS_WRITE_TOKEN", "CMS_REVALIDATE_SECRET", "VERCEL_OIDC_TOKEN"]) assert.ok(process.env[name]?.length >= 32, `${name} is missing`);
const oidc = { "x-vercel-trusted-oidc-idp-token": process.env.VERCEL_OIDC_TOKEN };
const auth = { ...oidc, authorization: `Basic ${Buffer.from(`${process.env.CMS_TEST_USERNAME}:${process.env.CMS_TEST_PASSWORD}`).toString("base64")}`,
  origin, "content-type": "application/json", "x-cms-request": "editor" };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const report = { recordedAt: new Date().toISOString(), origin, worker, checks: [], samples: {}, metrics: {}, counts: {} };
const check = name => { report.checks.push(name); console.log(`PASS: ${name}`); };
async function request(url, init = {}) {
  const start = performance.now();
  const response = await fetch(url, { ...init, redirect: "manual", signal: AbortSignal.timeout(65000) });
  const body = await response.text();
  return { status: response.status, body, ms: performance.now() - start, cache: response.headers.get("x-vercel-cache"),
    nextCache: response.headers.get("x-nextjs-cache"), edge: response.headers.get("x-vercel-id")?.split("::")[0] };
}
async function editor(body) {
  const response = await request(`${origin}/api/cms/editor`, { headers: auth, method: body ? "POST" : "GET", body: body ? JSON.stringify(body) : undefined });
  assert.equal(response.status, 200, `Editor returned ${response.status}`);
  return { ...response, value: JSON.parse(response.body) };
}
async function workerAdmin(action, body) {
  const response = await request(`${worker}/api/admin/${action}`, { headers: { authorization: `Bearer ${process.env.CMS_WRITE_TOKEN}`, "content-type": "application/json" },
    method: body ? "POST" : "GET", body: body ? JSON.stringify(body) : undefined });
  assert.equal(response.status, 200, `Worker ${action} returned ${response.status}`);
  return JSON.parse(response.body);
}
async function invalidate(publication, path = "/cms-proof") {
  const event = { eventId: randomUUID(), revisionId: publication.revisionId, version: publication.version, pageId: "cms-proof", path };
  const body = JSON.stringify(event), timestamp = String(Date.now());
  return request(`${origin}/api/cms/revalidate`, { method: "POST", body, headers: { ...oidc,
    "x-cms-timestamp": timestamp, "x-cms-signature": createHmac("sha256", process.env.CMS_REVALIDATE_SECRET).update(`${timestamp}.${body}`).digest("hex") } });
}
async function page(publication, uncached = false) {
  const response = await request(`${origin}/cms-proof`, { headers: { ...oidc, ...(uncached ? { Pragma: "no-cache" } : {}) } });
  assert.equal(response.status, 200);
  assert.ok(response.body.includes(`data-cms-revision="${publication.revisionId}"`), "Expected revision is not visible");
  return response;
}

// Tail raw requests can contain authorization headers. Keep only sanitized counts
// in memory; never print or save raw tail JSON, request headers, or content.
let tail, tailExit, tailBytes = 0;
let probeSequence = 0;
const events = [];
function consumeTail() {
  let current = "", depth = 0, quoted = false, escaped = false;
  return chunk => {
    for (const char of chunk.toString()) {
      if (!depth) { if (char !== "{") continue; current = "{"; depth = 1; continue; }
      current += char;
      if (quoted) { if (escaped) escaped = false; else if (char === "\\") escaped = true; else if (char === '"') quoted = false; }
      else if (char === '"') quoted = true;
      else if (char === "{") depth++;
      else if (char === "}" && --depth === 0) {
        try {
          const raw = JSON.parse(current);
          if (raw.event?.request?.url) events.push({ path: new URL(raw.event.request.url).pathname,
            at: raw.eventTimestamp, received: Date.now(), d1: (raw.logs ?? []).filter(log => (log.message ?? []).some(message => {
              try { return JSON.parse(message).event === "cms.public.d1-read"; } catch { return false; }
            })).length });
        } catch { /* CLI status output is not an event */ }
        current = "";
      }
    }
  };
}
async function barrier() {
  // Cloudflare redacts UUID-shaped path segments in tail events.
  const path = `/__cms_probe/probe${Date.now().toString(36)}x${++probeSequence}`;
  await request(worker + path);
  for (let i = 0; i < 100; i++) {
    if (tailExit !== undefined) throw new Error(`Worker log subscription exited (${tailExit}); check Wrangler access`);
    if (events.some(event => event.path === path)) { await sleep(1000); return; }
    // The initial probe can precede the WebSocket subscription becoming ready.
    if (i > 0 && i % 10 === 0) await request(worker + path);
    await sleep(100);
  }
  throw new Error(`Worker tail marker missing (${tailBytes} log bytes, ${events.length} events); cannot establish request counts`);
}
async function counted(name, action) {
  await barrier(); const start = events.length;
  await action(); await barrier();
  const measured = events.slice(start);
  report.counts[name] = { workerRequests: measured.filter(e => !e.path.startsWith("/__cms_probe/")).length,
    publicApiRequests: measured.filter(e => e.path === "/api/public/pages/cms-proof").length,
    d1PublicReads: measured.reduce((sum, e) => sum + e.d1, 0) };
}
function summarize(samples) {
  const values = [...samples].sort((a, b) => a - b), n = values.length;
  return { n, medianMs: Math.round((n % 2 ? values[(n - 1) / 2] : (values[n / 2 - 1] + values[n / 2]) / 2) * 100) / 100,
    p95Ms: Math.round(values[Math.ceil(n * .95) - 1] * 100) / 100 };
}
try {
  const preflight = (await editor({ action: "preflight" })).value;
  assert.equal(preflight.ok, true); assert.equal(preflight.identity, "preview-oidc");
  assert.equal(preflight.region, "iad1"); assert.equal(preflight.branch, "cms-testing");
  report.preflight = preflight;
  check("Next Preview OIDC self-access, HMAC, Worker credential, schema and iad1 verified");
  assert.equal((await request(`${origin}/api/cms/editor`, { headers: oidc })).status, 401);
  assert.equal((await request(`${origin}/api/cms/editor`, { headers: { ...auth, origin: "https://evil.example" }, method: "POST", body: '{"action":"publish"}' })).status, 403);
  assert.equal((await request(`${origin}/api/cms/revalidate`, { headers: oidc, method: "POST", body: "{}" })).status, 401);
  assert.equal((await invalidate({ revisionId: randomUUID(), version: 1 }, "/")).status, 400);
  assert.equal((await request(`${worker}/api/admin/publish`, { method: "POST", headers: { "content-type": "application/json" }, body: '{"expectedVersion":1}' })).status, preflight.writesEnabled ? 401 : 404);
  check("Unauthenticated writes, CSRF and out-of-scope cache invalidation rejected");
  if (!process.argv.includes("--allow-test-writes")) {
    assert.equal(preflight.writesEnabled, false, "Expected preflight before writes are enabled");
    report.status = "preflight-passed";
  } else {
    assert.equal(preflight.writesEnabled, true);
    // No sampling filter means all events; Wrangler rejects an explicit rate of 1.
    // Run the CLI directly so cleanup terminates the actual subscription on Windows.
    tail = spawn(process.execPath, ["node_modules/wrangler/wrangler-dist/cli.js", "tail", "breeze-test-api", "--format", "json"],
      { cwd: fileURLToPath(new URL("../", import.meta.url)), windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    const consume = consumeTail();
    tail.stdout.on("data", chunk => { tailBytes += chunk.length; consume(chunk); });
    tail.stderr.on("data", () => {});
    tail.on("exit", code => { tailExit = code; });
    await sleep(8000); await barrier();
    check("Worker log subscription is receiving probe events");
    let state = (await editor({ action: "import" })).value;
    const baseline = structuredClone(state.draft.document);
    const draft = structuredClone(baseline); draft.section.headline = `Preview proof ${randomUUID()}`;
    state = (await editor({ action: "draft", expectedVersion: state.draft.version, document: draft })).value;
    const before = await request(`${origin}/cms-proof`, { headers: oidc });
    assert.ok(!before.body.includes(draft.section.headline));
    check("Draft is saved to isolated D1 and absent from public HTML");
    state = (await editor({ action: "publish", expectedVersion: state.draft.version })).value;
    assert.ok(state.delivery.confirmed_at, state.delivery.last_error ?? "Delivery is pending");
    await page(state.publication);
    const publishedId = state.publication.revisionId;
    state = (await editor({ action: "publish", expectedVersion: state.draft.version })).value;
    assert.equal(state.publication.revisionId, publishedId);
    check("Immutable publication is confirmed in HTML; duplicate publish reuses revision");

    // Reproduce interruption after the D1 commit, before Next cache delivery.
    const recovery = structuredClone(baseline); recovery.section.headline = `Recovery proof ${randomUUID()}`;
    state = (await editor({ action: "draft", expectedVersion: state.draft.version, document: recovery })).value;
    state = await workerAdmin("publish", { expectedVersion: state.draft.version });
    assert.equal(state.delivery.confirmed_at, null);
    const recoveryId = state.publication.revisionId;
    state = (await editor({ action: "retry" })).value;
    assert.equal(state.publication.revisionId, recoveryId); assert.ok(state.delivery.confirmed_at);
    await page(state.publication);
    check("Interrupted post-commit delivery safely retries without a duplicate revision");

    report.samples.worker = [];
    await counted("directWorker", async () => {
      for (let i = 0; i < 30; i++) {
        const sample = await request(`${worker}/api/public/pages/cms-proof`); assert.equal(sample.status, 200);
        report.samples.worker.push(sample.ms);
        // Space origin reads so the live log stream can retain every event.
        // This wait is outside the latency measurement; this is not a load test.
        await sleep(1200);
      }
    });
    assert.equal(report.counts.directWorker.d1PublicReads, 30, "Tail calibration failed");
    check("30 direct Worker requests calibrated against 30 D1 read events");
    report.samples.uncachedNext = []; report.uncachedHeaders = [];
    await counted("uncachedNext", async () => {
      for (let i = 0; i < 30; i++) {
        assert.equal((await invalidate(state.publication)).status, 200);
        const sample = await page(state.publication, true);
        report.samples.uncachedNext.push(sample.ms); report.uncachedHeaders.push(sample.cache);
        await sleep(1200);
      }
    });
    assert.ok(report.uncachedHeaders.every(value => value === "REVALIDATED" || value === "MISS"));
    // ISR may perform additional origin reads while regenerating HTML and data.
    // Report the measured count rather than assuming one read per page.
    assert.ok(report.counts.uncachedNext.d1PublicReads >= 30, "Invalidated pages must refill content from D1");
    check(`30 regenerated pages measured; ${report.counts.uncachedNext.d1PublicReads} D1 read events observed`);
    await page(state.publication);
    report.samples.cachedNext = []; report.cachedHeaders = [];
    await counted("cachedNext", async () => {
      for (let i = 0; i < 50; i++) {
        const sample = await page(state.publication); report.samples.cachedNext.push(sample.ms); report.cachedHeaders.push(sample.cache);
      }
    });
    assert.ok(report.cachedHeaders.every(value => value === "HIT"));
    assert.equal(report.counts.cachedNext.publicApiRequests, 0); assert.equal(report.counts.cachedNext.d1PublicReads, 0);
    check("50 cached Preview responses are HITs with zero Worker/D1 content reads");
    report.samples.publishToVisible = [];
    for (let i = 0; i < 10; i++) {
      const document = structuredClone(baseline); document.section.headline = `Publishing measurement ${i + 1} ${randomUUID()}`;
      state = (await editor({ action: "draft", expectedVersion: state.draft.version, document })).value;
      const start = performance.now(); state = (await editor({ action: "publish", expectedVersion: state.draft.version })).value;
      assert.ok(state.delivery.confirmed_at); await page(state.publication);
      report.samples.publishToVisible.push(performance.now() - start);
    }
    state = (await editor({ action: "draft", expectedVersion: state.draft.version, document: baseline })).value;
    state = (await editor({ action: "publish", expectedVersion: state.draft.version })).value;
    assert.ok(state.delivery.confirmed_at); await page(state.publication);
    report.finalPublication = { revisionId: state.publication.revisionId, version: state.publication.version };
    for (const [name, samples] of Object.entries(report.samples)) report.metrics[name] = summarize(samples);
    check("Ten edit/publish cycles confirmed; baseline test content restored");
    report.status = "passed";
    console.log(JSON.stringify({ metrics: report.metrics, counts: report.counts }, null, 2));
  }
} catch (error) {
  report.status = "failed"; report.error = error instanceof Error ? error.message : "Test failed";
  report.networkErrorCode = error?.cause?.code ?? null;
  console.error(report.error, report.networkErrorCode ?? ""); process.exitCode = 1;
} finally {
  if (tail) tail.kill();
  await mkdir(new URL("../../../.local/", import.meta.url), { recursive: true });
  const path = new URL(`../../../.local/cms-preview-${process.argv.includes("--allow-test-writes") ? "results" : "preflight"}.json`, import.meta.url);
  await writeFile(path, JSON.stringify(report, null, 2));
  console.log(`Report saved: ${fileURLToPath(path)}`);
}
