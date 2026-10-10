import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import ServiceRequestForm from "@/components/sections/ServiceRequestForm";
import Icon from "@/components/ui/Icon";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Call ${site.phone} or email ${site.email}. Breeze Heating & Cooling, ${site.addressLine}. A live person answers 24/7.`,
};

const details = [
  {
    icon: "phone",
    label: "Call us now!",
    value: site.phone,
    href: site.phoneHref,
    note: "A live person answers 24/7/365.",
  },
  {
    icon: "mail",
    label: "Drop us an email",
    value: site.email,
    href: site.emailHref,
    note: "We reply during business hours.",
  },
  {
    icon: "pin",
    label: "Visit us",
    value: site.addressLine,
    href: site.mapsHref,
    note: "Serving Nashville & Middle Tennessee.",
  },
];

export default function Page() {
  return (
    <>
      <PageHero
        title="Contact us"
        eyebrow="Say hello to us"
        tagline="Get in touch — we'd love to discuss your project."
        icon="mail"
        image="/images/courtney-prather-431841-unsplash1.jpg"
      />

      <section className="contact-us-section-1">
        <div className="contact-us-layout-1">
          <div>
            <h2 className="contact-us-heading-1">
              Get in Touch
            </h2>
            <p className="contact-us-copy-1">
              {site.serviceArea}. Whether it&rsquo;s a seasonal tune-up, a full
              system installation, or a 2am emergency, we&rsquo;re one call
              away.
            </p>

            <div className="contact-us-layout-2">
              {details.map((d) => (
                <a
                  key={d.label}
                  href={d.href}
                  target={d.icon === "pin" ? "_blank" : undefined}
                  rel={d.icon === "pin" ? "noreferrer" : undefined}
                  className="contact-us-button-1"
                >
                  <span className="contact-us-badge-1">
                    <Icon name={d.icon} className="contact-us-icon-1" />
                  </span>
                  <span className="contact-us-text-1">
                    <span className="contact-us-text-2">
                      {d.label}
                    </span>
                    <span className="contact-us-text-3">
                      {d.value}
                    </span>
                    <span className="contact-us-text-4">
                      {d.note}
                    </span>
                  </span>
                </a>
              ))}
            </div>

            <div className="contact-us-card-1">
              <iframe
                title={`Map to ${site.addressLine}`}
                src="https://www.openstreetmap.org/export/embed.html?bbox=-86.705%2C35.9345%2C-86.6485%2C35.9705&layer=mapnik&marker=35.9525%2C-86.6768"
                loading="lazy"
                className="contact-us-iframe-1"
              />
              <a
                href={site.mapsHref}
                target="_blank"
                rel="noreferrer"
                className="contact-us-button-2"
              >
                <span className="contact-us-text-5">
                  Get directions
                </span>
                <Icon name="arrow" className="contact-us-icon-2" />
              </a>
            </div>
          </div>

          <ServiceRequestForm />
        </div>
      </section>

      <section className="contact-us-section-2">
        <div className="contact-us-layout-3">
          <div className="contact-us-layout-4">
            <span className="contact-us-badge-2">
              <Icon name="bolt" className="contact-us-icon-3" />
            </span>
            <div>
              <p className="contact-us-copy-2">
                Heat out? AC down? Don&rsquo;t wait.
              </p>
              <p className="contact-us-copy-3">
                Breeze technicians are on-call at all hours, 24/7/365.
              </p>
            </div>
          </div>
          <a
            href={site.phoneHref}
            className="contact-us-button-3"
          >
            <Icon name="phone" className="contact-us-icon-4" />
            {site.phone}
          </a>
        </div>
      </section>
    </>
  );
}
