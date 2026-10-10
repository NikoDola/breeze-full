import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/sections/PageHero";
import CtaBand from "@/components/sections/CtaBand";
import Icon from "@/components/ui/Icon";
import { promotions } from "@/lib/promotions";

export const metadata: Metadata = {
  title: "Promotions",
  description:
    "Seasonal savings from Breeze Heating & Cooling — winter and summer promotions for Middle Tennessee homeowners.",
};

const promos = promotions.map((p) => ({
  href: `/${p.slug}`,
  title: p.title,
  tagline: p.tagline,
  offer: p.offer,
  image: p.image,
  icon: p.icon,
}));

export default function Page() {
  return (
    <>
      <PageHero
        title="Promotions"
        eyebrow="Save with Breeze"
        tagline="Seasonal savings on the work you were going to book anyway."
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
            Promotions can be combined with{" "}
            <Link
              href="/financing"
              className="promotions-link-2"
            >
              monthly payment financing
            </Link>{" "}
            — and{" "}
            <Link
              href="/comfort-club"
              className="promotions-link-3"
            >
              Comfort Club
            </Link>{" "}
            members get priority service year-round.
          </p>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
