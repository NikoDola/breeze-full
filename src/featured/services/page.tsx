import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/sections/PageHero";
import CtaBand from "@/components/sections/CtaBand";
import Icon from "@/components/ui/Icon";
import { services } from "@/lib/services";

export const metadata: Metadata = {
  title: "Professional HVAC Services",
  description:
    "Heating, cooling, repairs, indoor air quality, water heaters, mini-splits, energy audits and more — for homes and businesses across Middle Tennessee.",
};

export default function Page() {
  return (
    <>
      <PageHero
        title="Services"
        eyebrow="What we do"
        tagline="Professional HVAC Services — when it comes to indoor comfort, there's nothing we can't handle."
        image="/images/Repair-services.jpg"
      />

      <section className="services-section-1">
        <div className="services-layout-1">
          {services.map((s) => (
            <Link
              key={s.slug}
              href={`/${s.slug}`}
              className="services-link-1"
            >
              <div className="services-block-1">
                <Image
                  src={s.image}
                  alt={s.title}
                  width={800}
                  height={450}
                  className="services-image-1"
                />
                <div className="services-block-2" />
                <span className="services-badge-1">
                  <Icon name={s.icon} className="services-icon-1" />
                </span>
              </div>
              <div className="services-layout-2">
                <h2 className="services-heading-1">
                  {s.title}
                </h2>
                <p className="services-copy-1">
                  {s.tagline}
                </p>
                <p className="services-copy-2">
                  {s.blurb}
                </p>
                <span className="services-badge-2">
                  Read more
                  <Icon
                    name="arrow"
                    className="services-icon-2"
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
