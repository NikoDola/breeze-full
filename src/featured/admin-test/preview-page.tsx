import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { authorized } from "@/lib/cms/access";
import HomePreview from "./HomePreview";
import { getSite } from "@/lib/cms/site";
import { getPublishedHome, getPublishedReviews } from "@/lib/cms/public";
import { getContentPage } from "@/lib/cms/public";
import { getServiceSummaries } from "@/lib/cms/content";
import { contentDefinitions, contentText, isContentPage } from "../../../cms/shared/content";
import ContentPreview from "./ContentPreview";
import { createReviewsSeed } from "../../../cms/shared/collection-seeds";
import { homeSeed } from "../../../cms/shared/home-seed";
import { site as defaultSite } from "@/lib/site";
import { serviceLabels } from "@/lib/service-labels";

// The editor sends the selected draft or publication after hydration. Keep the
// preview route available even when a public CMS read is temporarily unavailable.
const seedServices = () => Object.keys(serviceLabels).map(slug => {
  const definition = contentDefinitions[slug as keyof typeof serviceLabels];
  return { slug, title: contentText(definition.seed.content, "heading"), tagline: contentText(definition.seed.content, "tagline"),
    blurb: contentText(definition.seed.content, "summary"), icon: definition.icon, image: definition.image };
});

export const metadata = { title: "Homepage preview", robots: { index: false, follow: false } };
export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ pageId?: string }> }) {
  if (!authorized(await headers())) notFound();
  const pageId = (await searchParams).pageId ?? "home";
  if (pageId === "reviews") {
    const [reviews, site, home] = await Promise.all([getPublishedReviews().catch(() => null), getSite().catch(() => defaultSite), getPublishedHome().catch(() => null)]);
    return <ContentPreview initialDocument={reviews?.document ?? createReviewsSeed(home?.document ?? homeSeed)} site={site} services={[]} home={home?.document ?? homeSeed} />;
  }
  if (isContentPage(pageId)) {
    const [{ document }, site, services] = await Promise.all([
      getContentPage(pageId).catch(() => ({ document: contentDefinitions[pageId].seed })),
      getSite().catch(() => defaultSite), getServiceSummaries().catch(seedServices),
    ]);
    return <ContentPreview initialDocument={document} site={site} services={services} />;
  }
  if (pageId !== "global" && pageId !== "home") notFound();
  const mode = pageId;
  const [site, reviews, home] = await Promise.all([getSite().catch(() => defaultSite), getPublishedReviews().catch(() => null), getPublishedHome().catch(() => null)]);
  return <HomePreview site={site} reviews={reviews?.document} initialDocument={home?.document ?? homeSeed} mode={mode} />;
}
