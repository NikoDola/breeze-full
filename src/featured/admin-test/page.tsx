import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { authorized } from "@/lib/cms/access";
import { cmsProofEnabled } from "@/lib/cms/scope";
import Editor from "./Editor";
import { adminFont } from "./font";
export const metadata = { title: "Breeze CMS", robots: { index: false, follow: false } };
export default async function AdminTestPage() {
  if (!authorized(await headers())) notFound();
  return <div className={adminFont.variable}><Editor proofEnabled={cmsProofEnabled()} /></div>;
}
