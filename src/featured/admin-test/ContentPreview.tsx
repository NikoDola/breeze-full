"use client";
import { useEffect, useState } from "react";
import SiteProvider from "@/components/sections/SiteContext";
import SiteHeader from "@/components/sections/SiteHeader";
import SiteFooterContent from "@/components/sections/SiteFooterContent";
import ContentPageView, { type ServiceSummary } from "@/components/sections/ContentPageView";
import { validateContentDocument, type ContentDocument } from "../../../cms/shared/content";
import type { SiteData } from "@/lib/site";
import ReviewsContent from "@/components/sections/ReviewsContent";
import { favoriteReviews, validateReviews, type ReviewsDocument } from "../../../cms/shared/collections";
import ReviewsSection from "@/components/sections/home/ReviewsSection";
import { homeSeed } from "../../../cms/shared/home-seed";
import type { HomeDocument } from "../../../cms/shared/home";

export default function ContentPreview({ initialDocument, site, services, home = homeSeed }: { initialDocument: ContentDocument | ReviewsDocument; site: SiteData; services: ServiceSummary[]; home?: HomeDocument }) {
  const [document, setDocument] = useState(initialDocument);
  const [offerSlug, setOfferSlug] = useState("");
  const [reviewsView, setReviewsView] = useState<"page" | "home">("page");
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== "breeze.cms.content-preview") return;
      try { setDocument(initialDocument.schemaVersion === 4 ? validateReviews(event.data.document) : validateContentDocument(event.data.document, initialDocument.pageId)); } catch { /* Keep the last valid draft. */ }
    }
    const preventNavigation = (event: MouseEvent) => { if ((event.target as Element).closest("a")) event.preventDefault(); };
    const preventSubmit = (event: Event) => { event.preventDefault(); event.stopImmediatePropagation(); };
    window.addEventListener("message", receive);
    window.document.addEventListener("click", preventNavigation, true);
    window.document.addEventListener("submit", preventSubmit, true);
    window.parent.postMessage({ type: "breeze.cms.preview-ready" }, window.location.origin);
    return () => { window.removeEventListener("message", receive); window.document.removeEventListener("click", preventNavigation, true); window.document.removeEventListener("submit", preventSubmit, true); };
  }, [initialDocument]);
  return <SiteProvider value={site}>
    {document.schemaVersion === 4 && <nav aria-label="Review preview" style={{ padding: 16, background: "white" }}>{(["page", "home"] as const).map(view => <button type="button" key={view} aria-pressed={reviewsView === view} onClick={() => setReviewsView(view)} style={{ padding: 12 }}>{view === "page" ? "Client page" : "Homepage favorites"}</button>)}</nav>}
    {document.schemaVersion === 6 && document.pageId === "promotions" && <nav aria-label="Promotion preview" style={{ padding: 16, background: "white" }}>{[["", "All promotions"], ["winter-promotions", "Winter offer"], ["summer-promotions", "Summer offer"]].map(([id, label]) => <button type="button" key={id} aria-pressed={offerSlug === id} onClick={() => setOfferSlug(id)} style={{ padding: 12 }}>{label}</button>)}</nav>}
    <SiteHeader /><main id="main">{document.schemaVersion === 4 ? reviewsView === "home" ? <ReviewsSection content={{ ...home.slots.reviews.content, items: favoriteReviews(document) }} /> : <ReviewsContent document={document} site={site} /> : <ContentPageView preview document={document} site={site} services={services} offerSlug={offerSlug || undefined} />}</main><SiteFooterContent site={site} />
  </SiteProvider>;
}
