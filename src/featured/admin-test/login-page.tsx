import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { editorEnabled, sessionAuthorized } from "@/lib/cms/access";
import { cmsOrigin } from "@/lib/cms/scope";
import { adminFont } from "./font";
import Login from "./Login";

export const metadata = { title: "Sign in | Breeze administration", robots: { index: false, follow: false } };
export default async function LoginPage() {
  const requestHeaders = await headers();
  if (!editorEnabled() || requestHeaders.get("host") !== new URL(cmsOrigin()!).host) notFound();
  if (sessionAuthorized(requestHeaders)) redirect("/admin-test");
  return <div className={adminFont.variable}><Login /></div>;
}
