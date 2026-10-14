import type { Env } from "./index";

export async function consumeRate(binding: RateLimit | undefined, key: string) {
  try {
    if (!binding) throw new Error("Rate limit binding missing.");
    const { success } = await binding.limit({ key });
    if (!success) console.info(JSON.stringify({ event: "cms.auth.rate-limited" }));
    return { success, degraded: false };
  } catch {
    console.warn(JSON.stringify({ event: "cms.auth.throttle-degraded" }));
    return { success: true, degraded: true };
  }
}

export async function limitWorkerSource(request: Request, env: Env): Promise<boolean> {
  // Cloudflare supplies this header at the edge. Never trust X-Forwarded-For here.
  const source = request.headers.get("cf-connecting-ip");
  if (!source) return true; // The local simulator may have no edge metadata.
  const secret = env.CMS_WRITE_TOKEN!;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(source));
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  return (await consumeRate(env.SERVICE_RATE_LIMITER, `${env.CMS_ENVIRONMENT}:worker:${hash}`)).success;
}
