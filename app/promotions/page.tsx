import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import CtaBand from "@/components/CtaBand";
import Icon from "@/components/Icon";
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

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          {promos.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group relative overflow-hidden rounded-4xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-900/15"
            >
              <Image
                src={p.image}
                alt={p.title}
                width={1200}
                height={700}
                className="h-80 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/60 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-flame-500 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white">
                  <Icon name={p.icon} className="h-3.5 w-3.5" />
                  {p.offer}
                </span>
                <h2 className="mt-4 text-3xl font-extrabold text-white">
                  {p.title}
                </h2>
                <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-white/70">
                  {p.tagline}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-flame-400">
                  See the offer
                  <Icon
                    name="arrow"
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-4xl border border-slate-100 bg-slate-50 p-7 text-center">
          <p className="text-sm text-slate-600">
            Promotions can be combined with{" "}
            <Link
              href="/financing"
              className="font-bold text-brand-600 underline underline-offset-2"
            >
              monthly payment financing
            </Link>{" "}
            — and{" "}
            <Link
              href="/comfort-club"
              className="font-bold text-brand-600 underline underline-offset-2"
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
