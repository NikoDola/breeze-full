import Link from "next/link";
import Logo from "./Logo";
import Icon from "./Icon";
import { site } from "@/lib/site";
import { services } from "@/lib/services";

const company = [
  { label: "About us", href: "/about-us" },
  { label: "Meet the HVAC experts", href: "/meet-the-hvac-experts" },
  { label: "Why Choose Breeze", href: "/why-choose-breeze" },
  { label: "Going green", href: "/going-green" },
  { label: "Careers", href: "/careers" },
  { label: "Contact us", href: "/contact-us" },
];

const clientLinks = [
  { label: "Reviews", href: "/reviews" },
  { label: "Gallery", href: "/gallery" },
  { label: "Promotions", href: "/promotions" },
  { label: "Financing", href: "/financing" },
  { label: "Comfort club", href: "/comfort-club" },
  { label: "Emergency service", href: "/emergency" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.07]"
        style={{ backgroundImage: "url(/images/bg_footer.jpg)" }}
      />
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-flame-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
              Where quality and service never go out of style. Family owned and
              operated, serving Middle Tennessee for more than two decades.
            </p>

            <div className="mt-6 flex flex-col gap-3 text-sm">
              <a
                href={site.phoneHref}
                className="group flex items-center gap-3 font-bold text-white transition-colors hover:text-flame-400"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-flame-500/15 text-flame-400 transition-colors group-hover:bg-flame-500 group-hover:text-white">
                  <Icon name="phone" className="h-4 w-4" />
                </span>
                {site.phone}
              </a>
              <a
                href={site.emailHref}
                className="group flex items-center gap-3 text-white/70 transition-colors hover:text-white"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/15 text-brand-300 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <Icon name="mail" className="h-4 w-4" />
                </span>
                {site.email}
              </a>
              <a
                href={site.mapsHref}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 text-white/70 transition-colors hover:text-white"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white/70 transition-colors group-hover:bg-white/20 group-hover:text-white">
                  <Icon name="pin" className="h-4 w-4" />
                </span>
                {site.addressLine}
              </a>
            </div>

            {site.socials.length > 0 && (
              <div className="mt-6 flex items-center gap-3">
                {site.socials.map((s) => (
                  <a
                    key={s.href}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white/70 transition-colors hover:bg-flame-500 hover:text-white"
                  >
                    <Icon name={s.platform} className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <FooterColumn
            title="HVAC Services"
            links={services
              .slice(0, 8)
              .map((s) => ({ label: s.title, href: `/${s.slug}` }))}
          />
          <FooterColumn title="For Clients" links={clientLinks} />
          <FooterColumn title="Company" links={company} />
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="/terms-and-conditions"
              className="transition-colors hover:text-white"
            >
              Terms &amp; Conditions
            </Link>
            <Link
              href="/privacy-policy"
              className="transition-colors hover:text-white"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-flame-400">
        {title}
      </h3>
      <ul className="mt-5 flex flex-col gap-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-white/60 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
