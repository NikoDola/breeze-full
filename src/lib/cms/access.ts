import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cmsOrigin, cmsScope } from "./scope";
import { throttleEditor } from "./throttle";
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
export const SESSION_SECONDS = 8 * 60 * 60;
export function sessionCookieName() {
  return cmsOrigin()?.startsWith("https:") ? "__Host-breeze-cms-session" : "breeze-cms-session";
}
function sessionValue(headers: Pick<Headers, "get">) {
  const prefix = `${sessionCookieName()}=`;
  return headers.get("cookie")?.split(";").map(value => value.trim()).find(value => value.startsWith(prefix))?.slice(prefix.length);
}
function signature(payload: string) {
  const { username, password } = credentials();
  const key = createHmac("sha256", process.env.CMS_WRITE_TOKEN!)
    .update(JSON.stringify(["breeze-session-v1", cmsScope()?.kind, cmsOrigin(), username, password])).digest();
  return createHmac("sha256", key).update(payload).digest("base64url");
}
export function validCredentials(username: string, password: string) {
  const expected = credentials();
  return editorEnabled() && equal(JSON.stringify([username, password]), JSON.stringify([expected.username, expected.password]));
}
export function createEditorSession(now = Date.now()) {
  if (!editorEnabled()) throw new Error("CMS is disabled.");
  const payload = Buffer.from(JSON.stringify({ version: 1, expires: Math.floor(now / 1000) + SESSION_SECONDS,
    nonce: randomBytes(16).toString("base64url") })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}
export function sessionAuthorized(headers: Pick<Headers, "get">, now = Date.now()) {
  if (!editorEnabled() || headers.get("host") !== new URL(cmsOrigin()!).host) return false;
  const value = sessionValue(headers);
  if (!value || value.length > 1024) return false;
  const parts = value.split(".");
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !equal(parts[1], signature(parts[0]))) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const seconds = Math.floor(now / 1000);
    return payload.version === 1 && Number.isSafeInteger(payload.expires) &&
      payload.expires > seconds && payload.expires <= seconds + SESSION_SECONDS;
  } catch { return false; }
}
export function authorized(headers: Pick<Headers, "get">): boolean {
  if (!editorEnabled()) return false;
  if (headers.get("host") !== new URL(cmsOrigin()!).host) return false;
  // A supplied session (including the sign-out marker) takes precedence over
  // legacy Basic credentials cached by browsers or supplied by proof tools.
  if (sessionValue(headers) !== undefined) return sessionAuthorized(headers);
  const value = headers.get("authorization") ?? "";
  if (!value.startsWith("Basic ") || value.length > 2048) return false;
  const { username, password } = credentials();
  return equal(Buffer.from(value.slice(6), "base64").toString("utf8"), `${username}:${password}`);
}
export function protectEditor(request: Request): Response | null {
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
  if (!editorEnabled()) return Response.json({ error: "Not found." }, { status: 404, headers });
  if (!authorized(request.headers)) return Response.json({ error: "Your session has expired. Please sign in again." }, { status: 401, headers });
  if (!["GET", "HEAD"].includes(request.method) &&
    (request.headers.get("origin") !== cmsOrigin() || request.headers.get("x-cms-request") !== "editor")) {
    return Response.json({ error: "Invalid request origin." }, { status: 403, headers });
  }
  return null;
}

export async function protectEditorRequest(request: Request): Promise<Response | null> {
  // Requests without credentials do not spend a token. Reject disabled/wrong-host
  // requests locally. Check the source bucket BEFORE comparing supplied credentials:
  // a correct password must not turn a throttled guessing attempt into a success.
  if (editorEnabled() && request.headers.get("host") === new URL(cmsOrigin()!).host &&
    (request.headers.has("authorization") || sessionValue(request.headers) !== undefined)) {
    const limited = await throttleEditor(request);
    if (limited) return limited;
  }
  return protectEditor(request);
}
