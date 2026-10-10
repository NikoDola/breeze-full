import Image from "next/image";
import Link from "next/link";
import PageHero from "./PageHero";
import ServiceRequestForm from "./ServiceRequestForm";
import Icon from "@/components/ui/Icon";
import { site } from "@/lib/site";

export default function PromoPage({
  title,
  tagline,
  offer,
  code,
  image,
  icon,
  blurb,
  otherHref,
  otherLabel,
}: {
  title: string;
  tagline: string;
  offer: string;
  code?: string;
  image: string;
  icon: string;
  blurb: string;
  otherHref: string;
  otherLabel: string;
}) {
  return (
    <>
      <PageHero
        title={title}
        eyebrow="Promotions"
        tagline={tagline}
        icon={icon}
        image={image}
      />

      <section className="promo-page-section-1">
        <div className="promo-page-layout-1">
          <div>
            <div className="promo-page-card-1">
              <Image
                src={image}
                alt={title}
                width={1400}
                height={700}
                className="promo-page-image-1"
              />
              <div className="promo-page-block-1" />
              <div className="promo-page-block-2">
                <p className="promo-page-copy-1">
                  {offer}
                </p>
                <p className="promo-page-copy-2">
                  {tagline}
                </p>
              </div>
            </div>

            <p className="promo-page-copy-3">
              {blurb}
            </p>

            {code && (
              <div className="promo-page-layout-2">
                <div>
                  <p className="promo-page-copy-4">
                    Mention this code
                  </p>
                  <p className="promo-page-copy-5">
                    {code}
                  </p>
                </div>
                <a
                  href={site.phoneHref}
                  className="promo-page-button-1"
                >
                  <Icon name="phone" className="promo-page-icon-1" />
                  {site.phone}
                </a>
              </div>
            )}

            <div className="promo-page-layout-3">
              <Link
                href={otherHref}
                className="promo-page-button-2"
              >
                {otherLabel}
                <Icon
                  name="arrow"
                  className="promo-page-icon-2"
                />
              </Link>
              <Link
                href="/promotions"
                className="promo-page-button-3"
              >
                All promotions
              </Link>
            </div>
          </div>

          <div className="promo-page-block-3">
            <ServiceRequestForm compact />
          </div>
        </div>
      </section>
    </>
  );
}
