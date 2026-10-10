import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/sections/PageHero";
import CtaBand from "@/components/sections/CtaBand";
import Gallery, { type Shot } from "@/components/sections/Gallery";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "The systems Breeze Heating & Cooling installs, services and repairs across Middle Tennessee.",
};

/**
 * Captions describe the equipment and service type shown. The live site's
 * gallery mixes in stock landscape photography, which is excluded here — these
 * are the images that actually depict HVAC work.
 */
const shots: Shot[] = [
  { src: "/images/Guy-working.jpg", alt: "Mini-split condenser mounting" },
  { src: "/images/Repair-services.jpg", alt: "Indoor unit service call" },
  { src: "/images/minisplit1.jpg", alt: "Ductless mini-split head" },
  {
    src: "/images/Guy-water-heating-solution-full.jpg",
    alt: "Water heater inspection",
  },
  { src: "/images/air-condition.png", alt: "Outdoor condensing unit" },
  { src: "/images/Wifi.jpg", alt: "Wi-Fi and learning thermostats" },
  { src: "/images/purifier-1.png", alt: "Indoor air quality systems" },
  {
    src: "/images/commercial-and-industrial-icon-1.jpg",
    alt: "Commercial & industrial buildings we service",
  },
  {
    src: "/images/Why-We-Should-At-Home.jpg",
    alt: "Whole-home comfort, year round",
  },
];

export default function Page() {
  return (
    <>
      <PageHero
        title="Gallery"
        eyebrow="Our work"
        tagline="The systems we install, service and repair every day."
        icon="image"
        image="/images/Repair-services.jpg"
      />

      <section className="gallery-section-1">
        <Gallery shots={shots} />

        <p className="gallery-copy-1">
          Want to see what we&rsquo;d recommend for your home or building?{" "}
          <Link
            href="/contact-us"
            className="gallery-link-1"
          >
            Request a consultation
          </Link>
          .
        </p>
      </section>

      <CtaBand />
    </>
  );
}
