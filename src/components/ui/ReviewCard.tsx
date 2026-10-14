type ReviewCardProps = {
  name: string;
  quote: string;
  collapsible?: boolean;
};

export default function ReviewCard({ name, quote, collapsible = false }: ReviewCardProps) {
  const longQuote = collapsible && quote.length > 280;
  const excerpt = longQuote ? quote.slice(0, 240).replace(/\s+\S*$/, "") : quote;

  return <figure className="review-card">
    <span className="review-stars" aria-label="Five stars">★★★★★</span>
    {longQuote ? <>
      <blockquote className="review-excerpt">“{excerpt}…”</blockquote>
      <details className="review-details">
        <summary>
          <span className="review-expand-label">Read full review <span aria-hidden="true">+</span></span>
          <span className="review-collapse-label">Show less <span aria-hidden="true">−</span></span>
        </summary>
        <blockquote>“{quote}”</blockquote>
      </details>
    </> : <blockquote>“{quote}”</blockquote>}
    <figcaption>{name}</figcaption>
  </figure>;
}
