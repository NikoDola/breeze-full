"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HomeDocument } from "../../../cms/shared/home";
import styles from "./editor.module.css";

export default function HomePreviewFrame({ document, viewport }: { document: HomeDocument; viewport: "desktop" | "tablet" | "mobile" }) {
  const frame = useRef<HTMLIFrameElement>(null), container = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(640);
  const width = { desktop: 1280, tablet: 768, mobile: 390 }[viewport];
  const scale = Math.min(1, available / width);
  const send = useCallback(() => frame.current?.contentWindow?.postMessage({ type: "breeze.cms.home-preview", document }, window.location.origin), [document]);
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
    <iframe ref={frame} src="/admin-test/preview" title={`Homepage ${viewport} live preview`} onLoad={send}
      className={styles.homePreviewFrame} style={{ width, height: 720 / scale, transform: `scale(${scale})` }} />
  </div>;
}
