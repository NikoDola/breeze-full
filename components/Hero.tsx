import Image from "next/image";
import Link from "next/link";
import Icon from "./Icon";
import { site } from "@/lib/site";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-brand-50 via-white to-white pb-20 pt-14 lg:pb-28 lg:pt-20">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-flame-200/40 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 shadow-sm">
            <Icon name="star" className="h-3.5 w-3.5 fill-flame-500 text-flame-500" />
            {site.tagline}
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Nashville&rsquo;s best
            <span className="relative whitespace-nowrap">
              {" "}
              heating
              <svg
                viewBox="0 0 300 12"
                fill="none"
                preserveAspectRatio="none"
                className="absolute inset-x-0 -bottom-1 h-2.5 w-full text-flame-500"
                aria-hidden="true"
              >
                <path
                  d="M2 8c60-5 120-6 180-4s90 4 116 2"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            and cooling company.
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-600">
            Welcome to Breeze Heating &amp; Cooling: where quality and service
            never go out of style. Serving Middle Tennessee, Breeze delivers
            client-focused service. Throughout every visit, we treat your
            property and family with respect.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/contact-us"
              className="group inline-flex items-center gap-2 rounded-full bg-flame-500 px-7 py-4 text-base font-bold text-white shadow-xl shadow-flame-500/25 transition-transform hover:-translate-y-0.5 hover:bg-flame-600"
            >
              Schedule Service
              <Icon
                name="arrow"
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
              />
            </Link>
            <a
              href={site.phoneHref}
              className="inline-flex items-center gap-2 rounded-full border-2 border-ink/10 bg-white px-7 py-3.5 text-base font-bold text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
            >
              <Icon name="phone" className="h-5 w-5 text-brand-600" />
              {site.phone}
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm font-semibold text-slate-500">
            {[
              "NATE-certified technicians",
              "24/7 emergency service",
              "Family owned & operated",
            ].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <Icon name="check" className="h-4.5 w-4.5 text-brand-600" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative reveal" style={{ animationDelay: "0.12s" }}>
          <div className="relative aspect-5/4 overflow-hidden rounded-4xl bg-brand-50 shadow-2xl shadow-brand-900/10">
            <Image
              src="/images/Guy-working.jpg"
              alt="A Breeze technician installing a mini-split condenser"
              width={1200}
              height={600}
              priority
              className="h-full w-full object-cover object-left"
            />
          </div>

          {/* Floating stat card */}
          <div className="absolute -bottom-6 left-4 w-56 rounded-3xl border border-slate-100 bg-white p-5 shadow-xl sm:-left-8">
            <div className="flex items-center gap-1 text-flame-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon key={i} name="star" className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="mt-2 text-sm font-bold leading-snug text-ink">
              &ldquo;Simply the best HVAC Company that I dealt with in the last
              20 years.&rdquo;
            </p>
            <p className="mt-1.5 text-xs font-semibold text-slate-400">
              John &amp; Michele Tarrillio
            </p>
          </div>

          <div className="absolute -right-3 -top-4 hidden rounded-2xl bg-ink px-5 py-3 text-white shadow-xl sm:block">
            <p className="text-2xl font-extrabold leading-none text-flame-400">
              20+
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/60">
              Years in Tennessee
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
