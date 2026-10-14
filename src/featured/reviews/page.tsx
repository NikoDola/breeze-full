import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import CtaBand from "@/components/sections/CtaBand";
import ReviewCard from "@/components/ui/ReviewCard";
import { reviews } from "@/lib/reviews";
import { homeSeed } from "../../../cms/shared/home-seed";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "What Middle Tennessee homeowners say about Breeze Heating & Cooling — in their own words.",
};

export default function Page() {
  const featured = homeSeed.slots.reviews.content.items;
  const featuredNames = new Set(featured.map(review => review.name));
  const clientReviews = [
    ...featured.map(review => ({ name: review.name, text: reviews.find(item => item.name === review.name)?.text ?? review.quote })),
    ...reviews.filter(review => !featuredNames.has(review.name)),
  ];
  return (
    <>
      <PageHero
        title="Reviews"
        eyebrow="Our clients"
        tagline="In their own words."
        icon="star"
        image="/images/Why-We-Should-At-Home.jpg"
      />

      <section className="section reviews client-reviews" aria-label="Client reviews">
        <div className="wrap review-grid">
          {clientReviews.map(review => <ReviewCard key={review.name} name={review.name} quote={review.text} collapsible />)}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
