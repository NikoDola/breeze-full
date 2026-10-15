import { NextResponse } from "next/server";
import { createEditorSession, editorEnabled, sessionCookieName, SESSION_SECONDS, validCredentials } from "@/lib/cms/access";
import { cmsOrigin } from "@/lib/cms/scope";
import { throttleEditor } from "@/lib/cms/throttle";
import { InputError, readBody } from "../../../cms/shared/contract";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status,
  headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } });
function protect(request: Request) {
  if (!editorEnabled() || request.headers.get("host") !== new URL(cmsOrigin()!).host) return json({ error: "Not found." }, 404);
  if (request.headers.get("origin") !== cmsOrigin() || request.headers.get("x-cms-request") !== "editor") {
    return json({ error: "Please sign in from this website." }, 403);
  }
  return null;
}
function setSession(response: NextResponse, value: string) {
  response.cookies.set(sessionCookieName(), value, { httpOnly: true, secure: cmsOrigin()!.startsWith("https:"),
    sameSite: "strict", path: "/", maxAge: SESSION_SECONDS });
  return response;
}
export async function POST(request: Request) {
  const denied = protect(request); if (denied) return denied;
  const limited = await throttleEditor(request); if (limited) return limited;
  try {
    if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "Invalid sign-in request." }, 400);
    const body = JSON.parse(await readBody(request, 8192));
    if (!body || typeof body.username !== "string" || typeof body.password !== "string" ||
      body.username.length > 256 || body.password.length > 2048) return json({ error: "Enter your username and password." }, 400);
    if (!validCredentials(body.username, body.password)) return json({ error: "The username or password is incorrect." }, 401);
    return setSession(json({ ok: true }), createEditorSession());
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof InputError) return json({ error: "Invalid sign-in request." }, 400);
    return json({ error: "Sign-in is temporarily unavailable. Please try again." }, 503);
  }
}
export async function DELETE(request: Request) {
  const denied = protect(request); if (denied) return denied;
  // This non-session value also blocks Basic credentials cached before the new
  // login was introduced. Signing in replaces it with a fresh signed session.
  return setSession(json({ ok: true }), "signed-out");
}
