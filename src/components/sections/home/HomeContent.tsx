import HeroSection from "./HeroSection";
import SeasonsSection from "./SeasonsSection";
import ContactSection from "./ContactSection";
import ReviewsSection from "./ReviewsSection";
import AreaSection from "./AreaSection";
import type { HomeDocument } from "../../../../cms/shared/home";
import { favoriteReviews, type ReviewsDocument } from "../../../../cms/shared/collections";
import type { SiteData } from "@/lib/site";

// One fixed composition for public rendering and the protected editor preview.
// No wrapper elements or client-controlled ordering are introduced.
export default function HomeContent({ document, publication, reviews, site }: {
  document: HomeDocument; publication?: { revisionId: string; version: number };
  reviews?: ReviewsDocument; site?: SiteData;
}) {
  return <>
    <HeroSection site={site} />
    <SeasonsSection content={document.slots.seasons.content} publication={publication} />
    <ContactSection content={document.slots.contact.content} site={site} />
    <ReviewsSection content={reviews ? { ...document.slots.reviews.content, items: favoriteReviews(reviews) } : document.slots.reviews.content} />
    <AreaSection content={document.slots.area.content} />
  </>;
}
