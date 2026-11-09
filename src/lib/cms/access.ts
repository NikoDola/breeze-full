import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cmsOrigin } from "./scope";
import { throttleEditor } from "./throttle";
import { emailAuthConfigured, loginDigest, loginEmailAllowed, normalizeLoginEmail } from "./email-settings";

const equal = (a: string, b: string) => timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
export function editorEnabled() {
  return Boolean(cmsOrigin() && emailAuthConfigured() && (process.env.CMS_WRITE_TOKEN?.length ?? 0) >= 32);
}
export const SESSION_SECONDS = 8 * 60 * 60;
export function sessionCookieName() {
  return cmsOrigin()?.startsWith("https:") ? "__Host-breeze-cms-session" : "breeze-cms-session";
}
export function cookieValue(headers: Pick<Headers, "get">, name: string) {
  const prefix = `${name}=`;
  return headers.get("cookie")?.split(";").map(value => value.trim()).find(value => value.startsWith(prefix))?.slice(prefix.length);
}
function signature(payload: string) {
  return loginDigest("session", process.env.CMS_WRITE_TOKEN!, payload);
}
export function createEditorSession(email: string, now = Date.now()) {
  if (!editorEnabled() || !loginEmailAllowed(email)) throw new Error("CMS sign-in is unavailable.");
  const payload = Buffer.from(JSON.stringify({ version: 2, email: normalizeLoginEmail(email),
    expires: Math.floor(now / 1000) + SESSION_SECONDS, nonce: randomBytes(16).toString("base64url") })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}
export function sessionAuthorized(headers: Pick<Headers, "get">, now = Date.now()) {
  if (!editorEnabled() || headers.get("host") !== new URL(cmsOrigin()!).host) return false;
  const value = cookieValue(headers, sessionCookieName());
  if (!value || value.length > 1024) return false;
  const parts = value.split(".");
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !equal(parts[1], signature(parts[0]))) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const seconds = Math.floor(now / 1000);
    return payload.version === 2 && typeof payload.email === "string" && loginEmailAllowed(payload.email) &&
      payload.email === normalizeLoginEmail(payload.email) && Number.isSafeInteger(payload.expires) &&
      payload.expires > seconds && payload.expires <= seconds + SESSION_SECONDS;
  } catch { return false; }
}
// Passwords and cached Basic headers cannot bypass verified-email sign-in.
export const authorized = sessionAuthorized;

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
  if (editorEnabled() && request.headers.get("host") === new URL(cmsOrigin()!).host &&
      (request.headers.has("authorization") || cookieValue(request.headers, sessionCookieName()) !== undefined)) {
    const limited = await throttleEditor(request);
    if (limited) return limited;
  }
  return protectEditor(request);
}
