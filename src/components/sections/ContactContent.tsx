import PageHero from "./PageHero";
import Icon from "@/components/ui/Icon";
import { contentText as t, type ContentRecord } from "../../../cms/shared/content";
import type { SiteData } from "@/lib/site";
import ServiceRequestForm from "./ServiceRequestForm";
import ContactLocation from "./ContactLocation";
import { contentDefinitions } from "../../../cms/shared/content";
const design = contentDefinitions["contact-us"];
export default function ContactContent({ content: c, site, heroImage = design.image }: { content: ContentRecord; site: SiteData; heroImage?: string }) {

  const details = [
  {
    icon: "phone",
    label: t(c, "phoneLabel"),
    value: site.phone,
    href: site.phoneHref,
    note: t(c, "phoneNote"),
  },
  {
    icon: "mail",
    label: t(c, "emailLabel"),
    value: site.email,
    href: site.emailHref,
    note: t(c, "emailNote"),
  },
  {
    icon: "pin",
    label: t(c, "addressLabel"),
    value: site.addressLine,
    href: site.mapsHref,
    note: t(c, "addressNote"),
  },
];

  return (
    <>
      <PageHero title={t(c, "heading")} eyebrow={t(c, "eyebrow")} tagline={t(c, "tagline")} icon={design.icon} image={heroImage} />

      <section className="contact-us-section-1">
        <div className="contact-us-layout-1">
          <div>
            <h2 className="contact-us-heading-1">{t(c, "introHeading")}</h2>
            <p className="contact-us-copy-1">{t(c, "intro").replaceAll("{serviceArea}", site.serviceArea)}</p>

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

            <ContactLocation site={site} />
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
              <p className="contact-us-copy-2">{t(c, "emergencyHeading")}</p>
              <p className="contact-us-copy-3">{t(c, "emergencyBody")}</p>
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
