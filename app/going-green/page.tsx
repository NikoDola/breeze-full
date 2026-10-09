import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ExpertsContent from "@/components/ExpertsContent";
import CtaBand from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "Going green",
  description:
    "The most energy-efficient products in the industry, installed right — so your system costs less to run and lasts longer.",
};

export default function Page() {
  return (
    <>
      <PageHero
        title="Going green"
        eyebrow="About us"
        tagline="The most energy-efficient products in the industry"
        icon="leaf"
        image="/images/mass-energy-audit.png"
      />
      <ExpertsContent
        related={[
          { label: "Energy audits", href: "/energy-audits" },
          { label: "Why Choose Breeze", href: "/why-choose-breeze" },
          { label: "Meet the HVAC experts", href: "/meet-the-hvac-experts" },
          { label: "Contact us", href: "/contact-us" },
        ]}
      />
      <CtaBand />
    </>
  );
}
