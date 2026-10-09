import Icon from "./Icon";
import { site } from "@/lib/site";

const items = [
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
    icon: "calendar",
    label: "Schedule",
    value: "an appointment",
    href: "/contact-us",
  },
];

/** The live site's three quick-contact tiles, directly under the hero. */
export default function Stats() {
  return (
    <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-5 lg:-mt-14 lg:px-8">
      <div className="grid gap-4 overflow-hidden rounded-4xl border border-slate-100 bg-white p-4 shadow-xl shadow-brand-900/5 sm:grid-cols-3 sm:gap-0 sm:p-0">
        {items.map((item, i) => (
          <a
            key={item.label}
            href={item.href}
            className={`group flex items-center gap-4 rounded-3xl p-6 transition-colors hover:bg-brand-50 sm:rounded-none ${
              i > 0 ? "sm:border-l sm:border-slate-100" : ""
            }`}
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
              <Icon name={item.icon} className="h-5.5 w-5.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                {item.label}
              </span>
              <span className="mt-0.5 block truncate text-lg font-extrabold text-ink transition-colors group-hover:text-brand-700">
                {item.value}
              </span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
