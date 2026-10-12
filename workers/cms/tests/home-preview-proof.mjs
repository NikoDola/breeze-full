// Focused homepage acceptance test; no performance benchmark or provider changes.
// Refresh .local/cms-home-oidc.env using Vercel env pull (development), then run
// node workers/cms/tests/home-preview-proof.mjs --preflight | --publish | --restore | --verify
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { spawn } from "node:child_process";
import { bundle } from "./helpers.mjs";

const local = new URL("../../../.local/", import.meta.url);
const config = parseEnv(await readFile(new URL("cms-preview.env", local), "utf8"));
const identity = parseEnv(await readFile(new URL("cms-home-oidc.env", local), "utf8"));
const origin = "https://breeze-full-git-cms-testing-nikodolas-projects.vercel.app";
const worker = "https://breeze-test-api.nikodola.workers.dev";
assert.equal(config.CMS_TEST_ORIGIN, origin); assert.equal(config.CMS_WORKER_URL, worker);
for (const key of ["CMS_TEST_USERNAME", "CMS_TEST_PASSWORD"]) assert.ok(config[key]);
assert.ok(identity.VERCEL_OIDC_TOKEN?.length > 32);
const oidc = { "x-vercel-trusted-oidc-idp-token": identity.VERCEL_OIDC_TOKEN };
const auth = { ...oidc, authorization: `Basic ${Buffer.from(`${config.CMS_TEST_USERNAME}:${config.CMS_TEST_PASSWORD}`).toString("base64")}`,
  origin, "x-cms-request": "editor", "content-type": "application/json" };
