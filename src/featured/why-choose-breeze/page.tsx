import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import ExpertsContent from "@/components/sections/ExpertsContent";
import CtaBand from "@/components/sections/CtaBand";

export const metadata: Metadata = {
  title: "Why Choose Breeze",
  description:
    "Best in town, hands down. A small family owned company giving customers great service in a timely manner, at a reasonable price in Middle Tennessee.",
};

export default function Page() {
  return (
    <>
      <PageHero
        title="Why Choose Breeze"
        eyebrow="About us"
        tagline="BEST IN TOWN, HANDS DOWN!"
        icon="star"
        image="/images/Why-We-Should-At-Home.jpg"
      />
      <ExpertsContent
        related={[
          { label: "Meet the HVAC experts", href: "/meet-the-hvac-experts" },
          { label: "Going green", href: "/going-green" },
          { label: "About us", href: "/about-us" },
          { label: "Contact us", href: "/contact-us" },
        ]}
      />
      <CtaBand />
    </>
  );
}
