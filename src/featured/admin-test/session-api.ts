import { NextResponse } from "next/server";
import { createEditorSession, editorEnabled, sessionCookieName, SESSION_SECONDS } from "@/lib/cms/access";
import { cmsOrigin } from "@/lib/cms/scope";
import { throttleEditor } from "@/lib/cms/throttle";
import { challengeCookieName, EmailLoginError, requestEmailCode, verifyEmailCode } from "@/lib/cms/email-login";
import { LOGIN_CODE_SECONDS } from "../../../cms/shared/login-policy";
import { InputError, readBody } from "../../../cms/shared/contract";

const json = (body: unknown, status = 200, retryAfter = 0) => NextResponse.json(body, { status,
  headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow",
    ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}) } });
function protect(request: Request) {
  if (!editorEnabled() || request.headers.get("host") !== new URL(cmsOrigin()!).host) return json({ error: "Not found." }, 404);
  if (request.headers.get("origin") !== cmsOrigin() || request.headers.get("x-cms-request") !== "editor") {
    return json({ error: "Please sign in from this website." }, 403);
  }
  return null;
}
function setCookie(response: NextResponse, name: string, value: string, seconds: number) {
  response.cookies.set(name, value, { httpOnly: true, secure: cmsOrigin()!.startsWith("https:"),
    sameSite: "strict", path: "/", maxAge: seconds });
  return response;
}
export async function POST(request: Request) {
  const denied = protect(request); if (denied) return denied;
  const limited = await throttleEditor(request); if (limited) return limited;
  try {
    if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "Invalid sign-in request." }, 400);
    const body = JSON.parse(await readBody(request, 2048));
    if (!body || typeof body !== "object" || Array.isArray(body) || typeof body.email !== "string" || body.email.length > 254 ||
        !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(body.email.trim())) return json({ error: "Enter a valid email address." }, 400);
    if (body.action === "request-code" && Object.keys(body).length === 2) {
      const result = await requestEmailCode(request, body.email);
      return setCookie(json({ ok: true, message: result.message, resendAfter: result.retryAfter }),
        challengeCookieName(), result.cookie, LOGIN_CODE_SECONDS);
    }
    if (body.action === "verify-code" && Object.keys(body).length === 3 && typeof body.code === "string" && /^\d{6}$/.test(body.code)) {
      const email = await verifyEmailCode(request, body.email, body.code);
      const response = setCookie(json({ ok: true }), sessionCookieName(), createEditorSession(email), SESSION_SECONDS);
      return setCookie(response, challengeCookieName(), "", 0);
    }
    return json({ error: "Enter the six-digit verification code or request a new one." }, 400);
  } catch (error) {
    if (error instanceof EmailLoginError) return json({ error: error.message }, error.status, error.retryAfter);
    if (error instanceof SyntaxError || error instanceof InputError) return json({ error: "Invalid sign-in request." }, 400);
    console.warn(JSON.stringify({ event: "cms.auth.email-protection-unavailable" }));
    return json({ error: "Email sign-in is temporarily unavailable. Please try again shortly." }, 503);
  }
}
export async function DELETE(request: Request) {
  const denied = protect(request); if (denied) return denied;
  const response = setCookie(json({ ok: true }), sessionCookieName(), "", 0);
  return setCookie(response, challengeCookieName(), "", 0);
}
