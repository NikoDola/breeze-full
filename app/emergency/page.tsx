import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import ServiceRequestForm from "@/components/ServiceRequestForm";
import Icon from "@/components/Icon";
import { emergency } from "@/lib/company";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Emergency HVAC service",
  description:
    "Breeze technicians are on-call at all hours. A real, live person answers 24/7/365 — fast, friendly and affordable emergency HVAC service in Middle Tennessee.",
};

export default function Page() {
  return (
    <>
      <PageHero
        title="Emergency"
        eyebrow="24/7/365"
        tagline={emergency.tagline}
        icon="bolt"
        image="/images/Emergency-HVAC-Repair-Technician-1.jpg"
      />

      {/* Loud call strip, immediately under the hero */}
      <section className="bg-flame-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-6 text-center sm:flex-row sm:text-left lg:px-8">
          <p className="text-lg font-extrabold text-white">
            System down right now? Don&rsquo;t wait — call us.
          </p>
          <a
            href={site.phoneHref}
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-extrabold text-flame-600 shadow-lg transition-transform hover:-translate-y-0.5"
          >
            <Icon name="phone" className="h-5 w-5" />
            {site.phone}
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <div className="prose-breeze max-w-none">
              {emergency.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>

            <h2 className="mt-10 text-xl font-extrabold text-ink">
              {emergency.heading}
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {emergency.items.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 px-4 py-3.5 text-sm font-semibold text-slate-700"
                >
                  <Icon
                    name="check"
                    className="h-5 w-5 shrink-0 text-flame-500"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: "phone",
                  title: "A live person",
                  body: "Not a frustrating series of electronic prompts.",
                },
                {
                  icon: "wrench",
                  title: "Fully stocked van",
                  body: "Dispatched ready to complete your service request.",
                },
                {
                  icon: "shield",
                  title: "All brands & models",
                  body: "Licensed, insured and certified to repair any system.",
                },
              ].map((f) => (
                <div key={f.title} className="rounded-3xl bg-slate-50 p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm">
                    <Icon name={f.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3.5 text-sm font-extrabold text-ink">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-10 text-sm text-slate-500">
              Not an emergency?{" "}
              <Link
                href="/repairs-and-services"
                className="font-bold text-brand-600 underline underline-offset-2"
              >
                See our repairs &amp; services
              </Link>{" "}
              or{" "}
              <Link
                href="/comfort-club"
                className="font-bold text-brand-600 underline underline-offset-2"
              >
                join the Comfort Club
              </Link>{" "}
              to head off breakdowns before they happen.
            </p>
          </div>

          <div className="lg:sticky lg:top-32">
            <ServiceRequestForm compact />
          </div>
        </div>
      </section>
    </>
  );
}
