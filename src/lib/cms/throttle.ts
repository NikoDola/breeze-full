import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { cmsScope } from "./scope";
import { workerOrigin } from "./worker";

export function throttleKey(headers: Pick<Headers, "get">): string | null {
  const scope = cmsScope(), secret = process.env.CMS_WRITE_TOKEN;
  if (!scope || !secret) return null;
  // Trust only Vercel's overwritten header. Local requests all use one loopback bucket;
  // client-supplied forwarding headers can never create fresh local buckets.
  const source = scope.kind === "local" ? "loopback" : headers.get("x-vercel-forwarded-for");
  if (!source || (scope.kind !== "local" && !isIP(source))) return null;
  const canonical = isIP(source) === 6 ? new URL(`http://[${source}]/`).hostname : source;
  return createHmac("sha256", secret).update(`cms-auth-v1:${scope.origin}:${canonical}`).digest("hex");
}

export async function throttleEditor(request: Request): Promise<Response | null> {
  try {
    const key = throttleKey(request.headers);
    if (!key) throw new Error("Trusted source unavailable.");
    const response = await fetch(`${workerOrigin()}/api/admin/auth/throttle`, {
      method: "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(1500),
      headers: { Authorization: `Bearer ${process.env.CMS_WRITE_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    if (response.status === 429) return limited();
    if (!response.ok) throw new Error("Rate limit service unavailable.");
    const result = await response.json();
    if (typeof result.success !== "boolean" || result.degraded) throw new Error("Rate limit binding unavailable.");
    return result.success ? null : limited();
  } catch {
    // A limiter outage must not lock out the client. Authentication and CSRF still run.
    // No credential, IP, content, or request header is logged.
    console.warn(JSON.stringify({ event: "cms.auth.throttle-degraded" }));
    return null;
  }
}

function limited() {
  return Response.json({ error: "Too many admin requests. Wait 60 seconds, then try again." }, {
    status: 429, headers: { "Retry-After": "60", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}
