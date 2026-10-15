import { NextResponse, type NextRequest } from "next/server";
import { protectEditorRequest } from "@/lib/cms/access";
import { adminReportPolicy } from "@/lib/cms/csp";
import { workerOrigin } from "@/lib/cms/worker";
import { cmsOrigin } from "@/lib/cms/scope";
export async function proxy(request: NextRequest) {
  const isPage = !request.nextUrl.pathname.startsWith("/api/");
  // API handlers authorize independently, once per request. Do not spend two
  // throttle tokens (proxy + handler) for one save, publication or image request.
  const isLogin = request.nextUrl.pathname === "/admin-test/login";
  let denied = isPage && !isLogin ? await protectEditorRequest(request) : null;
  if (denied?.status === 401 && request.nextUrl.pathname !== "/admin-test/preview" &&
    request.headers.get("host") === new URL(cmsOrigin()!).host) {
    denied = NextResponse.redirect(new URL("/admin-test/login", request.url));
  }
  const requestHeaders = new Headers(request.headers);
  let policy: string | undefined;
  if (isPage) {
    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
    let mediaOrigin: string | undefined;
    try { mediaOrigin = workerOrigin(); } catch { /* Disabled/unconfigured CMS. */ }
    policy = adminReportPolicy(nonce, process.env.NODE_ENV === "development", mediaOrigin);
    requestHeaders.set("x-nonce", nonce);
    // Next reads this request header to nonce its own inline/bootstrap scripts.
    // Only the report-only header goes to the browser; enforcement stays framing-only.
    requestHeaders.set("Content-Security-Policy", policy);
  }
  const response = denied ?? NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Framing enforcement lives in next.config: setting a different CSP response
  // header here also overwrites Next's request CSP and prevents nonce extraction.
  if (policy) response.headers.set("Content-Security-Policy-Report-Only", policy);
  return response;
}
export const config = { matcher: ["/admin/:path*", "/admin-test/:path*", "/api/cms/editor/:path*", "/api/cms/media/:path*", "/api/cms/session/:path*"] };
