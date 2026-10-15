"use client";

import { useState } from "react";
import SiteHeader from "@/components/sections/SiteHeader";
import SiteFooterContent from "@/components/sections/SiteFooterContent";
import HeroSection from "@/components/sections/home/HeroSection";
import ContactSection from "@/components/sections/home/ContactSection";
import type { SiteData } from "@/lib/site";
import type { HomeDocument } from "../../../cms/shared/home";
import styles from "./global-preview.module.css";
import ContactLocation from "@/components/sections/ContactLocation";
import CtaBandContent from "@/components/sections/CtaBandContent";

const locations = [
  { id: "footer", label: "Footer" }, { id: "header", label: "Header" },
  { id: "hero", label: "Hero" }, { id: "request", label: "Service request" },
  { id: "location", label: "Contact location" },
  { id: "cta", label: "Contact banner" },
] as const;

function Placement({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className={styles.placement}><h2 className={styles.label}>{title}</h2><div className={styles.example}>{children}</div></section>;
}

export default function GlobalPreview({ site, home }: { site: SiteData; home: HomeDocument }) {
  const [location, setLocation] = useState<(typeof locations)[number]["id"]>("footer");
  return <div className={styles.preview}>
    <div className={styles.controls}><h1>Where your contact details appear</h1>
      <p>Choose an area to see your details in the website design. Form requests go to {site.formRecipientEmail}.</p>
      <div className={styles.locations} role="group" aria-label="Contact preview location">{locations.map(item => <button
        key={item.id} type="button" aria-pressed={location === item.id} onClick={() => setLocation(item.id)}>{item.label}</button>)}</div>
    </div>
    {location === "footer" && <Placement title="Footer · Every page"><SiteFooterContent site={site} /></Placement>}
    {location === "header" && <Placement title="Header · Every page"><SiteHeader /></Placement>}
    {location === "hero" && <Placement title="Homepage · Hero call button"><HeroSection site={site} /></Placement>}
    {location === "request" && <Placement title="Homepage · Service request"><ContactSection content={home.slots.contact.content} site={site} /></Placement>}
    {location === "location" && <Placement title="Contact us · Business location"><p>{site.addressLine}, {site.address.country}</p><ContactLocation site={site} /></Placement>}
    {location === "cta" && <Placement title="Shared contact banner"><CtaBandContent site={site} /></Placement>}
  </div>;
}
