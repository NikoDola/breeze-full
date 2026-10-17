"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HomeDocument, HomeSlot } from "../../../cms/shared/home";
import type { GlobalDocument, ReviewsDocument } from "../../../cms/shared/collections";
import type { ContentDocument } from "../../../cms/shared/content";
import styles from "./editor.module.css";

type PreviewDocument = HomeDocument | GlobalDocument | ContentDocument | ReviewsDocument;
type Viewport = "desktop" | "tablet" | "mobile";

export default function HomePreviewFrame({ document, viewport, sectionId }: { document: PreviewDocument; viewport: Viewport; sectionId?: HomeSlot }) {
  const frame = useRef<HTMLIFrameElement>(null), container = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(640);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const width = { desktop: 1280, tablet: 768, mobile: 390 }[viewport];
  const scale = Math.min(1, available / width);
  const src = document.schemaVersion === 4 ? "/admin-test/preview?pageId=reviews" : document.schemaVersion === 6 ? `/admin-test/preview?pageId=${document.pageId}` : document.schemaVersion === 5 ? "/admin-test/preview?pageId=global" : "/admin-test/preview";
  const send = useCallback(() => frame.current?.contentWindow?.postMessage({
    type: document.schemaVersion === 6 || document.schemaVersion === 4 ? "breeze.cms.content-preview" : document.schemaVersion === 5 ? "breeze.cms.global-preview" : "breeze.cms.home-preview", document,
  }, window.location.origin), [document]);
  const focusSection = useCallback(() => {
    if (sectionId) frame.current?.contentWindow?.postMessage({ type: "breeze.cms.preview-focus", sectionId }, window.location.origin);
  }, [sectionId]);

  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(entries => setAvailable(Math.max(1, entries[0].contentRect.width)));
    observer.observe(container.current); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setStatus("loading");
    const timer = window.setTimeout(() => setStatus(current => current === "ready" ? current : "error"), 15000);
    return () => window.clearTimeout(timer);
  }, [src, attempt]);
  useEffect(() => {
    function ready(event: MessageEvent) {
      if (event.origin === window.location.origin && event.source === frame.current?.contentWindow && event.data?.type === "breeze.cms.preview-ready") {
        setStatus("ready");
        send();
        focusSection();
      }
    }
    window.addEventListener("message", ready);
    return () => window.removeEventListener("message", ready);
  }, [send, focusSection]);
  useEffect(() => { if (status === "ready") send(); }, [send, status]);
  useEffect(() => { if (status === "ready") focusSection(); }, [focusSection, status]);

  return <div className={styles.homePreviewCanvas} ref={container}>
    <iframe key={`${src}-${attempt}`} ref={frame} src={src}
      title={`${document.schemaVersion === 4 ? "Reviews" : document.schemaVersion === 6 ? document.title : document.schemaVersion === 5 ? "Contact areas" : "Homepage"} ${viewport} preview`} onLoad={send}
      className={styles.homePreviewFrame} style={{ width, height: 720 / scale, transform: `scale(${scale})` }} />
    {status !== "ready" && <div className={styles.previewLoading} role="status">
      <strong>{status === "loading" ? "Loading preview…" : "Preview could not load"}</strong>
      {status === "error" && <><p>Your edits are still here. Check the connection and try again.</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Reload preview</button></>}
    </div>}
  </div>;
}
