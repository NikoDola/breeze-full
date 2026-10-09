import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import CtaBand from "@/components/CtaBand";
import Icon from "@/components/Icon";
import {
  welcomeBlurb,
  nashvilleBest,
  companyHistory,
  ourPhilosophy,
  bestInTown,
} from "@/lib/company";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Family owned and operated for more than two decades. Breeze Heating & Cooling serves Nashville, Brentwood and Middle Tennessee with honesty, integrity and service.",
};

const values = [
  {
    icon: "shield",
    title: "Honesty",
    body: "No pressure, no upselling. We diagnose the real problem and recommend what actually solves it.",
  },
  {
    icon: "check",
    title: "Integrity",
    body: "We stand behind our work and guarantee our workmanship, on every residential and commercial job.",
  },
  {
    icon: "users",
    title: "Service",
    body: "We treat your property and family with respect, from the first call to the final walkthrough.",
  },
];

export default function Page() {
  return (
    <>
      <PageHero
        title="About us"
        eyebrow="Our story"
        tagline="1st Class Service With A Smile"
        icon="home"
        image="/images/Why-We-Should-At-Home.jpg"
      />

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Nashville&rsquo;s Best Heating and Cooling Company
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              {welcomeBlurb}
            </p>
            <p className="mt-4 leading-relaxed text-slate-600">
              {nashvilleBest}
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-4xl shadow-2xl shadow-brand-900/10">
              <Image
                src="/images/Why-We-Should-At-Home.jpg"
                alt="A family comfortable at home"
                width={1200}
                height={800}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-4 rounded-3xl bg-ink px-6 py-4 text-white shadow-xl">
              <p className="text-3xl font-extrabold leading-none text-flame-400">
                20+
              </p>
              <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-white/60">
                Years family owned
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* History & philosophy */}
      <section className="bg-slate-50 py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 lg:grid-cols-2 lg:px-8">
          {[companyHistory, ourPhilosophy].map((block, i) => (
            <article
              key={block.heading}
              className="rounded-4xl border border-slate-100 bg-white p-8 shadow-sm"
            >
              <span
                className={`grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg ${
                  i === 0
                    ? "bg-brand-600 shadow-brand-600/25"
                    : "bg-flame-500 shadow-flame-500/25"
                }`}
              >
                <Icon name={i === 0 ? "briefcase" : "star"} className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-xl font-extrabold text-ink">
                {block.heading}
              </h2>
              <p className="mt-3 leading-relaxed text-slate-600">{block.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Core values */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-flame-500">
            Our core values
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Honesty, integrity, and service
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {values.map((v) => (
            <div
              key={v.title}
              className="rounded-4xl border border-slate-100 p-7 text-center transition-shadow hover:shadow-lg hover:shadow-brand-900/5"
            >
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <Icon name={v.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-extrabold text-ink">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Owner */}
      <section className="bg-ink py-16 text-white lg:py-24">
        <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-flame-400">
            Meet the owner
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {bestInTown.heading}
          </h2>
          <p className="mt-6 leading-relaxed text-white/65">
            {bestInTown.body}
          </p>
          <Link
            href="/meet-the-hvac-experts"
            className="group mt-9 inline-flex items-center gap-2 rounded-full bg-flame-500 px-7 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-flame-600"
          >
            Meet the HVAC experts
            <Icon
              name="arrow"
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
