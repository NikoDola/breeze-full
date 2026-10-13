import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cmsOrigin, cmsScope } from "./scope";
const equal = (a: string, b: string) => timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
function credentials() {
  return cmsScope()?.kind === "live"
    ? { username: process.env.CMS_LIVE_USERNAME, password: process.env.CMS_LIVE_PASSWORD }
    : { username: process.env.CMS_TEST_USERNAME, password: process.env.CMS_TEST_PASSWORD };
}
export function editorEnabled() {
  const { username, password } = credentials();
  return Boolean(cmsOrigin() && username && !username.includes(":") &&
    (password?.length ?? 0) >= 32 && (process.env.CMS_WRITE_TOKEN?.length ?? 0) >= 32);
}
export function authorized(headers: Pick<Headers, "get">): boolean {
  if (!editorEnabled()) return false;
  if (headers.get("host") !== new URL(cmsOrigin()!).host) return false;
  const value = headers.get("authorization") ?? "";
  if (!value.startsWith("Basic ") || value.length > 2048) return false;
  const { username, password } = credentials();
  return equal(Buffer.from(value.slice(6), "base64").toString("utf8"), `${username}:${password}`);
}
export function protectEditor(request: Request): Response | null {
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
  if (!editorEnabled()) return Response.json({ error: "Not found." }, { status: 404, headers });
  if (!authorized(request.headers)) return Response.json({ error: "CMS authentication required." }, {
    status: 401, headers: { ...headers, "WWW-Authenticate": 'Basic realm="Breeze CMS", charset="UTF-8"' },
  });
  if (!["GET", "HEAD"].includes(request.method) &&
    (request.headers.get("origin") !== cmsOrigin() || request.headers.get("x-cms-request") !== "editor")) {
    return Response.json({ error: "Invalid request origin." }, { status: 403, headers });
  }
  return null;
}
