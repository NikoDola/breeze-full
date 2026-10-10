import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/sections/PageHero";
import ServiceRequestForm from "@/components/sections/ServiceRequestForm";
import Icon from "@/components/ui/Icon";
import { emergency } from "@/lib/company";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Emergency HVAC service",
  description:
    "Breeze technicians are on-call at all hours. A real, live person answers 24/7/365 — fast, friendly and affordable emergency HVAC service in Middle Tennessee.",
};

export default function Page() {
  return (
    <>
      <PageHero
        title="Emergency"
        eyebrow="24/7/365"
        tagline={emergency.tagline}
        icon="bolt"
        image="/images/Emergency-HVAC-Repair-Technician-1.jpg"
      />

      {/* Loud call strip, immediately under the hero */}
      <section className="emergency-section-1">
        <div className="emergency-layout-1">
          <p className="emergency-copy-1">
            System down right now? Don&rsquo;t wait — call us.
          </p>
          <a
            href={site.phoneHref}
            className="emergency-button-1"
          >
            <Icon name="phone" className="emergency-icon-1" />
            {site.phone}
          </a>
        </div>
      </section>

      <section className="emergency-section-2">
        <div className="emergency-layout-2">
          <div>
            <div className="emergency-block-1">
              {emergency.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>

            <h2 className="emergency-heading-1">
              {emergency.heading}
            </h2>
            <ul className="emergency-ul-1">
              {emergency.items.map((item) => (
                <li
                  key={item}
                  className="emergency-li-1"
                >
                  <Icon
                    name="check"
                    className="emergency-icon-2"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <div className="emergency-layout-3">
              {[
                {
                  icon: "phone",
                  title: "A live person",
                  body: "Not a frustrating series of electronic prompts.",
                },
                {
                  icon: "wrench",
                  title: "Fully stocked van",
                  body: "Dispatched ready to complete your service request.",
                },
                {
                  icon: "shield",
                  title: "All brands & models",
                  body: "Licensed, insured and certified to repair any system.",
                },
              ].map((f) => (
                <div key={f.title} className="emergency-card-1">
                  <span className="emergency-badge-1">
                    <Icon name={f.icon} className="emergency-icon-3" />
                  </span>
                  <h3 className="emergency-heading-2">
                    {f.title}
                  </h3>
                  <p className="emergency-copy-2">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>

            <p className="emergency-copy-3">
              Not an emergency?{" "}
              <Link
                href="/repairs-and-services"
                className="emergency-link-1"
              >
                See our repairs &amp; services
              </Link>{" "}
              or{" "}
              <Link
                href="/comfort-club"
                className="emergency-link-2"
              >
                join the Comfort Club
              </Link>{" "}
              to head off breakdowns before they happen.
            </p>
          </div>

          <div className="emergency-block-2">
            <ServiceRequestForm compact />
          </div>
        </div>
      </section>
    </>
  );
}
