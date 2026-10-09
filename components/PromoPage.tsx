import Image from "next/image";
import Link from "next/link";
import PageHero from "./PageHero";
import ServiceRequestForm from "./ServiceRequestForm";
import Icon from "./Icon";
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

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <div className="relative overflow-hidden rounded-4xl shadow-xl shadow-brand-900/10">
              <Image
                src={image}
                alt={title}
                width={1400}
                height={700}
                className="h-64 w-full object-cover sm:h-80"
              />
              <div className="absolute inset-0 bg-linear-to-t from-ink/80 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7">
                <p className="text-4xl font-extrabold text-white sm:text-5xl">
                  {offer}
                </p>
                <p className="mt-1 text-sm font-bold uppercase tracking-[0.16em] text-flame-400">
                  {tagline}
                </p>
              </div>
            </div>

            <p className="mt-8 text-lg leading-relaxed text-slate-600">
              {blurb}
            </p>

            {code && (
              <div className="mt-7 flex flex-col gap-4 rounded-4xl border-2 border-dashed border-flame-300 bg-flame-50 p-7 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-flame-600">
                    Mention this code
                  </p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight text-ink">
                    {code}
                  </p>
                </div>
                <a
                  href={site.phoneHref}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-flame-500 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-flame-600"
                >
                  <Icon name="phone" className="h-4 w-4" />
                  {site.phone}
                </a>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={otherHref}
                className="group inline-flex items-center gap-2 rounded-full border-2 border-ink/10 px-6 py-3 text-sm font-bold text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
              >
                {otherLabel}
                <Icon
                  name="arrow"
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/promotions"
                className="inline-flex items-center gap-2 rounded-full border-2 border-ink/10 px-6 py-3 text-sm font-bold text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
              >
                All promotions
              </Link>
            </div>
          </div>

          <div className="lg:sticky lg:top-32">
            <ServiceRequestForm compact />
          </div>
        </div>
      </section>
    </>
  );
}
