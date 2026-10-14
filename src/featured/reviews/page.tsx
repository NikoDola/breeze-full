import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import CtaBand from "@/components/sections/CtaBand";
import ReviewCard from "@/components/ui/ReviewCard";
import { getPublishedReviews } from "@/lib/cms/public";
import { createReviewsSeed } from "../../../cms/shared/collection-seeds";
import { orderedReviews } from "../../../cms/shared/collections";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "What Middle Tennessee homeowners say about Breeze Heating & Cooling — in their own words.",
};

export default async function Page() {
  const publication = await getPublishedReviews();
  const clientReviews = orderedReviews(publication?.document ?? createReviewsSeed());
  return (
    <>
      <PageHero
        title="Reviews"
        eyebrow="Our clients"
        tagline="In their own words."
        icon="star"
        image="/images/Why-We-Should-At-Home.jpg"
      />

      <section className="section reviews client-reviews" aria-label="Client reviews" data-cms-page={publication ? "reviews" : undefined} data-cms-revision={publication?.revisionId} data-cms-version={publication?.version}>
        <div className="wrap review-grid">
          {clientReviews.map(review => <ReviewCard key={review.id} name={review.name} quote={review.quote} collapsible />)}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
