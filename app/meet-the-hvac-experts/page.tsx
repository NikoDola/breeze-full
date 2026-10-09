import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ExpertsContent from "@/components/ExpertsContent";
import CtaBand from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "Meet the HVAC experts",
  description:
    "Breeze hires only the most qualified technicians. Every team member is certified by the North American Technician Excellence (NATE) organization.",
};

export default function Page() {
  return (
    <>
      <PageHero
        title="Meet the HVAC experts"
        eyebrow="About us"
        tagline="Say YES to the Best"
        icon="users"
        image="/images/Guy-working.jpg"
      />
      <ExpertsContent
        related={[
          { label: "Why Choose Breeze", href: "/why-choose-breeze" },
          { label: "Going green", href: "/going-green" },
          { label: "Careers", href: "/careers" },
          { label: "Contact us", href: "/contact-us" },
        ]}
      />
      <CtaBand />
    </>
  );
}
