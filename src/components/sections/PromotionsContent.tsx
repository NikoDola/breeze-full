import Image from "next/image";
import Link from "next/link";
import PageHero from "./PageHero";
import CtaBandContent from "./CtaBandContent";
import PromoPageContent from "./PromoPageContent";
import Icon from "@/components/ui/Icon";
import type { SiteData } from "@/lib/site";
import { contentText as t, contentItems as items, type ContentDocument } from "../../../cms/shared/content";
import promotionSource from "@/content/promotions.json";

export default function PromotionsContent({ document, site, offerSlug }: { document: ContentDocument; site: SiteData; offerSlug?: string }) {
  const c = document.content;
  const promos = items(c, "offers").map(item => { const design = promotionSource.items.find(offer => offer.slug === t(item, "id"))!; return { href: '/' + design.slug, title: t(item, "heading"), tagline: t(item, "tagline"), offer: t(item, "offer"), image: design.image, icon: design.icon }; });
  if (offerSlug) {
    const item = items(c, "offers").find(item => item.id === offerSlug)!;
    const design = promotionSource.items.find(item => item.slug === offerSlug)!;
    return <PromoPageContent site={site} title={t(item, "heading")} tagline={t(item, "tagline")} offer={t(item, "offer")} code={t(item, "code")} image={design.image} icon={design.icon} blurb={t(item, "body")} otherHref={design.otherHref} otherLabel={t(item, "relatedLabel")} />;
  }
  return (
    <>
      <PageHero
        title={t(c, "heading")}
        eyebrow={t(c, "eyebrow")}
        tagline={t(c, "tagline")}
        icon="tag"
        image="/images/summer-promotions.jpg"
      />

      <section className="promotions-section-1">
        <div className="promotions-layout-1">
          {promos.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="promotions-link-1"
            >
              <Image
                src={p.image}
                alt={p.title}
                width={1200}
                height={700}
                className="promotions-image-1"
              />
              <div className="promotions-block-1" />

              <div className="promotions-block-2">
                <span className="promotions-badge-1">
                  <Icon name={p.icon} className="promotions-icon-1" />
                  {p.offer}
                </span>
                <h2 className="promotions-heading-1">
                  {p.title}
                </h2>
                <p className="promotions-copy-1">
                  {p.tagline}
                </p>
                <span className="promotions-badge-2">
                  See the offer
                  <Icon
                    name="arrow"
                    className="promotions-icon-2"
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="promotions-card-1">
          <p className="promotions-copy-2">
            {t(c, "noticeStart")}{" "}
            <Link
              href="/financing"
              className="promotions-link-2"
            >
              {t(c, "financingLabel")}
            </Link>{" "}
            {t(c, "noticeMiddle")}{" "}
            <Link
              href="/comfort-club"
              className="promotions-link-3"
            >
              {t(c, "clubLabel")}
            </Link>{" "}
            {t(c, "noticeEnd")}
          </p>
        </div>
      </section>

      <CtaBandContent site={site} />
    </>
  );
}
