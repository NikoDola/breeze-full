import "server-only";
import { LIVE_ORIGIN, LIVE_WORKER_ORIGIN, PREVIEW_ORIGIN, TEST_WORKER_ORIGIN, pages, type PageId } from "../../../cms/shared/contract";

// Explicit opt-in per deployment. Preview credentials and hosts never enable live access.
export function cmsScope() {
  if (process.env.CMS_LIVE_ENABLED === "true") {
    if (!process.env.VERCEL || process.env.VERCEL_ENV !== "production" ||
        process.env.VERCEL_GIT_COMMIT_REF !== "main" || process.env.CMS_LIVE_ORIGIN !== LIVE_ORIGIN ||
        process.env.CMS_WORKER_URL !== LIVE_WORKER_ORIGIN) return null;
    return { kind: "live", origin: LIVE_ORIGIN, worker: LIVE_WORKER_ORIGIN,
      workerEnvironment: "live", oidcEnvironment: "production" } as const;
  }
  if (process.env.CMS_TEST_ENABLED !== "true" || process.env.VERCEL_ENV === "production") return null;
  if (process.env.VERCEL) {
    if (process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== "cms-testing" ||
        process.env.CMS_TEST_ORIGIN !== PREVIEW_ORIGIN) return null;
    return { kind: "preview", origin: PREVIEW_ORIGIN, worker: TEST_WORKER_ORIGIN,
      workerEnvironment: "test", oidcEnvironment: "preview" } as const;
  }
  try {
    const url = new URL(process.env.CMS_TEST_ORIGIN ?? "");
    if (url.origin !== process.env.CMS_TEST_ORIGIN || url.username || url.password ||
        !["localhost", "127.0.0.1"].includes(url.hostname) || url.protocol !== "http:") return null;
    return { kind: "local", origin: url.origin, worker: null,
      workerEnvironment: "test", oidcEnvironment: null } as const;
  } catch { return null; }
}
export const cmsOrigin = () => cmsScope()?.origin ?? null;
export function cmsCacheTag(pageId: PageId) {
  const scope = cmsScope();
  if (!scope) throw new Error("CMS deployment is disabled.");
  return scope.kind === "live" ? `cms:live:breeze:page:${pageId}` : pages[pageId].cacheTag;
}
