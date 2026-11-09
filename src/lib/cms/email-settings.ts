import "server-only";
import { createHmac } from "node:crypto";
import { cmsOrigin, cmsScope } from "./scope";

// This client-approved access list is never sent to the login form.
const allowedEmails = new Set(["nikodola@gmail.com", "breezehc@gmail.com", "ranahbeard@gmail.com"]);
export const normalizeLoginEmail = (email: string) => email.trim().toLowerCase();
export const loginEmailAllowed = (email: string) => allowedEmails.has(normalizeLoginEmail(email));
export const emailAuthConfigured = () => /^[a-f0-9]{64}$/i.test(process.env.CMS_AUTH_SECRET ?? "");
export function loginDigest(purpose: string, ...values: string[]) {
  if (!emailAuthConfigured()) throw new Error("Email sign-in is not configured.");
  return createHmac("sha256", process.env.CMS_AUTH_SECRET!)
    .update(JSON.stringify(["breeze-email-login-v2", cmsScope()?.kind, cmsOrigin(), purpose, ...values])).digest("hex");
}
