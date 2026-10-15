import Link from "next/link";
import PageHero from "./PageHero";
import Icon from "@/components/ui/Icon";
import { contentText as t, contentItems as items, type ContentRecord } from "../../../cms/shared/content";
import type { SiteData } from "@/lib/site";
import ServiceRequestForm from "./ServiceRequestForm";
import { contentDefinitions } from "../../../cms/shared/content";
const design = contentDefinitions["emergency"];
export default function EmergencyContent({ content: c, site }: { content: ContentRecord; site: SiteData }) {
  const emergency = { tagline: t(c, "tagline"), paragraphs: t(c, "body").split("\n\n"), heading: t(c, "listHeading"), items: t(c, "items").split("\n").filter(Boolean) };
  const features = items(c, "features").map(item => ({ id: t(item, "id"), title: t(item, "heading"), body: t(item, "body") }));

  return (
    <>
      <PageHero title={t(c, "heading")} eyebrow={t(c, "eyebrow")} tagline={t(c, "tagline")} icon={design.icon} image={design.image} />

      {/* Loud call strip, immediately under the hero */}
      <section className="emergency-section-1">
        <div className="emergency-layout-1">
          <p className="emergency-copy-1">{t(c, "callStrip")}</p>
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
              {features.map((f, index) => (
                <div key={f.id} className="emergency-card-1">
                  <span className="emergency-badge-1">
                    <Icon name={["phone", "wrench", "shield"][index % 3]} className="emergency-icon-3" />
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
              {t(c, "noteStart")}{" "}
              <Link
                href="/repairs-and-services"
                className="emergency-link-1"
              >
                {t(c, "repairsLink")}
              </Link>{" "}
              or{" "}
              <Link
                href="/comfort-club"
                className="emergency-link-2"
              >
                {t(c, "clubLink")}
              </Link>{" "}
              {t(c, "noteEnd")}
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
