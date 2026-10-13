import "server-only";
import { cmsScope } from "./scope";
export function workerOrigin(): string {
  const value = process.env.CMS_WORKER_URL;
  if (!value) throw new Error("CMS_WORKER_URL is not configured.");
  const scope = cmsScope();
  if (process.env.VERCEL && (!scope || value !== scope.worker)) throw new Error("CMS Worker scope is invalid.");
  const url = new URL(value);
  if (url.origin !== value || url.username || url.password || (url.protocol !== "https:" &&
      !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))) throw new Error("Invalid Worker origin.");
  return url.origin;
}
export function workerAdmin(path: string, body?: unknown) {
  const token = process.env.CMS_WRITE_TOKEN;
  if (!token || token.length < 32) throw new Error("CMS write access is not configured.");
  return fetch(`${workerOrigin()}/api/admin/${path}`, {
    method: body === undefined ? "GET" : "POST", cache: "no-store", redirect: "error",
    signal: AbortSignal.timeout(45000),
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
