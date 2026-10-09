import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import CtaBand from "@/components/CtaBand";
import Icon from "@/components/Icon";
import { services } from "@/lib/services";

export const metadata: Metadata = {
  title: "Professional HVAC Services",
  description:
    "Heating, cooling, repairs, indoor air quality, water heaters, mini-splits, energy audits and more — for homes and businesses across Middle Tennessee.",
};

export default function Page() {
  return (
    <>
      <PageHero
        title="Services"
        eyebrow="What we do"
        tagline="Professional HVAC Services — when it comes to indoor comfort, there's nothing we can't handle."
        image="/images/Repair-services.jpg"
      />

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Link
              key={s.slug}
              href={`/${s.slug}`}
              className="group flex flex-col overflow-hidden rounded-4xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10"
            >
              <div className="relative h-40 overflow-hidden bg-slate-100">
                <Image
                  src={s.image}
                  alt={s.title}
                  width={800}
                  height={450}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-ink/60 to-transparent" />
                <span className="absolute bottom-4 left-4 grid h-10 w-10 place-items-center rounded-2xl bg-flame-500 text-white shadow-lg">
                  <Icon name={s.icon} className="h-5 w-5" />
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h2 className="text-lg font-extrabold text-ink transition-colors group-hover:text-brand-600">
                  {s.title}
                </h2>
                <p className="mt-1 text-sm font-semibold text-flame-500">
                  {s.tagline}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                  {s.blurb}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600">
                  Read more
                  <Icon
                    name="arrow"
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
