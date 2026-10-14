import { homeSeed } from "../../../../cms/shared/home-seed";
import type { ReviewsContent } from "../../../../cms/shared/home";
import RichTextContent from "@/components/ui/RichTextContent";
import ReviewCard from "@/components/ui/ReviewCard";

export default function ReviewsSection({ content = homeSeed.slots.reviews.content }: { content?: ReviewsContent }) {
  return (
    <section className="section reviews" id="reviews" aria-labelledby="reviews-title"><div className="wrap">
      <div className="section-heading reviews-heading"><div><h2 id="reviews-title">{"headingAccent" in content ? <>{content.heading}<br /><em>{content.headingAccent}</em></> : <RichTextContent value={content.heading} />}</h2></div><p>{content.intro}</p></div>
      <div className="review-grid">{content.items.map((review) => <ReviewCard key={review.id} name={review.name} quote={review.quote} />)}</div>
    </div></section>
  );
}
