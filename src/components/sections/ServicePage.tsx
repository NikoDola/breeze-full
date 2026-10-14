import Link from "next/link";
import Icon from "@/components/ui/Icon";
import PageHero from "./PageHero";
import CtaBand from "./CtaBand";
import ServiceNavigation from "./ServiceNavigation";
import { services, type Service } from "@/lib/services";
import { getSite } from "@/lib/cms/site";

export default async function ServicePage({ service }: { service: Service }) {
  const site = await getSite();
  const contactText = (text: string) => text.replaceAll("{phone}", site.phone).replaceAll("{email}", site.email);
  const others = services.filter((s) => s.slug !== service.slug);

  return (
    <>
      <PageHero
        title={service.title}
        tagline={service.tagline}
        eyebrow="HVAC Services"
        icon={service.icon}
        image={service.image}
        parallax
      />

      <section className="service-page-section-1">
        <div className="service-page-layout-1">
          {/* Body copy */}
          <div>
            <div className="service-page-block-1">
              {service.blocks.map((block, i) => {
                if (block.type === "h3") {
                  return <h3 key={i}>{contactText(block.text)}</h3>;
                }
                if (block.type === "p") {
                  return <p key={i}>{contactText(block.text)}</p>;
                }
                return (
                  <ul key={i}>
                    {block.items.map((item) => (
                      <li key={item}>{contactText(item)}</li>
                    ))}
                  </ul>
                );
              })}
            </div>
          </div>

          <div className="service-page-callouts">
            {/* Schedule it */}
            <div className="service-page-card-2">
              <div className="service-page-layout-2">
                <span className="service-page-badge-1">
                  <Icon name="calendar" className="service-page-icon-1" />
                </span>
                <div>
                  <h3 className="service-page-heading-1">
                    Schedule it
                  </h3>
                  <p className="service-page-copy-1">
                    {contactText(service.scheduleIt)}
                  </p>
                  <div className="service-page-layout-3">
                    <a
                      href={site.phoneHref}
                      className="service-page-button-1"
                    >
                      <Icon name="phone" className="service-page-icon-2" />
                      {site.phone}
                    </a>
                    <Link
                      href="/contact-us"
                      className="service-page-button-2"
                    >
                      Request service
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="service-page-card-3">
              <span className="service-page-badge-3">
                <Icon name="bolt" className="service-page-icon-4" />
              </span>
              <h3 className="service-page-heading-3">
                Emergency? We never sleep.
              </h3>
              <p className="service-page-copy-2">
                A Breeze representative is available 24/7/365 to answer your
                call — a real, live person.
              </p>
              <Link
                href="/emergency"
                className="service-page-link-2"
              >
                Emergency service
                <Icon name="arrow" className="service-page-icon-5" />
              </Link>
            </div>
          </div>
          <ServiceNavigation services={others.map(({ slug, title, icon }) => ({ slug, title, icon }))} />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
