import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { authorized } from "@/lib/cms/access";
import HomePreview from "./HomePreview";

export const metadata = { title: "Homepage preview", robots: { index: false, follow: false } };
export default async function PreviewPage() {
  if (!authorized(await headers())) notFound();
  return <HomePreview />;
}
