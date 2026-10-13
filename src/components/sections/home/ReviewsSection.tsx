import { homeSeed } from "../../../../cms/shared/home-seed";
import type { ReviewsContent } from "../../../../cms/shared/home";
import RichTextContent from "@/components/ui/RichTextContent";

export default function ReviewsSection({ content = homeSeed.slots.reviews.content }: { content?: ReviewsContent }) {
  return (
    <section className="section reviews" id="reviews" aria-labelledby="reviews-title"><div className="wrap">
      <div className="section-heading reviews-heading"><div><h2 id="reviews-title">{"headingAccent" in content ? <>{content.heading}<br /><em>{content.headingAccent}</em></> : <RichTextContent value={content.heading} />}</h2></div><p>{content.intro}</p></div>
      <div className="review-grid">{content.items.map((review) => <figure className="review-card" key={review.id}><span className="review-stars" aria-label="Five stars">★★★★★</span><blockquote>“{review.quote}”</blockquote><figcaption>{review.name}</figcaption></figure>)}</div>
    </div></section>
  );
}
