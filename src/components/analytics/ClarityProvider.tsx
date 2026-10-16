"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import styles from "./clarity.module.css";

const STORAGE_KEY = "breeze.analytics-consent.v1";
type Choice = "granted" | "denied";
const PrivacyContext = createContext<(() => void) | null>(null);

function denyClarityConsent() {
  const clarity = (window as Window & { clarity?: (...args: unknown[]) => void }).clarity;
  clarity?.("consentv2", { analytics_Storage: "denied", ad_Storage: "denied" });
  return Boolean(clarity);
}

// Consent is queued before the vendor tag loads. Advertising storage stays off.
const clarityBootstrap = `
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  c[a]("consentv2", {analytics_Storage:"granted", ad_Storage:"denied"});
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "yqwuzc6zfj");`;

export function PrivacyChoices() {
  const open = useContext(PrivacyContext);
  return open ? <button type="button" className={styles.privacyLink} onClick={open}>Privacy choices</button> : null;
}

export default function ClarityProvider({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let saved: string | null = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* Storage can be blocked. */ }
    if (saved === "granted" || saved === "denied") setChoice(saved);
    else setOpen(true);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    return () => {
      // Leaving the public layout for the CMS must also stop an already-loaded
      // tag. A client-side route change alone would leave its code running.
      if (denyClarityConsent()) window.location.reload();
    };
  }, [enabled]);

  function choose(next: Choice) {
    try { localStorage.setItem(STORAGE_KEY, next); } catch {
      // Removing a stale grant still works when storage writes hit their quota.
      if (next === "denied") {
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* Storage is blocked. */ }
      }
    }
    if (next === "denied" && choice === "granted") {
      denyClarityConsent();
      // Removing a script element does not stop its running code. Reload with
      // the saved denial so Clarity cannot continue in cookieless mode.
      setChoice(next);
      setOpen(false);
      window.location.reload();
      return;
    }
    setChoice(next);
    setOpen(false);
  }

  return <PrivacyContext.Provider value={enabled ? () => setOpen(true) : null}>
    {children}
    {enabled && choice === "granted" && <Script id="breeze-clarity" strategy="afterInteractive">{clarityBootstrap}</Script>}
    {enabled && open && <section className={styles.notice} aria-label="Analytics preferences">
      <h2>Your privacy choices</h2>
      <p>May we use Microsoft Clarity to understand visits and improve our website? Optional analytics helps us see how pages are used. You can change your choice in the footer. <Link href="/privacy-policy">Privacy Policy</Link>.</p>
      <div className={styles.actions}>
        <button type="button" onClick={() => choose("granted")}>Allow analytics</button>
        <button type="button" onClick={() => choose("denied")}>No thanks</button>
        {choice && <button type="button" onClick={() => setOpen(false)}>Close</button>}
      </div>
    </section>}
  </PrivacyContext.Provider>;
}
