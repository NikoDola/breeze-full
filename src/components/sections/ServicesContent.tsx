import Image from "next/image";
import Link from "next/link";
import PageHero from "./PageHero";
import CtaBandContent from "./CtaBandContent";
import Icon from "@/components/ui/Icon";
import { contentText as t, type ContentRecord } from "../../../cms/shared/content";
import type { SiteData } from "@/lib/site";
import type { ServiceSummary } from "./ContentPageView";
import { contentDefinitions } from "../../../cms/shared/content";
const design = contentDefinitions["services"];
export default function ServicesContent({ content: c, site, services, heroImage = design.image }: { content: ContentRecord; site: SiteData; services: ServiceSummary[]; heroImage?: string }) {

  return (
    <>
      <PageHero title={t(c, "heading")} eyebrow={t(c, "eyebrow")} tagline={t(c, "tagline")} icon={design.icon} image={heroImage} />

      <section className="services-section-1">
        <div className="services-layout-1">
          {services.map((s) => (
            <Link
              key={s.slug}
              data-cms-page={s.revisionId ? s.slug : undefined} data-cms-revision={s.revisionId} data-cms-version={s.version}
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

      <CtaBandContent site={site} />
    </>
  );
}
