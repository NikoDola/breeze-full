import Image from "next/image";
import Link from "next/link";
import Icon from "./Icon";
import { services, featuredServiceSlugs } from "@/lib/services";

const featured = featuredServiceSlugs
  .map((slug) => services.find((s) => s.slug === slug)!)
  .filter(Boolean);

export default function Services() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-flame-500">
            What we do
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Professional HVAC Services
          </h2>
          <p className="mt-4 max-w-xl text-lg text-slate-600">
            When it comes to indoor comfort, there&rsquo;s nothing we
            can&rsquo;t handle.
          </p>
        </div>
        <Link
          href="/services"
          className="group inline-flex shrink-0 items-center gap-2 rounded-full border-2 border-ink/10 px-6 py-3 text-sm font-bold text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
        >
          View all services
          <Icon
            name="arrow"
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
          />
        </Link>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((s) => (
          <Link
            key={s.slug}
            href={`/${s.slug}`}
            className="group relative flex flex-col overflow-hidden rounded-4xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10"
          >
            <div className="relative h-44 overflow-hidden bg-slate-100">
              <Image
                src={s.image}
                alt={s.title}
                width={800}
                height={450}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-ink/60 to-transparent" />
              <span className="absolute bottom-4 left-4 grid h-11 w-11 place-items-center rounded-2xl bg-flame-500 text-white shadow-lg">
                <Icon name={s.icon} className="h-5.5 w-5.5" />
              </span>
            </div>

            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-lg font-extrabold text-ink transition-colors group-hover:text-brand-600">
                {s.title}
              </h3>
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
  );
}
