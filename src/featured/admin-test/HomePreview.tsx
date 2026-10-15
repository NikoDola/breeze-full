"use client";

import { useEffect, useState } from "react";
import HomeContent from "@/components/sections/home/HomeContent";
import SiteHeader from "@/components/sections/SiteHeader";
import SiteFooterContent from "@/components/sections/SiteFooterContent";
import SiteProvider from "@/components/sections/SiteContext";
import GlobalPreview from "./GlobalPreview";
import { homeSeed } from "../../../cms/shared/home-seed";
import { validateHomeDocument, type HomeDocument } from "../../../cms/shared/home";
import { validateGlobal, type ReviewsDocument } from "../../../cms/shared/collections";
import { withGlobalSettings, type SiteData } from "@/lib/site";

export default function HomePreview({ reviews, site, initialDocument = homeSeed, mode = "home" }: { reviews?: ReviewsDocument; site: SiteData; initialDocument?: HomeDocument; mode?: "home" | "global" }) {
  const [content, setContent] = useState<HomeDocument>(initialDocument);
  const [previewSite, setPreviewSite] = useState(site);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      try {
        if (event.data?.type === "breeze.cms.home-preview") setContent(validateHomeDocument(event.data.document));
        else if (event.data?.type === "breeze.cms.global-preview") setPreviewSite(withGlobalSettings(validateGlobal(event.data.document)));
      } catch { /* Keep the last valid preview while fields are incomplete. */ }
    }
    function preventNavigation(event: MouseEvent) {
      if ((event.target as Element).closest("a")) event.preventDefault();
    }
    function preventSubmit(event: Event) { event.preventDefault(); event.stopImmediatePropagation(); }
    window.addEventListener("message", receive);
    document.addEventListener("click", preventNavigation, true);
    document.addEventListener("submit", preventSubmit, true);
    window.parent.postMessage({ type: "breeze.cms.preview-ready" }, window.location.origin);
    return () => {
      window.removeEventListener("message", receive);
      document.removeEventListener("click", preventNavigation, true);
      document.removeEventListener("submit", preventSubmit, true);
    };
  }, []);
  return <SiteProvider value={previewSite}>
    {mode === "global" ? <GlobalPreview site={previewSite} home={content} /> : <>
      <SiteHeader />
      <main id="main"><HomeContent document={content} reviews={reviews} site={previewSite} /></main>
      <SiteFooterContent site={previewSite} />
    </>}
  </SiteProvider>;
}
