import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { PREVIEW_ORIGIN } from "../../../cms/shared/contract";
const equal = (a: string, b: string) => timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
export function testOrigin(): string | null {
  if (process.env.CMS_TEST_ENABLED !== "true" || process.env.VERCEL_ENV === "production" ||
      (process.env.VERCEL && process.env.VERCEL_ENV !== "preview")) return null;
  if (process.env.VERCEL && (process.env.VERCEL_GIT_COMMIT_REF !== "cms-testing" ||
      process.env.CMS_TEST_ORIGIN !== PREVIEW_ORIGIN)) return null;
  try {
    const url = new URL(process.env.CMS_TEST_ORIGIN ?? "");
    const local = ["localhost", "127.0.0.1"].includes(url.hostname);
    if (url.origin !== process.env.CMS_TEST_ORIGIN || url.username || url.password) return null;
    if (process.env.VERCEL ? url.protocol !== "https:" : !local || url.protocol !== "http:") return null;
    return url.origin;
  } catch { return null; }
}
export function editorEnabled() {
  return Boolean(testOrigin() && process.env.CMS_TEST_USERNAME && !process.env.CMS_TEST_USERNAME.includes(":") &&
    (process.env.CMS_TEST_PASSWORD?.length ?? 0) >= 32 && (process.env.CMS_WRITE_TOKEN?.length ?? 0) >= 32);
}
export function authorized(headers: Pick<Headers, "get">): boolean {
  if (!editorEnabled()) return false;
  if (headers.get("host") !== new URL(testOrigin()!).host) return false;
  const value = headers.get("authorization") ?? "";
  if (!value.startsWith("Basic ") || value.length > 2048) return false;
  return equal(Buffer.from(value.slice(6), "base64").toString("utf8"), `${process.env.CMS_TEST_USERNAME}:${process.env.CMS_TEST_PASSWORD}`);
}
export function protectEditor(request: Request): Response | null {
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
  if (!editorEnabled()) return Response.json({ error: "Not found." }, { status: 404, headers });
  if (!authorized(request.headers)) return Response.json({ error: "Test editor authentication required." }, {
    status: 401, headers: { ...headers, "WWW-Authenticate": 'Basic realm="Breeze test editor", charset="UTF-8"' },
  });
  if (!["GET", "HEAD"].includes(request.method) &&
    (request.headers.get("origin") !== testOrigin() || request.headers.get("x-cms-request") !== "editor")) {
    return Response.json({ error: "Invalid request origin." }, { status: 403, headers });
  }
  return null;
}
