"use client";

import { useEffect, useState } from "react";
import HomeContent from "@/components/sections/home/HomeContent";
import { homeSeed } from "../../../cms/shared/home-seed";
import { validateHomeDocument } from "../../../cms/shared/home";

export default function HomePreview() {
  const [content, setContent] = useState(homeSeed);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== "breeze.cms.home-preview") return;
      try { setContent(validateHomeDocument(event.data.document)); } catch { /* Keep the last valid preview while fields are incomplete. */ }
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
  return <HomeContent document={content} />;
}
