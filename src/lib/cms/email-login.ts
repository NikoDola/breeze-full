import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { cookieValue } from "./access";
import { loginDigest, loginEmailAllowed, normalizeLoginEmail } from "./email-settings";
import { cmsOrigin } from "./scope";
import { throttleKey } from "./throttle";
import { workerOrigin } from "./worker";
import { LOGIN_RESEND_SECONDS } from "../../../cms/shared/login-policy";

export class EmailLoginError extends Error {
  constructor(message: string, public status = 503, public retryAfter = 0) { super(message); }
}
export function challengeCookieName() {
  return cmsOrigin()?.startsWith("https:") ? "__Host-breeze-cms-challenge" : "breeze-cms-challenge";
}
function binding(request: Request) {
  const value = cookieValue(request.headers, challengeCookieName());
  if (value && /^[a-f0-9]{32}\.[a-f0-9]{64}$/.test(value)) {
    const [id, secret] = value.split(".");
    return { id, secret };
  }
  return null;
}
function source(request: Request) {
  const key = throttleKey(request.headers);
  if (!key) throw new EmailLoginError("Email sign-in is temporarily unavailable. Please try again shortly.");
  return key;
}
async function worker(action: string, body: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(`${workerOrigin()}/api/admin/auth/email/${action}`, {
    method: "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000),
    headers: { Authorization: `Bearer ${process.env.CMS_WRITE_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("Email sign-in protection unavailable.");
  const result = await response.json();
  if (!result || typeof result !== "object" || Array.isArray(result)) throw new Error("Invalid email sign-in result.");
  return result;
}
function wait(result: Record<string, unknown>, maximum: number) {
  if (!Number.isSafeInteger(result.retryAfter) || Number(result.retryAfter) < 0 || Number(result.retryAfter) > maximum) {
    throw new Error("Invalid sign-in retry deadline.");
  }
  return Number(result.retryAfter);
}
function limited(seconds: number) {
  const minutes = Math.ceil(seconds/60);
  return new EmailLoginError(`Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`, 429, seconds);
}
function fields(request: Request, email: string, id: string, secret: string, code: string) {
  const emailKey = loginDigest("email", email), bindingHash = loginDigest("browser", secret);
  return { id, sourceKey: source(request), emailKey, bindingHash,
    codeHash: loginDigest("code", id, emailKey, bindingHash, code) };
}

export async function requestEmailCode(request: Request, suppliedEmail: string) {
  const email = normalizeLoginEmail(suppliedEmail);
  const id = randomBytes(16).toString("hex"), secret = binding(request)?.secret ?? randomBytes(32).toString("hex");
  const response = { cookie: `${id}.${secret}`, retryAfter: LOGIN_RESEND_SECONDS,
    message: "If this email has admin access, a verification code has been sent. Check your inbox and spam folder." };
  if (!loginEmailAllowed(email)) return response;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.startsWith("re_")) throw new EmailLoginError("Email sign-in is not configured yet. Please contact support.");
  const code = String(randomInt(1000000)).padStart(6, "0");
  const result = await worker("request", fields(request, email, id, secret, code));
  const retryAfter = wait(result, 86400);
  if (typeof result.accepted !== "boolean" || (result.accepted && retryAfter !== 0) || (!result.accepted && retryAfter === 0)) {
    throw new Error("Invalid email reservation.");
  }
  if (!result.accepted) throw limited(retryAfter);
  const templateId = process.env.RESEND_LOGIN_TEMPLATE_ID?.trim() || "admin-verification-code";
  try {
    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `breeze-login/${id}` },
      body: JSON.stringify({ from: "Breeze admin <verification@nikodola.com>", to: [email], reply_to: "nikodola@gmail.com",
        // Resend supplies the published template's subject and content.
        template: { id: templateId, variables: { CODE: code } },
      }),
    });
    const delivery = await sent.json();
    if (!sent.ok || typeof delivery?.id !== "string" || !delivery.id) throw new Error("Email delivery was not confirmed.");
    const completed = await worker("complete", { id, status: "sent" });
    if (completed.updated !== true) throw new Error("Email sign-in activation failed.");
  } catch {
    // A timeout may have sent an email. Invalidate its code; never resend automatically.
    try { await worker("complete", { id, status: "failed" }); } catch { /* Pending codes cannot authenticate and expire automatically. */ }
    console.warn(JSON.stringify({ event: "cms.auth.email-delivery-unavailable" }));
    throw new EmailLoginError("We could not send a verification code. Please wait a minute and try again, or contact support.");
  }
  return response;
}

export async function verifyEmailCode(request: Request, suppliedEmail: string, code: string) {
  const email = normalizeLoginEmail(suppliedEmail);
  const current = binding(request) ?? { id: randomBytes(16).toString("hex"), secret: randomBytes(32).toString("hex") };
  const result = await worker("verify", fields(request, email, current.id, current.secret, code));
  const retryAfter = wait(result, 3600);
  if (typeof result.allowed !== "boolean" || (result.allowed && retryAfter !== 0)) throw new Error("Invalid code verification result.");
  if (retryAfter > 0) throw limited(retryAfter);
  if (!result.allowed || !loginEmailAllowed(email)) throw new EmailLoginError("The code is incorrect or has expired. Request a new code if needed.", 401);
  return email;
}
