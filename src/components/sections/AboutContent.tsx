import Image from "next/image";
import Link from "next/link";
import PageHero from "./PageHero";
import CtaBandContent from "./CtaBandContent";
import Icon from "@/components/ui/Icon";
import { contentText as t, contentItems as items, type ContentRecord } from "../../../cms/shared/content";
import type { SiteData } from "@/lib/site";
import { contentDefinitions } from "../../../cms/shared/content";
const design = contentDefinitions["about-us"];
export default function AboutContent({ content: c, site, heroImage = design.image }: { content: ContentRecord; site: SiteData; heroImage?: string }) {
  const welcomeBlurb = t(c, "intro"), nashvilleBest = t(c, "body");
  const bestInTown = { heading: t(c, "ownerHeading"), body: t(c, "ownerBody") };
  const blocks = items(c, "stories").map(item => ({ id: t(item, "id"), heading: t(item, "heading"), body: t(item, "body") }));
  const values = items(c, "values").map(item => ({ id: t(item, "id"), title: t(item, "heading"), body: t(item, "body") }));

  return (
    <>
      <PageHero title={t(c, "heading")} eyebrow={t(c, "eyebrow")} tagline={t(c, "tagline")} icon={design.icon} image={heroImage} />

      <section className="about-us-section-1">
        <div className="about-us-layout-1">
          <div>
            <h2 className="about-us-heading-1">{t(c, "introHeading")}</h2>
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
              <p className="about-us-copy-3">{t(c, "badgeNumber")}</p>
              <p className="about-us-copy-4">{t(c, "badgeLabel")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* History & philosophy */}
      <section className="about-us-section-2">
        <div className="about-us-layout-2">
          {blocks.map((block, i) => (
            <article
              key={block.id}
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
          <p className="about-us-copy-6">{t(c, "valuesLabel")}</p>
          <h2 className="about-us-heading-3">{t(c, "valuesHeading")}</h2>
        </div>

        <div className="about-us-layout-3">
          {values.map((v, index) => (
            <div
              key={v.id}
              className="about-us-card-3"
            >
              <span className="about-us-badge-2">
                <Icon name={["shield", "check", "users"][index % 3]} className="about-us-icon-2" />
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
          <p className="about-us-copy-8">{t(c, "ownerLabel")}</p>
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
            {t(c, "ownerLink")}
            <Icon
              name="arrow"
              className="about-us-icon-3"
            />
          </Link>
        </div>
      </section>

      <CtaBandContent site={site} />
    </>
  );
}
