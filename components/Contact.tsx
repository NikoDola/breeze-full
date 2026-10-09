import Icon from "./Icon";
import ServiceRequestForm from "./ServiceRequestForm";
import { site } from "@/lib/site";

const details = [
  {
    icon: "phone",
    label: "Call us now!",
    value: site.phone,
    href: site.phoneHref,
  },
  {
    icon: "mail",
    label: "Drop us an email",
    value: site.email,
    href: site.emailHref,
  },
  {
    icon: "pin",
    label: "Visit us",
    value: site.addressLine,
    href: site.mapsHref,
  },
];

export default function Contact() {
  return (
    <section className="relative overflow-hidden bg-slate-50 py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-start gap-14 px-5 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-flame-500">
            Get in touch
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Request Service
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            {site.serviceArea}. Whether it&rsquo;s a tune-up, a full
            installation, or a 2am emergency, we&rsquo;re one call away.
          </p>

          <div className="mt-9 flex flex-col gap-3">
            {details.map((d) => (
              <a
                key={d.label}
                href={d.href}
                target={d.icon === "pin" ? "_blank" : undefined}
                rel={d.icon === "pin" ? "noreferrer" : undefined}
                className="group flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5"
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
                </span>
              </a>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-3xl bg-ink p-5 text-white">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-flame-500/15 text-flame-400">
              <Icon name="clock" className="h-5 w-5" />
            </span>
            <p className="text-sm leading-relaxed text-white/70">
              <strong className="font-bold text-white">24/7/365.</strong> In the
              event of an emergency, you&rsquo;ll speak with a real, live person
              — not a series of electronic prompts.
            </p>
          </div>
        </div>

        <ServiceRequestForm />
      </div>
    </section>
  );
}
