import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/sections/PageHero";
import CtaBand from "@/components/sections/CtaBand";
import Icon from "@/components/ui/Icon";
import {
  welcomeBlurb,
  nashvilleBest,
  companyHistory,
  ourPhilosophy,
  bestInTown,
} from "@/lib/company";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Family owned and operated for more than two decades. Breeze Heating & Cooling serves Nashville, Brentwood and Middle Tennessee with honesty, integrity and service.",
};

const values = [
  {
    icon: "shield",
    title: "Honesty",
    body: "No pressure, no upselling. We diagnose the real problem and recommend what actually solves it.",
  },
  {
    icon: "check",
    title: "Integrity",
    body: "We stand behind our work and guarantee our workmanship, on every residential and commercial job.",
  },
  {
    icon: "users",
    title: "Service",
    body: "We treat your property and family with respect, from the first call to the final walkthrough.",
  },
];

export default function Page() {
  return (
    <>
      <PageHero
        title="About us"
        eyebrow="Our story"
        tagline="1st Class Service With A Smile"
        icon="home"
        image="/images/Why-We-Should-At-Home.jpg"
      />

      <section className="about-us-section-1">
        <div className="about-us-layout-1">
          <div>
            <h2 className="about-us-heading-1">
              Nashville&rsquo;s Best Heating and Cooling Company
            </h2>
            <p className="about-us-copy-1">
              {welcomeBlurb}
            </p>
            <p className="about-us-copy-2">
              {nashvilleBest}
            </p>
          </div>

          <div className="about-us-block-1">
            <div className="about-us-card-1">
              <Image
                src="/images/Why-We-Should-At-Home.jpg"
                alt="A family comfortable at home"
                width={1200}
                height={800}
                className="about-us-image-1"
              />
            </div>
            <div className="about-us-card-2">
              <p className="about-us-copy-3">
                20+
              </p>
              <p className="about-us-copy-4">
                Years family owned
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* History & philosophy */}
      <section className="about-us-section-2">
        <div className="about-us-layout-2">
          {[companyHistory, ourPhilosophy].map((block, i) => (
            <article
              key={block.heading}
              className="about-us-article-1"
            >
              <span
                className={`about-us-badge-1 ${
                  i === 0
                    ? "about-us-badge-1-state-1-active"
                    : "about-us-badge-1-state-1-inactive"
                }`}
              >
                <Icon name={i === 0 ? "briefcase" : "star"} className="about-us-icon-1" />
              </span>
              <h2 className="about-us-heading-2">
                {block.heading}
              </h2>
              <p className="about-us-copy-5">{block.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Core values */}
      <section className="about-us-section-3">
        <div className="about-us-block-2">
          <p className="about-us-copy-6">
            Our core values
          </p>
          <h2 className="about-us-heading-3">
            Honesty, integrity, and service
          </h2>
        </div>

        <div className="about-us-layout-3">
          {values.map((v) => (
            <div
              key={v.title}
              className="about-us-card-3"
            >
              <span className="about-us-badge-2">
                <Icon name={v.icon} className="about-us-icon-2" />
              </span>
              <h3 className="about-us-heading-4">{v.title}</h3>
              <p className="about-us-copy-7">
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Owner */}
      <section className="about-us-section-4">
        <div className="about-us-block-3">
          <p className="about-us-copy-8">
            Meet the owner
          </p>
          <h2 className="about-us-heading-5">
            {bestInTown.heading}
          </h2>
          <p className="about-us-copy-9">
            {bestInTown.body}
          </p>
          <Link
            href="/meet-the-hvac-experts"
            className="about-us-button-1"
          >
            Meet the HVAC experts
            <Icon
              name="arrow"
              className="about-us-icon-3"
            />
          </Link>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
