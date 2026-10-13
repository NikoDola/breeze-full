import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { authorized } from "@/lib/cms/access";
import Editor from "./Editor";
export const metadata = { title: "Breeze CMS", robots: { index: false, follow: false } };
export default async function AdminTestPage() {
  if (!authorized(await headers())) notFound();
  return <Editor />;
}
