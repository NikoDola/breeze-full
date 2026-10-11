import "server-only";
import { getVercelOidcToken } from "@vercel/oidc";
import { PAGE_ID, PUBLIC_PATH, readBody, type DeliveryClaim, type PublishEvent } from "../../../cms/shared/contract";
import { sign } from "../../../cms/shared/signature";
import { testOrigin } from "./access";
import { workerAdmin } from "./worker";

async function previewHeaders(): Promise<Record<string, string>> {
  if (!testOrigin()) throw new Error("Preview scope is disabled.");
  if (!process.env.VERCEL) return {}; // testOrigin permits only loopback locally.
  const token = await getVercelOidcToken();
  // Vercel verifies the signature on the receiving request. These extra checks
  // reject accidental use of a development/production or different-project token.
  const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  if (claims.environment !== "preview" || claims.project_id !== "prj_w0vgYQ8eOEMOt6ftAqPcaPRu8rTV") {
    throw new Error("Unexpected Preview identity.");
  }
  return { "x-vercel-trusted-oidc-idp-token": token };
}
async function invalidate(event: PublishEvent, headers: Record<string, string>, dryRun = false) {
  const secret = process.env.CMS_REVALIDATE_SECRET;
  if (!secret || secret.length < 32) throw new Error("Next cache credential is missing.");
  const body = JSON.stringify({ ...event, dryRun }), timestamp = String(Date.now());
  // A separate Next request completes invalidation before we request fresh HTML.
  // The HMAC secret stays in Next; OIDC is sent only to the pinned Preview origin.
  const response = await fetch(`${testOrigin()}/api/cms/revalidate`, {
    method: "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000), body,
    headers: { ...headers, "Content-Type": "application/json", "x-cms-timestamp": timestamp,
      "x-cms-signature": await sign(secret, timestamp, body) },
  });
  if (!response.ok || (await response.json()).eventId !== event.eventId) throw new Error("Cache invalidation failed.");
}
async function workerJson(path: string, body?: unknown) {
  const response = await workerAdmin(path, body);
  if (!response.ok) throw new Error("Delivery state could not be updated.");
  return response.json();
}
export async function preflight() {
  const health = await workerJson("health");
  if (health.environment !== "test" || !health.schemaReady || health.deliveryOwner !== "nextjs") {
    throw new Error("Test Worker or migration is not ready.");
  }
  const headers = await previewHeaders();
  await invalidate({ eventId: crypto.randomUUID(), revisionId: crypto.randomUUID(), pageId: PAGE_ID,
    path: PUBLIC_PATH, version: 1 }, headers, true);
  return { ok: true, ...health, identity: process.env.VERCEL ? "preview-oidc" : "local-loopback",
    origin: testOrigin(), region: process.env.VERCEL_REGION ?? "local", branch: process.env.VERCEL_GIT_COMMIT_REF ?? "local" };
}
export async function deliverPublication() {
  const { claim } = await workerJson("delivery/claim", { force: true }) as { claim: DeliveryClaim | null };
  if (!claim) return workerJson("proof");
  const started = performance.now();
  let reason = "identity";
  try {
    const headers = await previewHeaders();
    reason = "invalidation";
    await invalidate(claim.event, headers);
    const invalidatedMs = performance.now() - started;
    await workerJson("delivery/ack", { eventId: claim.event.eventId, leaseToken: claim.leaseToken, stage: "invalidated" });
    reason = "verification";
    let confirmed = false;
    const verificationStart = performance.now();
    for (let attempt = 0; attempt < 3 && !confirmed; attempt++) {
      const page = await fetch(`${testOrigin()}${PUBLIC_PATH}`, { cache: "no-store", redirect: "error",
        signal: AbortSignal.timeout(10000), headers: { ...headers, Pragma: "no-cache" } });
      if (!page.ok) throw new Error("Public page is unavailable.");
      const html = await readBody(page, 1024 * 1024);
      const version = Number(html.match(/data-cms-version="(\d+)"/)?.[1]);
      const id = html.match(/data-cms-revision="([a-f0-9-]+)"/)?.[1];
      confirmed = version > claim.event.version || (version === claim.event.version && id === claim.event.revisionId);
      if (!confirmed && attempt < 2) await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (!confirmed) throw new Error("Published snapshot is not visible yet.");
    const state = await workerJson("delivery/ack", { eventId: claim.event.eventId, leaseToken: claim.leaseToken, stage: "confirmed" });
    return { ...state, deliveryTiming: { invalidatedMs, verificationMs: performance.now() - verificationStart,
      totalMs: performance.now() - started } };
  } catch {
    // Publication is already committed. Never publish another revision as a retry.
    // If recording this failure also fails, the durable lease expires after 90s.
    try { await workerJson("delivery/ack", { eventId: claim.event.eventId, leaseToken: claim.leaseToken, stage: "failed", reason }); } catch { /* recover from D1 on next request */ }
    return workerJson("proof");
  }
}
