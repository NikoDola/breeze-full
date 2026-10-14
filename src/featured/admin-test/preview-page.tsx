import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { authorized } from "@/lib/cms/access";
import HomePreview from "./HomePreview";
import PublicLayout from "@/featured/site/PublicLayout";
import { getSite } from "@/lib/cms/site";
import { getPublishedReviews } from "@/lib/cms/public";

export const metadata = { title: "Homepage preview", robots: { index: false, follow: false } };
export default async function PreviewPage() {
  if (!authorized(await headers())) notFound();
  const [site, reviews] = await Promise.all([getSite(), getPublishedReviews()]);
  return <PublicLayout><HomePreview site={site} reviews={reviews?.document} /></PublicLayout>;
}
