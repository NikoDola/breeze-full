"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HOUSECALL_PRO_FORM_URL, housecallHeight, housecallRedirect } from "@/lib/integrations/housecall-pro";
import { useSite } from "./SiteContext";
import styles from "./service-request-form.module.css";

export default function ServiceRequestForm({ compact = false }: { compact?: boolean }) {
  const site = useSite();
  const container = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const focusForm = useRef(false);
  const [active, setActive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const preview = usePathname()?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (preview || active || !container.current) return;
    const element = container.current;
    const load = () => setActive(true);
    const loadFromHash = () => {
      if (["#service-form", "#contact"].includes(window.location.hash)) load();
    };
    // Native iframe lazy loading can start thousands of pixels offscreen and
    // run the booking app, Stripe and reCAPTCHA during the homepage's first load.
    const observer = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) load();
    }, { rootMargin: "200px 0px" }) : null;
    observer?.observe(element);
    element.addEventListener("breeze:load-service-form", load);
    window.addEventListener("hashchange", loadFromHash);
    loadFromHash();
    return () => {
      observer?.disconnect();
      element.removeEventListener("breeze:load-service-form", load);
      window.removeEventListener("hashchange", loadFromHash);
    };
  }, [active, preview]);

  useEffect(() => {
    if (preview) return;
    function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === "breeze.hcp.resize") {
        const height = housecallHeight(event.data.height);
        if (height && frame.current) frame.current.style.height = `${height}px`;
      } else if (event.data?.type === "breeze.hcp.redirect") {
        const url = housecallRedirect(event.data.url, window.location.origin);
        if (url) window.location.assign(url);
      }
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [preview]);

  return <div ref={container} className={`contact-form ${styles.container}${compact ? " contact-form-compact" : ""}`} id="service-form" data-clarity-mask="true">
    <h3>Request service</h3>
    <p className="form-intro">A few details and we&rsquo;ll be on our way.</p>
    {preview ? <div className={styles.preview}>
      <strong>Housecall Pro service request form</strong>
      <p>The connected form appears here on the public website. Submissions are disabled in this preview.</p>
    </div> : <>
      <div className={styles.embed}>
        {active ? <>
          {!loaded && <p className={styles.loading} role="status">Loading service form…</p>}
          <iframe ref={frame} className={styles.frame} src="/integrations/housecall-pro.html" title="Request service from Breeze Heating and Cooling" height={900} onLoad={() => {
            setLoaded(true);
            frame.current?.contentWindow?.postMessage({ type: "breeze.hcp.measure" }, window.location.origin);
            if (focusForm.current) { frame.current?.focus(); focusForm.current = false; }
          }} />
        </> : <div className={styles.placeholder}>
          <button type="button" className="button orange" onClick={() => { focusForm.current = true; setActive(true); }}>Load service form</button>
        </div>}
      </div>
      <p className={`form-note ${styles.help}`}>Trouble viewing the form? <a href={HOUSECALL_PRO_FORM_URL} target="_blank" rel="noopener noreferrer">Open the service form in a new tab</a> or <a href={site.phoneHref}>call {site.phone}</a>.</p>
    </>}
    <p className={`form-note ${styles.help}`}>Your request is sent directly to Breeze through Housecall Pro. <Link href="/privacy-policy">Privacy Policy</Link>.</p>
  </div>;
}
