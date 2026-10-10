import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import CtaBand from "@/components/sections/CtaBand";
import Icon from "@/components/ui/Icon";
import { reviews } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "What Middle Tennessee homeowners say about Breeze Heating & Cooling — in their own words.",
};

export default function Page() {
  return (
    <>
      <PageHero
        title="Reviews"
        eyebrow="Our clients"
        tagline="In their own words."
        icon="star"
        image="/images/Why-We-Should-At-Home.jpg"
      />

      <section className="reviews-section-1">
        <div className="reviews-block-1">
          {reviews.map((r) => (
            <figure
              key={r.name}
              className="reviews-figure-1"
            >
              <div className="reviews-layout-1">
                <Icon
                  name="quote"
                  className="reviews-icon-1"
                />
                <span className="reviews-text-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon
                      key={i}
                      name="star"
                      className="reviews-icon-2"
                    />
                  ))}
                </span>
              </div>

              <blockquote className="reviews-copy-1">
                {r.text}
              </blockquote>

              <figcaption className="reviews-figcaption-1">
                <span className="reviews-badge-1">
                  {r.name.charAt(0)}
                </span>
                <span className="reviews-text-2">{r.name}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
