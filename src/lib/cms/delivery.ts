import "server-only";
import { getVercelOidcToken } from "@vercel/oidc";
import { PAGE_ID, pages, readBody, validateEvent, type DeliveryClaim, type PublishEvent, type PageId } from "../../../cms/shared/contract";
import { confirmsPublication } from "../../../cms/shared/publication-marker";
import { sign } from "../../../cms/shared/signature";
import { cmsOrigin, cmsScope } from "./scope";
import { workerAdmin } from "./worker";

async function deploymentHeaders(): Promise<Record<string, string>> {
  const scope = cmsScope();
  if (!scope) throw new Error("CMS deployment is disabled.");
  if (scope.kind === "local") return {};
  const token = await getVercelOidcToken();
  // Vercel verifies the signature on the receiving request. These extra checks
  // reject a token from another environment or project; no cross-environment trust.
  const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  if (claims.environment !== scope.oidcEnvironment || claims.project_id !== "prj_w0vgYQ8eOEMOt6ftAqPcaPRu8rTV") {
    throw new Error("Unexpected deployment identity.");
  }
  return { "x-vercel-trusted-oidc-idp-token": token };
}
async function invalidate(event: PublishEvent, headers: Record<string, string>, dryRun = false) {
  const secret = process.env.CMS_REVALIDATE_SECRET;
  if (!secret || secret.length < 32) throw new Error("Next cache credential is missing.");
  const body = JSON.stringify({ ...event, dryRun }), timestamp = String(Date.now());
  // A separate Next request completes invalidation before we request fresh HTML.
  // Independent HMAC secrets stay in Next; OIDC goes only to this deployment's pinned origin.
  const response = await fetch(`${cmsOrigin()}/api/cms/revalidate`, {
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
export async function preflight(pageId: PageId = PAGE_ID) {
  const health = await workerJson("health");
  if (health.environment !== cmsScope()?.workerEnvironment || !health.schemaReady || health.deliveryOwner !== "nextjs" || (pageId === "home" && !health.pages?.includes("home"))) {
    throw new Error("CMS Worker or migration is not ready.");
  }
  const headers = await deploymentHeaders();
  await invalidate({ eventId: crypto.randomUUID(), revisionId: crypto.randomUUID(), pageId,
    path: pages[pageId].path, version: 1 }, headers, true);
  return { ok: true, ...health, identity: process.env.VERCEL ? `${cmsScope()!.oidcEnvironment}-oidc` : "local-loopback",
    origin: cmsOrigin(), region: process.env.VERCEL_REGION ?? "local", branch: process.env.VERCEL_GIT_COMMIT_REF ?? "local" };
}
export async function deliverPublication(pageId: PageId = PAGE_ID) {
  const { claim } = await workerJson("delivery/claim", { pageId, force: true }) as { claim: DeliveryClaim | null };
  if (!claim) return workerJson(`proof?pageId=${pageId}`);
  const event = validateEvent(claim.event);
  if (event.pageId !== pageId) throw new Error("Delivery page does not match the requested page.");
  const started = performance.now();
  let reason = "identity";
  try {
    const headers = await deploymentHeaders();
    reason = "invalidation";
    await invalidate(event, headers);
    const invalidatedMs = performance.now() - started;
    await workerJson("delivery/ack", { pageId, eventId: event.eventId, leaseToken: claim.leaseToken, stage: "invalidated" });
    reason = "verification";
    let confirmed = false;
    const verificationStart = performance.now();
    for (let attempt = 0; attempt < 3 && !confirmed; attempt++) {
      const page = await fetch(`${cmsOrigin()}${event.path}`, { cache: "no-store", redirect: "error",
        signal: AbortSignal.timeout(10000), headers: { ...headers, Pragma: "no-cache" } });
      if (!page.ok) throw new Error("Public page is unavailable.");
      const html = await readBody(page, 1024 * 1024);
      confirmed = confirmsPublication(html, event);
      if (!confirmed && attempt < 2) await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (!confirmed) throw new Error("Published snapshot is not visible yet.");
    const state = await workerJson("delivery/ack", { pageId, eventId: event.eventId, leaseToken: claim.leaseToken, stage: "confirmed" });
    return { ...state, deliveryTiming: { invalidatedMs, verificationMs: performance.now() - verificationStart,
      totalMs: performance.now() - started } };
  } catch {
    // Publication is already committed. Never publish another revision as a retry.
    // If recording this failure also fails, the durable lease expires after 90s.
    try { await workerJson("delivery/ack", { pageId, eventId: event.eventId, leaseToken: claim.leaseToken, stage: "failed", reason }); } catch { /* recover from D1 on next request */ }
    return workerJson(`proof?pageId=${pageId}`);
  }
}
