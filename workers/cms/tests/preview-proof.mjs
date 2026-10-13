// Explicitly opt in to mutations of the isolated proof page. Never targets production.
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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
const resume = process.argv.includes("--resume-measurements");
const transport = process.argv.includes("--transport=curl") ? "curl" : "fetch";
const cachedSamples = Number(process.argv.find(arg => arg.startsWith("--cached-samples="))?.split("=")[1] ?? 50);
const requestGapMs = Number(process.argv.find(arg => arg.startsWith("--request-gap-ms="))?.split("=")[1] ?? 1500);
assert.ok(Number.isInteger(cachedSamples) && cachedSamples >= 10 && cachedSamples <= 100);
assert.ok(Number.isInteger(requestGapMs) && requestGapMs >= 500 && requestGapMs <= 10000);
const report = resume
  ? JSON.parse(await readFile(new URL("../../../.local/cms-preview-results.json", import.meta.url), "utf8"))
  : { recordedAt: new Date().toISOString(), origin, worker, checks: [], samples: {}, metrics: {}, counts: {} };
if (resume) {
  assert.ok(process.argv.includes("--allow-test-writes"));
  assert.equal(report.origin, origin); assert.equal(report.worker, worker);
  assert.equal(report.measurementSettings?.transport ?? "fetch", transport, "Do not combine HTTP transports in one benchmark");
  assert.equal(report.samples.worker?.length, 30); assert.equal(report.samples.uncachedNext?.length, 30);
  assert.ok(report.uncachedHeaders.every(value => value === "REVALIDATED" || value === "MISS"));
  report.interruptedAttempts ??= [];
  report.interruptedAttempts.push({ error: report.error, cachedSamples: report.samples.cachedNext, cachedHeaders: report.cachedHeaders });
  report.resumedAt = new Date().toISOString(); delete report.error; delete report.networkErrorCode;
}
report.measurementSettings = { cachedSamples, requestGapMs, transport, connections: transport === "curl" ? "fresh HTTPS connection per sample" : "Node fetch connection pool" };
report.checkpointResponses ??= [];
const check = name => { report.checks.push(name); console.log(`PASS: ${name}`); };
async function request(url, init = {}) {
  if (transport === "curl") return curlRequest(url, init);
  const start = performance.now();
  const response = await fetch(url, { ...init, redirect: "manual", signal: AbortSignal.timeout(65000) });
  const body = await response.text();
  if (response.status === 403) {
    let diagnostic = body.slice(0, 1200);
    for (const name of ["CMS_TEST_PASSWORD", "CMS_WRITE_TOKEN", "CMS_REVALIDATE_SECRET", "VERCEL_OIDC_TOKEN"]) diagnostic = diagnostic.replaceAll(process.env[name], "[redacted]");
    report.lastForbidden = { path: new URL(url).pathname, at: new Date().toISOString(), diagnostic,
      mitigation: response.headers.get("x-vercel-mitigated"), error: response.headers.get("x-vercel-error") };
  }
  const mitigation = response.headers.get("x-vercel-mitigated");
  if (mitigation === "challenge") report.checkpointResponses.push({ path: new URL(url).pathname, at: new Date().toISOString() });
  return { status: response.status, body, ms: performance.now() - start, mitigation, cache: response.headers.get("x-vercel-cache"),
    nextCache: response.headers.get("x-nextjs-cache"), edge: response.headers.get("x-vercel-id")?.split("::")[0] };
}
async function curlRequest(url, init) {
  // Standard curl transport for machines where Node's TLS client is challenged
  // by Vercel. Credentials go through stdin, never command-line arguments.
  const marker = "\n__CMS_HTTP__";
  const options = ["silent", "show-error", "compressed", "max-time = 65", `url = ${JSON.stringify(url)}`,
    `request = ${JSON.stringify(init.method ?? "GET")}`];
  for (const [key, value] of Object.entries(init.headers ?? {})) options.push(`header = ${JSON.stringify(`${key}: ${value}`)}`);
  if (init.body) options.push(`data = ${JSON.stringify(init.body)}`);
  options.push(`write-out = ${JSON.stringify(marker + "%{http_code}|%{time_total}|%header{x-vercel-cache}|%header{x-nextjs-cache}|%header{x-vercel-id}|%header{x-vercel-mitigated}")}`);
  const child = spawn(process.platform === "win32" ? "curl.exe" : "curl", ["--config", "-"], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
  let output = ""; child.stdout.on("data", chunk => { output += chunk; }); child.stderr.on("data", () => {});
  const done = new Promise((resolve, reject) => { child.on("error", reject); child.on("close", resolve); });
  child.stdin.end(options.join("\n") + "\n");
  assert.equal(await done, 0, "curl transfer failed");
  const split = output.lastIndexOf(marker); assert.ok(split >= 0, "curl response metadata missing");
  const [status, seconds, cache, nextCache, edge, mitigation] = output.slice(split + marker.length).trim().split("|");
  if (Number(status) === 403) report.lastForbidden = { path: new URL(url).pathname, at: new Date().toISOString(), mitigation };
  if (mitigation === "challenge") report.checkpointResponses.push({ path: new URL(url).pathname, at: new Date().toISOString() });
  return { status: Number(status), body: output.slice(0, split), ms: Number(seconds) * 1000, mitigation,
    cache: cache || null, nextCache: nextCache || null, edge: edge?.split("::")[0] };
}
async function editor(body) {
  const pageId = body?.pageId ?? "cms-proof";
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await request(`${origin}/api/cms/editor?pageId=${pageId}`, { headers: auth, method: body ? "POST" : "GET", body: body ? JSON.stringify({ ...body, pageId }) : undefined });
    // A confirmed Vercel checkpoint stops the request before the application.
    // Record it; only this known pre-application response can be retried here.
    if (response.status !== 403 || response.mitigation !== "challenge" || attempt === 2) break;
    await sleep(5000);
  }
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
async function page(publication, uncached = false, allowCheckpoint = false) {
  const response = await request(`${origin}/cms-proof`, { headers: { ...oidc, ...(uncached ? { Pragma: "no-cache" } : {}) } });
  if (allowCheckpoint && response.status === 403 && response.mitigation === "challenge") return response;
  assert.equal(response.status, 200, `Public Preview returned ${response.status} (cache: ${response.cache})`);
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
  await barrier(); const start = events.length, startedAt = new Date().toISOString();
  await action(); await barrier();
  const measured = events.slice(start);
  report.counts[name] = { startedAt, finishedAt: new Date().toISOString(), workerRequests: measured.filter(e => !e.path.startsWith("/__cms_probe/")).length,
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
  if (!resume) {
  assert.equal((await request(`${origin}/api/cms/editor`, { headers: oidc })).status, 401);
  assert.equal((await request(`${origin}/api/cms/editor`, { headers: { ...auth, origin: "https://evil.example" }, method: "POST", body: '{"action":"publish"}' })).status, 403);
  assert.equal((await request(`${origin}/api/cms/revalidate`, { headers: oidc, method: "POST", body: "{}" })).status, 401);
  assert.equal((await invalidate({ revisionId: randomUUID(), version: 1 }, "/")).status, 400);
  assert.equal((await request(`${worker}/api/admin/publish`, { method: "POST", headers: { "content-type": "application/json" }, body: '{"expectedVersion":1}' })).status, preflight.writesEnabled ? 401 : 404);
  check("Unauthenticated writes, CSRF and out-of-scope cache invalidation rejected");
  }
  if (!process.argv.includes("--allow-test-writes")) {
    assert.equal(preflight.writesEnabled, false, "Expected preflight before writes are enabled");
    report.status = "preflight-passed";
  } else {
    assert.equal(preflight.writesEnabled, true);
    // No client sampling filter. The provider may still drop live events; check
    // calibration and report incomplete telemetry without discarding timings.
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
    if (!resume) {
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
    report.tailCalibrated = report.counts.directWorker.d1PublicReads === 30;
    check(`30 direct Worker requests completed; ${report.counts.directWorker.d1PublicReads} live D1 events observed`);
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
    assert.ok(report.counts.uncachedNext.d1PublicReads > 0, "Invalidated pages must refill content from D1");
    check(`30 regenerated pages measured; ${report.counts.uncachedNext.d1PublicReads} D1 read events observed`);
    }
    await page(state.publication);
    report.samples.cachedNext = []; report.cachedHeaders = []; report.cachedStatuses = [];
    await counted("cachedNext", async () => {
      for (let i = 0; i < cachedSamples; i++) {
        const sample = await page(state.publication, false, true); report.cachedStatuses.push(sample.status);
        if (sample.status === 200) { report.samples.cachedNext.push(sample.ms); report.cachedHeaders.push(sample.cache); }
        await sleep(requestGapMs); // Outside timing; this is not a burst load test.
      }
    });
    assert.ok(report.samples.cachedNext.length >= 10, "Too few successful responses to characterize cached delivery");
    assert.ok(report.cachedHeaders.every(value => value === "HIT"));
    assert.equal(report.counts.cachedNext.publicApiRequests, 0); assert.equal(report.counts.cachedNext.d1PublicReads, 0);
    check(`${report.samples.cachedNext.length}/${cachedSamples} cached Preview requests succeeded as HITs; zero Worker/D1 content reads observed`);
    report.samples.publishToVisible = [];
    for (let i = 0; i < 10; i++) {
      await sleep(requestGapMs);
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
    report.status = report.checkpointResponses.length ? "workflow-passed-with-checkpoint-warnings" : "passed";
    if (report.checkpointResponses.length) process.exitCode = 2;
    console.log(JSON.stringify({ metrics: report.metrics, counts: report.counts }, null, 2));
  }
} catch (error) {
  report.status = "failed"; report.error = error instanceof Error ? error.message : "Test failed";
  report.networkErrorCode = error?.cause?.code ?? null;
  console.error(report.error, report.networkErrorCode ?? ""); process.exitCode = 1;
} finally {
  for (const [name, samples] of Object.entries(report.samples)) if (samples.length) report.metrics[name] = summarize(samples);
  if (tail) tail.kill();
  await mkdir(new URL("../../../.local/", import.meta.url), { recursive: true });
  const path = new URL(`../../../.local/cms-preview-${process.argv.includes("--allow-test-writes") ? "results" : "preflight"}.json`, import.meta.url);
  await writeFile(path, JSON.stringify(report, null, 2));
  console.log(`Report saved: ${fileURLToPath(path)}`);
}
