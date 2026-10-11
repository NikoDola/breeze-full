import { NextResponse, type NextRequest } from "next/server";
import { protectEditor } from "@/lib/cms/access";
export function proxy(request: NextRequest) {
  const denied = protectEditor(request);
  if (denied) return denied;
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
  return response;
}
export const config = { matcher: ["/admin/:path*", "/admin-test/:path*", "/api/cms/editor/:path*"] };