const moduleText = await bundle(new URL("../../../cms/shared/home-seed.ts", import.meta.url));
const { homeSeed } = await import(`data:text/javascript;base64,${Buffer.from(moduleText).toString("base64")}`);
const report = { at: new Date().toISOString(), origin, checks: [] };
const check = text => { report.checks.push(text); console.log(`PASS: ${text}`); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function request(path, headers, body) {
  assert.ok(path.startsWith("/") && !path.startsWith("//"));
  // Use the previously verified curl transport. Secrets go through stdin only.
  const options = ["silent", "show-error", "compressed", "max-time = 55", `url = ${JSON.stringify(origin + path)}`];
  for (const [key, value] of Object.entries(headers)) options.push(`header = ${JSON.stringify(`${key}: ${value}`)}`);
  if (body) options.push('request = "POST"', `data = ${JSON.stringify(JSON.stringify(body))}`);
  const marker = "\n__HOME_RESULT__";
  options.push(`write-out = ${JSON.stringify(marker + "%{http_code}|%header{x-vercel-cache}|%header{x-vercel-mitigated}|%{time_total}")}`);
  const child = spawn(process.platform === "win32" ? "curl.exe" : "curl", ["--config", "-"], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
  let output = ""; child.stdout.on("data", value => { output += value; }); child.stderr.on("data", () => {});
  const done = new Promise((resolve, reject) => { child.on("error", reject); child.on("close", resolve); });
  child.stdin.end(options.join("\n") + "\n"); assert.equal(await done, 0, "HTTP transfer failed; refresh status before retrying");
  const split = output.lastIndexOf(marker); assert.ok(split >= 0);
  const [status, cache, mitigation, seconds] = output.slice(split + marker.length).trim().split("|");
  assert.equal(Number(status), 200, `${path}: HTTP ${status}${mitigation ? ` (${mitigation})` : ""}`);
  return { body: output.slice(0, split), cache, ms: Number(seconds) * 1000 };
}
const editor = async (body, pageId = "home") => JSON.parse((await request(`/api/cms/editor?pageId=${pageId}`, auth, body ? { ...body, pageId } : undefined)).body);
const page = () => request("/", oidc);
async function verifyPageAndEditor(revisionId) {
  // A just-invalidated Vercel edge may report STALE while regeneration finishes.
  // Wait outside the timing sample and confirm a warmed HIT, without publishing again.
  let cached;
  report.cacheHeaders = [];
  for (let attempt = 0; attempt < 4; attempt++) {
    cached = await page(); report.cacheHeaders.push(cached.cache);
    assert.ok(cached.body.includes(`data-cms-revision="${revisionId}"`));
    if (cached.cache === "HIT") break;
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  report.cachedResponse = { cache: cached.cache, ms: cached.ms };
  assert.equal(cached.cache, "HIT");
  const admin = await request("/admin-test", auth); assert.ok(admin.body.includes("Homepage"));
  assert.ok((await request("/admin-test/preview", auth)).body.includes("heating-cooling"));
  check("Cached homepage HIT and protected editor/frame accessible");
}
let baseline, probe;
async function restore() {
  const current = await editor();
  if (!same(current.draft?.document, baseline) && !same(current.draft?.document, probe)) throw new Error("Homepage was edited independently; refusing to overwrite it.");
  let state = current;
  if (!same(state.draft.document, baseline)) state = await editor({ action: "draft", expectedVersion: state.draft.version, document: baseline });
  if (!same(state.publication?.document, baseline)) state = await editor({ action: "publish", expectedVersion: state.draft.version });
  else if (!state.delivery?.confirmed_at) state = await editor({ action: "retry" });
  assert.ok(state.delivery?.confirmed_at, state.delivery?.last_error ?? "Delivery pending");
  assert.deepEqual(state.publication.document, baseline);
  const html = await page(); assert.ok(html.body.includes(`data-cms-revision="${state.publication.revisionId}"`));
  report.finalRevision = { id: state.publication.revisionId, version: state.publication.version };
  return state;
}
try {
  const preflight = await editor({ action: "preflight" });
  assert.equal(preflight.identity, "preview-oidc"); assert.equal(preflight.region, "iad1");
  assert.equal(preflight.branch, "cms-testing"); assert.ok(preflight.pages.includes("home"));
  report.preflight = preflight; check("Homepage scope, Preview OIDC, HMAC, Worker credential and iad1 verified");
  if (process.argv.includes("--preflight")) {
    assert.equal(preflight.writesEnabled, false); check("Test writes remain disabled during security preflight");
  } else if (process.argv.includes("--verify")) {
    const state = await editor();
    assert.deepEqual(state.draft.document, homeSeed); assert.deepEqual(state.publication.document, homeSeed);
    assert.ok(state.delivery?.confirmed_at);
    report.finalRevision = { id: state.publication.revisionId, version: state.publication.version };
    await verifyPageAndEditor(state.publication.revisionId);
  } else if (process.argv.includes("--restore")) {
    ({ baseline, probe } = JSON.parse(await readFile(new URL("cms-home-restore.json", local), "utf8")));
    await restore(); check("Original homepage draft and publication restored safely");
  } else {
    assert.ok(process.argv.includes("--publish"), "Choose --preflight, --publish, --restore or --verify");
    assert.equal(preflight.writesEnabled, true);
    const proofBefore = await editor(undefined, "cms-proof");
    report.proofRevision = proofBefore.publication.revisionId;
    let state = await editor();
    if (state.draft) assert.deepEqual(state.draft.document, homeSeed, "Existing homepage edits must be preserved");
    if (!state.draft) state = await editor({ action: "import" });
    assert.deepEqual(state.draft.document, homeSeed);
    baseline = structuredClone(state.draft.document); probe = structuredClone(baseline);
    probe.slots.contact.content.intro += ` CMS verification ${crypto.randomUUID()}.`;
    await writeFile(new URL("cms-home-restore.json", local), JSON.stringify({ baseline, probe }, null, 2));
    const before = await page();
    const buildId = before.body.match(/"buildId":"([^"]+)"/)?.[1];
    state = await editor({ action: "draft", expectedVersion: state.draft.version, document: probe });
    assert.ok(!(await page()).body.includes("CMS verification")); check("Homepage draft saved in test D1 and absent from public HTML");
    const start = performance.now();
    state = await editor({ action: "publish", expectedVersion: state.draft.version });
    assert.ok(state.delivery?.confirmed_at, state.delivery?.last_error ?? "Delivery pending");
    const published = await page();
    assert.ok(published.body.includes(probe.slots.contact.content.intro));
    assert.ok(published.body.includes(`data-cms-revision="${state.publication.revisionId}"`));
    report.publishToVisibleMs = performance.now() - start;
    const revision = state.publication.revisionId;
    assert.equal((await editor({ action: "retry" })).publication.revisionId, revision);
    check("Edited homepage confirmed in public HTML; retry retains the same revision");
    await restore(); check("Original approved homepage content restored and confirmed");
    await verifyPageAndEditor(report.finalRevision.id);
    if (buildId) assert.ok((await page()).body.includes(`"buildId":"${buildId}"`));
    assert.deepEqual((await editor(undefined, "cms-proof")).publication, proofBefore.publication);
    check("Legacy proof publication unchanged");
  }
  report.status = "passed";
} catch (error) {
  report.status = "failed"; report.error = error.message; console.error(error.message); process.exitCode = 1;
  if (baseline && probe) console.error("If needed, run --restore to restore original content without overwriting independent edits.");
} finally {
  const mode = process.argv.includes("--preflight") ? "preflight" : process.argv.includes("--restore") ? "restore" : process.argv.includes("--verify") ? "verification" : "workflow";
  await writeFile(new URL(`cms-home-preview-${mode}.json`, local), JSON.stringify(report, null, 2));
  console.log(`Report: .local/cms-home-preview-${mode}.json`);
}
