import Image from "next/image";
import Link from "next/link";
import Icon from "./Icon";
import PageHero from "./PageHero";
import CtaBand from "./CtaBand";
import { services, type Service } from "@/lib/services";
import { site } from "@/lib/site";

export default function ServicePage({ service }: { service: Service }) {
  const others = services.filter((s) => s.slug !== service.slug);

  return (
    <>
      <PageHero
        title={service.title}
        tagline={service.tagline}
        eyebrow="HVAC Services"
        icon={service.icon}
        image={service.image}
      />

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* Body copy */}
          <div>
            <div className="relative mb-10 overflow-hidden rounded-4xl border border-slate-100 bg-slate-50">
              <Image
                src={service.image}
                alt={service.title}
                width={1200}
                height={640}
                className="h-56 w-full object-cover sm:h-80"
              />
            </div>

            <div className="prose-breeze max-w-none">
              {service.blocks.map((block, i) => {
                if (block.type === "h3") {
                  return <h3 key={i}>{block.text}</h3>;
                }
                if (block.type === "p") {
                  return <p key={i}>{block.text}</p>;
                }
                return (
                  <ul key={i}>
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                );
              })}
            </div>

            {/* Schedule it */}
            <div className="mt-10 overflow-hidden rounded-4xl border border-flame-100 bg-flame-50">
              <div className="flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:gap-7">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-flame-500 text-white shadow-lg shadow-flame-500/30">
                  <Icon name="calendar" className="h-7 w-7" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-ink">
                    Schedule it
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {service.scheduleIt}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href={site.phoneHref}
                      className="inline-flex items-center gap-2 rounded-full bg-flame-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-flame-600"
                    >
                      <Icon name="phone" className="h-4 w-4" />
                      {site.phone}
                    </a>
                    <Link
                      href="/contact-us"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
                    >
                      Request service
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: other services */}
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Other services
            </h2>
            <nav className="mt-4 flex flex-col gap-1.5">
              {others.map((s) => (
                <Link
                  key={s.slug}
                  href={`/${s.slug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 transition-all hover:border-slate-100 hover:bg-slate-50"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <Icon name={s.icon} className="h-4.5 w-4.5" />
                  </span>
                  <span className="text-sm font-semibold text-slate-600 transition-colors group-hover:text-ink">
                    {s.title}
                  </span>
                </Link>
              ))}
            </nav>

            <div className="mt-8 overflow-hidden rounded-4xl bg-ink p-6 text-white">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-flame-500/15 text-flame-400">
                <Icon name="bolt" className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-extrabold">
                Emergency? We never sleep.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                A Breeze representative is available 24/7/365 to answer your
                call — a real, live person.
              </p>
              <Link
                href="/emergency"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-flame-400 transition-colors hover:text-flame-300"
              >
                Emergency service
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
