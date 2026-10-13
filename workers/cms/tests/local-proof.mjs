// Real Next production server + workerd/D1 emulator; never deploys or writes to remote D1.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes, createHmac } from "node:crypto";
import { admin, createWorker, migrate, root, token, revalidationSecret } from "./helpers.mjs";
import { runMediaWorkflow } from "./media-http-proof.mjs";

const reportDir = join(root, ".local");
await mkdir(reportDir, { recursive: true });
const logPath = join(reportDir, "cms-proof-build.log");
await writeFile(logPath, "");
const results = { recordedAt: new Date().toISOString(), environment: "local Next production build + local D1", checks: [], timingsMs: {} };
const check = name => { results.checks.push(name); console.log(`PASS: ${name}`); };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const nextBin = join(root, "node_modules/next/dist/bin/next");
let app, mf, gateway;
async function capture(command, args, env) {
  const child = spawn(command, args, { cwd: root, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", data => { void appendFile(logPath, data); });
  child.stderr.on("data", data => { void appendFile(logPath, data); });
  return child;
}
try {
  console.log("Reading the existing public D1 endpoint (GET only)…");
  const directStart = performance.now();
  const legacyResponse = await fetch("https://breeze-api.nikodola.workers.dev/api/sections/home-hero", { redirect: "error", signal: AbortSignal.timeout(20000) });
  assert.equal(legacyResponse.status, 200);
  const source = await legacyResponse.json();
  results.timingsMs.existingWorkerAndD1 = performance.now() - directStart;
  await writeFile(join(reportDir, "cms-legacy-source.json"), JSON.stringify(source, null, 2));
  check("Existing D1 content read through its public API; original content untouched");

  const portReservation = createServer();
  portReservation.listen(0, "127.0.0.1"); await once(portReservation, "listening");
  const appPort = portReservation.address().port;
  await new Promise(resolve => portReservation.close(resolve));
  const origin = `http://127.0.0.1:${appPort}`;
  mf = await createWorker({ bindings: { CMS_SITE_ORIGIN: origin, CMS_UPLOAD_ORIGIN: origin } });
  const db = await mf.getD1Database("DB");
  await migrate(db);
  assert.equal((await admin(mf, "import", { source })).status, 200);
  check("Existing content copied into an isolated local D1 draft");

  let publicApiReads = 0, homeApiReads = 0;
  gateway = createServer(async (req, res) => {
    try {
      if (req.url === "/api/public/pages/cms-proof") publicApiReads++;
      if (req.url === "/api/public/pages/home") homeApiReads++;
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks);
      const response = await mf.dispatchFetch(`http://worker.local${req.url}`, {
        method: req.method, headers: req.headers, body: body.length ? body : undefined,
      });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch { res.writeHead(502); res.end("Local Worker gateway failed"); }
  });
  gateway.listen(0, "127.0.0.1"); await once(gateway, "listening");
  const workerOrigin = `http://127.0.0.1:${gateway.address().port}`;
  const password = randomBytes(32).toString("hex");
  const env = { ...process.env, CMS_LOCAL_PROOF_BUILD: "true", CMS_TEST_ENABLED: "true", CMS_TEST_ORIGIN: origin,
    CMS_WORKER_URL: workerOrigin, CMS_TEST_USERNAME: "local-proof", CMS_TEST_PASSWORD: password,
    CMS_WRITE_TOKEN: token, CMS_REVALIDATE_SECRET: revalidationSecret, VERCEL: "", VERCEL_ENV: "development" };
  console.log("Building Next.js in .next-cms-proof (build log: .local/cms-proof-build.log)…");
  const build = await capture(process.execPath, [nextBin, "build"], env);
  const [buildCode] = await once(build, "exit");
  assert.equal(buildCode, 0, "Next build failed; see .local/cms-proof-build.log");
  const buildId = await readFile(join(root, ".next-cms-proof/BUILD_ID"), "utf8");
  app = await capture(process.execPath, [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(appPort)], env);
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { await fetch(`${origin}/api/admin`); ready = true; break; } catch { await sleep(200); }
  }
  assert.ok(ready, "Next server did not start.");
  const authorization = `Basic ${Buffer.from(`local-proof:${password}`).toString("base64")}`;
  const headers = { authorization, origin, "Content-Type": "application/json", "x-cms-request": "editor" };
  const editor = async body => {
    const pageId = body?.pageId ?? "cms-proof";
    const response = await fetch(`${origin}/api/cms/editor?pageId=${pageId}`, { headers, method: body ? "POST" : "GET", body: body ? JSON.stringify({ ...body, pageId }) : undefined });
    const value = await response.json();
    assert.equal(response.status, 200, JSON.stringify(value)); return value;
  };
  const publicPage = async () => {
    const start = performance.now(); const response = await fetch(`${origin}/cms-proof`);
    return { status: response.status, html: await response.text(), cache: response.headers.get("x-nextjs-cache"), ms: performance.now() - start };
  };
  assert.equal((await fetch(`${origin}/admin-test`)).status, 401);
  assert.equal((await fetch(`${origin}/api/cms/editor`)).status, 401);
  assert.equal((await fetch(`${origin}/api/cms/editor`, { method: "POST", headers: { ...headers, origin: "https://evil.example" }, body: "{}" })).status, 403);
  assert.equal((await fetch(`${origin}/api/admin`, { method: "POST", headers: { "x-admin-password": "breeze-admin" }, body: "{}" })).status, 410);
  assert.equal((await fetch(`${origin}/api/admin/upload`, { method: "POST" })).status, 410);
  const adminPage = await fetch(`${origin}/admin-test`, { headers: { authorization } });
  assert.equal(adminPage.status, 200);
  const adminHtml = await adminPage.text();
  assert.ok(adminHtml.includes("Leave admin") && adminHtml.includes("Administration"));
  assert.ok(!adminHtml.includes('class="site-header') && !adminHtml.includes('class="site-footer'));
  assert.ok(!adminHtml.includes("Make it feel like Breeze") && !adminHtml.includes("Content studio"));
  assert.equal((await fetch(`${origin}/admin-test/preview`)).status, 401);
  const frame = await fetch(`${origin}/admin-test/preview`, { headers: { authorization } });
  assert.equal(frame.status, 200);
  assert.equal(frame.headers.get("content-security-policy"), "frame-ancestors 'self'");
  const frameHtml = await frame.text();
  assert.equal((frameHtml.match(/class="site-header/g) ?? []).length, 1);
  assert.equal((frameHtml.match(/class="site-footer/g) ?? []).length, 1);
  check("Admin has its own navigation without public branding; the protected preview retains the complete website shell");
  check("Editor authentication, origin checks and retired legacy endpoints enforced over HTTP");
  assert.equal((await publicPage()).status, 404);

  let state = await editor({ action: "import" });
  assert.equal(state.draft.document.section.headline, source.headline);
  check("Protected Next import action reads the legacy endpoint and preserves the existing test draft");
  const document = structuredClone(state.draft.document);
  document.section.headline = `Local proof ${Date.now()}`;
  document.section.button_route = "/contact-us";
  state = await editor({ action: "draft", expectedVersion: state.draft.version, document });
  assert.equal(state.draft.version, 2);
  assert.equal((await publicPage()).status, 404);
  check("Saved draft stays private, including a cached unpublished-page 404");

  const publishStart = performance.now();
  state = await editor({ action: "publish", expectedVersion: state.draft.version });
  for (let i = 0; !state.delivery?.confirmed_at && i < 3; i++) state = await editor({ action: "retry" });
  assert.ok(state.delivery?.confirmed_at, JSON.stringify(state.delivery));
  const initial = await publicPage();
  assert.equal(initial.status, 200); assert.ok(initial.html.includes(document.section.headline));
  assert.ok(initial.html.includes(`data-cms-revision="${state.publication.revisionId}"`));
  results.timingsMs.publishToConfirmedHtml = performance.now() - publishStart;
  check("Publication invalidates cached 404, warms HTML and confirms the immutable revision");

  await publicPage();
  const readsBefore = publicApiReads, cached = [];
  for (let i = 0; i < 5; i++) cached.push(await publicPage());
  assert.equal(publicApiReads, readsBefore);
  assert.ok(cached.every(page => page.cache === "HIT"));
  results.timingsMs.cachedHtmlSamples = cached.map(page => page.ms);
  results.workerReadsDuringFiveCachedRequests = publicApiReads - readsBefore;
  check("Five cached public HTML requests make zero Worker content requests");

  const revisionBefore = state.publication.revisionId;
  const unpublished = structuredClone(state.draft.document);
  unpublished.section.headline = `Private draft ${Date.now()}`;
  state = await editor({ action: "draft", expectedVersion: state.draft.version, document: unpublished });
  assert.ok(!(await publicPage()).html.includes(unpublished.section.headline));
  state = await editor({ action: "publish", expectedVersion: state.draft.version });
  for (let i = 0; !state.delivery?.confirmed_at && i < 3; i++) state = await editor({ action: "retry" });
  assert.ok(state.delivery?.confirmed_at);
  const changed = await publicPage();
  assert.ok(changed.html.includes(unpublished.section.headline));
  assert.notEqual(state.publication.revisionId, revisionBefore);
  assert.equal(await readFile(join(root, ".next-cms-proof/BUILD_ID"), "utf8"), buildId);
  check("A later draft remains hidden until publication, then updates HTML without rebuilding or restarting");

  const webhook = `${origin}/api/cms/revalidate`;
  assert.equal((await fetch(webhook, { method: "POST", body: "{}" })).status, 401);
  const event = { eventId: crypto.randomUUID(), revisionId: state.publication.revisionId, pageId: "cms-proof", path: "/", version: 3 };
  const body = JSON.stringify(event), timestamp = String(Date.now());
  const signature = createHmac("sha256", revalidationSecret).update(`${timestamp}.${body}`).digest("hex");
  assert.equal((await fetch(webhook, { method: "POST", headers: { "x-cms-timestamp": timestamp, "x-cms-signature": signature }, body })).status, 400);
  assert.equal((await fetch(webhook, { method: "POST", headers: { "x-cms-timestamp": timestamp, "x-cms-signature": signature }, body: body + " " })).status, 401);
  check("Unsigned, tampered and out-of-scope invalidation requests are rejected");

  const homePage = async () => {
    const response = await fetch(`${origin}/`);
    assert.equal(response.status, 200);
    return { html: await response.text(), cache: response.headers.get("x-nextjs-cache") };
  };
  const originalHome = await homePage();
  assert.ok(!originalHome.html.includes('data-cms-page="home"'));
  let home = await editor({ action: "import", pageId: "home" });
  const seed = structuredClone(home.draft.document);
  const edited = structuredClone(seed); edited.slots.contact.content.intro = `Private home copy ${Date.now()}`;
  home = await editor({ action: "draft", pageId: "home", expectedVersion: home.draft.version, document: edited });
  assert.ok(!(await homePage()).html.includes(edited.slots.contact.content.intro));
  home = await editor({ action: "publish", pageId: "home", expectedVersion: home.draft.version });
  assert.ok(home.delivery?.confirmed_at, JSON.stringify(home.delivery));
  assert.ok((await homePage()).html.includes(edited.slots.contact.content.intro));
  const homeReadsBefore = homeApiReads;
  for (let i = 0; i < 3; i++) assert.equal((await homePage()).cache, "HIT");
  assert.equal(homeApiReads, homeReadsBefore);
  results.homeWorkerReadsDuringThreeCachedRequests = homeApiReads - homeReadsBefore;
  check("Homepage draft stays private; publication replaces cached fallback and three cache hits make zero Worker reads");
  home = await editor({ action: "draft", pageId: "home", expectedVersion: home.draft.version, document: seed });
  home = await editor({ action: "publish", pageId: "home", expectedVersion: home.draft.version });
  assert.ok(home.delivery?.confirmed_at, JSON.stringify(home.delivery));
  assert.ok(!(await homePage()).html.includes(edited.slots.contact.content.intro));
  assert.equal((await editor()).publication.revisionId, state.publication.revisionId);
  assert.equal(await readFile(join(root, ".next-cms-proof/BUILD_ID"), "utf8"), buildId);
  check("Homepage original content restored by another publication without rebuild; proof revision unchanged");
  results.media = await runMediaWorkflow({ origin, worker: workerOrigin, nextFetch: (path,options) => fetch(origin+path,options), editorHeaders: headers, check });
  assert.equal(await readFile(join(root, ".next-cms-proof/BUILD_ID"), "utf8"), buildId);
  results.buildIdUnchanged = true;
  results.publishedRevision = state.publication.revisionId;
  results.status = "passed";
} catch (error) {
  results.status = "failed";
  results.error = error instanceof Error ? error.message : String(error);
  console.error(results.error);
  process.exitCode = 1;
} finally {
  if (app) { app.kill(); await Promise.race([once(app, "exit"), sleep(5000)]); }
  if (gateway) { gateway.closeAllConnections(); await new Promise(resolve => gateway.close(resolve)); }
  if (mf) await mf.dispose();
  await writeFile(join(reportDir, "cms-proof-results.json"), JSON.stringify(results, null, 2));
  console.log("Results: .local/cms-proof-results.json");
}
