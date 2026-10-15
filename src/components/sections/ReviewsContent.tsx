import PageHero from "./PageHero";
import CtaBandContent from "./CtaBandContent";
import ReviewCard from "@/components/ui/ReviewCard";
import { orderedReviews, reviewPageDefaults, type ReviewsDocument } from "../../../cms/shared/collections";
import type { SiteData } from "@/lib/site";

export default function ReviewsContent({ document, site, publication }: { document: ReviewsDocument; site: SiteData; publication?: { revisionId: string; version: number } }) {
  const page = document.page ?? reviewPageDefaults;
  return <><PageHero title={page.heading} eyebrow={page.eyebrow} tagline={page.tagline} icon="star" image="/images/Why-We-Should-At-Home.jpg" />
    <section className="section reviews client-reviews" aria-label="Client reviews" data-cms-page={publication ? "reviews" : undefined} data-cms-revision={publication?.revisionId} data-cms-version={publication?.version}><div className="wrap review-grid">{orderedReviews(document).map(review => <ReviewCard key={review.id} name={review.name} quote={review.quote} collapsible />)}</div></section>
    <CtaBandContent site={site} /></>;
}
