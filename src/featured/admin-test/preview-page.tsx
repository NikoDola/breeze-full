import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { authorized } from "@/lib/cms/access";
import HomePreview from "./HomePreview";
import { getSite } from "@/lib/cms/site";
import { getPublishedHome, getPublishedReviews } from "@/lib/cms/public";
import { getContentPage } from "@/lib/cms/public";
import { getServiceSummaries } from "@/lib/cms/content";
import { isContentPage } from "../../../cms/shared/content";
import ContentPreview from "./ContentPreview";
import { createReviewsSeed } from "../../../cms/shared/collection-seeds";

export const metadata = { title: "Homepage preview", robots: { index: false, follow: false } };
export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ pageId?: string }> }) {
  if (!authorized(await headers())) notFound();
  const pageId = (await searchParams).pageId ?? "home";
  if (pageId === "reviews") {
    const [reviews, site, home] = await Promise.all([getPublishedReviews(), getSite(), getPublishedHome()]);
    return <ContentPreview initialDocument={reviews?.document ?? createReviewsSeed(home?.document)} site={site} services={[]} home={home?.document} />;
  }
  if (isContentPage(pageId)) {
    const [{ document }, site, services] = await Promise.all([getContentPage(pageId), getSite(), getServiceSummaries()]);
    return <ContentPreview initialDocument={document} site={site} services={services} />;
  }
  if (pageId !== "global" && pageId !== "home") notFound();
  const mode = pageId;
  const [site, reviews, home] = await Promise.all([getSite(), getPublishedReviews(), getPublishedHome()]);
  return <HomePreview site={site} reviews={reviews?.document} initialDocument={home?.document} mode={mode} />;
}
