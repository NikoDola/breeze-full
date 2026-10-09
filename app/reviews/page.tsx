import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import CtaBand from "@/components/CtaBand";
import Icon from "@/components/Icon";
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

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
          {reviews.map((r) => (
            <figure
              key={r.name}
              className="mb-6 break-inside-avoid rounded-4xl border border-slate-100 bg-white p-7 shadow-sm transition-shadow hover:shadow-lg hover:shadow-brand-900/5"
            >
              <div className="flex items-center justify-between">
                <Icon
                  name="quote"
                  className="h-7 w-7 fill-brand-100 stroke-none"
                />
                <span className="flex items-center gap-0.5 text-flame-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon
                      key={i}
                      name="star"
                      className="h-3.5 w-3.5 fill-current"
                    />
                  ))}
                </span>
              </div>

              <blockquote className="mt-4 text-sm leading-relaxed text-slate-600">
                {r.text}
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-extrabold text-white">
                  {r.name.charAt(0)}
                </span>
                <span className="text-sm font-bold text-ink">{r.name}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
