import ReviewsContent from "@/components/sections/ReviewsContent";
import { getPublishedReviews } from "@/lib/cms/public";
import { getSite } from "@/lib/cms/site";
import { createReviewsSeed } from "../../../cms/shared/collection-seeds";
import { reviewPageDefaults } from "../../../cms/shared/collections";
import { pageMetadata } from "@/lib/cms/metadata";

export async function generateMetadata() {
  const publication = await getPublishedReviews();
  const page = publication?.document.page ?? reviewPageDefaults;
  return pageMetadata(page.seoTitle, page.seoDescription, publication?.document.ogImage);
}
export default async function Page() {
  const [publication, site] = await Promise.all([getPublishedReviews(), getSite()]);
  return <ReviewsContent document={publication?.document ?? createReviewsSeed()} site={site} publication={publication ?? undefined} />;
}
