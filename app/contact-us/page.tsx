import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ServiceRequestForm from "@/components/ServiceRequestForm";
import Icon from "@/components/Icon";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Call ${site.phone} or email ${site.email}. Breeze Heating & Cooling, ${site.addressLine}. A live person answers 24/7.`,
};

const details = [
  {
    icon: "phone",
    label: "Call us now!",
    value: site.phone,
    href: site.phoneHref,
    note: "A live person answers 24/7/365.",
  },
  {
    icon: "mail",
    label: "Drop us an email",
    value: site.email,
    href: site.emailHref,
    note: "We reply during business hours.",
  },
  {
    icon: "pin",
    label: "Visit us",
    value: site.addressLine,
    href: site.mapsHref,
    note: "Serving Nashville & Middle Tennessee.",
  },
];

export default function Page() {
  return (
    <>
      <PageHero
        title="Contact us"
        eyebrow="Say hello to us"
        tagline="Get in touch — we'd love to discuss your project."
        icon="mail"
        image="/images/courtney-prather-431841-unsplash1.jpg"
      />

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Get in Touch
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              {site.serviceArea}. Whether it&rsquo;s a seasonal tune-up, a full
              system installation, or a 2am emergency, we&rsquo;re one call
              away.
            </p>

            <div className="mt-9 flex flex-col gap-3">
              {details.map((d) => (
                <a
                  key={d.label}
                  href={d.href}
                  target={d.icon === "pin" ? "_blank" : undefined}
                  rel={d.icon === "pin" ? "noreferrer" : undefined}
                  className="group flex items-start gap-4 rounded-3xl border border-slate-100 p-5 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50/40 hover:shadow-lg hover:shadow-brand-900/5"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <Icon name={d.icon} className="h-5.5 w-5.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                      {d.label}
                    </span>
                    <span className="mt-0.5 block font-extrabold text-ink">
                      {d.value}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {d.note}
                    </span>
                  </span>
                </a>
              ))}
            </div>

            <div className="mt-6 overflow-hidden rounded-4xl border border-slate-100">
              <iframe
                title={`Map to ${site.addressLine}`}
                src="https://www.openstreetmap.org/export/embed.html?bbox=-86.705%2C35.9345%2C-86.6485%2C35.9705&layer=mapnik&marker=35.9525%2C-86.6768"
                loading="lazy"
                className="h-64 w-full border-0"
              />
              <a
                href={site.mapsHref}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 bg-slate-50 px-5 py-4 transition-colors hover:bg-brand-50"
              >
                <span className="text-sm font-bold text-ink">
                  Get directions
                </span>
                <Icon name="arrow" className="h-4 w-4 text-brand-600" />
              </a>
            </div>
          </div>

          <ServiceRequestForm />
        </div>
      </section>

      <section className="bg-ink py-14 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-5 text-center lg:flex-row lg:justify-between lg:px-8 lg:text-left">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-flame-500/15 text-flame-400">
              <Icon name="bolt" className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-extrabold">
                Heat out? AC down? Don&rsquo;t wait.
              </p>
              <p className="text-sm text-white/60">
                Breeze technicians are on-call at all hours, 24/7/365.
              </p>
            </div>
          </div>
          <a
            href={site.phoneHref}
            className="inline-flex items-center gap-2 rounded-full bg-flame-500 px-7 py-3.5 text-sm font-extrabold text-white transition-transform hover:-translate-y-0.5 hover:bg-flame-600"
          >
            <Icon name="phone" className="h-4 w-4" />
            {site.phone}
          </a>
        </div>
      </section>
    </>
  );
}
