import HeroSection from "./HeroSection";
import SeasonsSection from "./SeasonsSection";
import ContactSection from "./ContactSection";
import ReviewsSection from "./ReviewsSection";
import AreaSection from "./AreaSection";
import type { HomeDocument } from "../../../../cms/shared/home";

// One fixed composition for public rendering and the protected editor preview.
// No wrapper elements or client-controlled ordering are introduced.
export default function HomeContent({ document, publication }: {
  document: HomeDocument; publication?: { revisionId: string; version: number };
}) {
  return <>
    <HeroSection />
    <SeasonsSection content={document.slots.seasons.content} publication={publication} />
    <ContactSection content={document.slots.contact.content} />
    <ReviewsSection content={document.slots.reviews.content} />
    <AreaSection content={document.slots.area.content} />
  </>;
}
