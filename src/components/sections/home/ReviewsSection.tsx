const testimonials = [
  { name: "David and Deborah Marks", quote: "The whole team at Breeze was very considerate and helpful while putting in our system. Wish there were more companies like this one." },
  { name: "Nancy Fessler", quote: "All of your personnel seem knowledgeable about their jobs. The entire crew was awesome!" },
  { name: "Lana Pargh", quote: "We have been using Breeze for 3 years and will not use anyone else. Kam is sweet, kind, and very professional. He always comes through for us." },
];

export default function ReviewsSection() {
  return (
    <section className="section reviews" id="reviews" aria-labelledby="reviews-title"><div className="wrap">
      <div className="section-heading reviews-heading"><div><h2 id="reviews-title">Good words from<br /><em>good neighbors.</em></h2></div><p>Kind words from people we&apos;ve helped across Middle Tennessee.</p></div>
      <div className="review-grid">{testimonials.map((review) => <figure className="review-card" key={review.name}><span className="review-stars" aria-label="Five stars">★★★★★</span><blockquote>“{review.quote}”</blockquote><figcaption>{review.name}</figcaption></figure>)}</div>
    </div></section>
  );
}
