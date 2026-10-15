"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HomeDocument } from "../../../cms/shared/home";
import type { GlobalDocument, ReviewsDocument } from "../../../cms/shared/collections";
import type { ContentDocument } from "../../../cms/shared/content";
import styles from "./editor.module.css";

export default function HomePreviewFrame({ document, viewport }: { document: HomeDocument | GlobalDocument | ContentDocument | ReviewsDocument; viewport: "desktop" | "tablet" | "mobile" }) {
  const frame = useRef<HTMLIFrameElement>(null), container = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(640);
  const width = { desktop: 1280, tablet: 768, mobile: 390 }[viewport];
  const scale = Math.min(1, available / width);
  const send = useCallback(() => frame.current?.contentWindow?.postMessage({
    type: document.schemaVersion === 6 || document.schemaVersion === 4 ? "breeze.cms.content-preview" : document.schemaVersion === 5 ? "breeze.cms.global-preview" : "breeze.cms.home-preview", document,
  }, window.location.origin), [document]);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(entries => setAvailable(Math.max(1, entries[0].contentRect.width)));
    observer.observe(container.current); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    function ready(event: MessageEvent) {
      if (event.origin === window.location.origin && event.source === frame.current?.contentWindow && event.data?.type === "breeze.cms.preview-ready") send();
    }
    window.addEventListener("message", ready);
    const timer = window.setTimeout(send, 120);
    return () => { window.removeEventListener("message", ready); window.clearTimeout(timer); };
  }, [send]);
  return <div className={styles.homePreviewCanvas} ref={container}>
    <iframe ref={frame} src={document.schemaVersion === 4 ? "/admin-test/preview?pageId=reviews" : document.schemaVersion === 6 ? `/admin-test/preview?pageId=${document.pageId}` : document.schemaVersion === 5 ? "/admin-test/preview?pageId=global" : "/admin-test/preview"}
      title={`${document.schemaVersion === 4 ? "Reviews" : document.schemaVersion === 6 ? document.title : document.schemaVersion === 5 ? "Contact areas" : "Homepage"} ${viewport} live preview`} onLoad={send}
      className={styles.homePreviewFrame} style={{ width, height: 720 / scale, transform: `scale(${scale})` }} />
  </div>;
}
