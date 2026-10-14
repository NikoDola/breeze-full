import { reviews } from "../../src/lib/reviews";
import site from "../../src/content/site.json";
import { homeSeed } from "./home-seed";
import type { HomeDocument } from "./home";
import { validateReviews, type GlobalDocument, type ReviewItem } from "./collections";

// Seed only. Existing imports, drafts and immutable revisions are never overwritten.
export function createReviewsSeed(home: HomeDocument = homeSeed) {
  const featured = home.slots.reviews.content.items;
  const items: ReviewItem[] = reviews.map((item, index) => ({ id: `review-${index + 1}`, name: item.name, quote: item.text, homeQuote: "", visible: true }));
  const used = new Set<string>();
  const favoriteIds = featured.map((item, index) => {
    let existing = items.find(review => review.name === item.name && !used.has(review.id));
    if (!existing) { existing = { id: `home-review-${index + 1}`, name: item.name, quote: item.quote, homeQuote: "", visible: true }; items.push(existing); }
    existing.homeQuote = item.quote;
    used.add(existing.id);
    return existing.id;
  });
  return validateReviews({ schemaVersion: 4, title: "Reviews", items, favoriteIds: favoriteIds.slice(0, 3) });
}

// The old social URLs are platform homepages, not client profiles; publish real profiles through Global.
export const globalSeed: GlobalDocument = { schemaVersion: 5, title: "Global settings", phone: site.phone, email: site.email, socials: [] };
