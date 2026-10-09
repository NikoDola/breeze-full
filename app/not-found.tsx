import Link from "next/link";
import Icon from "@/components/Icon";
import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <section className="mx-auto grid max-w-3xl place-items-center px-5 py-24 text-center lg:py-32">
      <span className="grid h-16 w-16 place-items-center rounded-3xl bg-brand-50 text-brand-600">
        <Icon name="snowflake" className="h-8 w-8" />
      </span>
      <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-flame-500">
        404
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        This page went out cold.
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        We couldn&rsquo;t find what you were looking for — but we can definitely
        find your thermostat.
      </p>

      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-flame-500 px-7 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-flame-600"
        >
          Back home
        </Link>
        <Link
          href="/services"
          className="rounded-full border-2 border-ink/10 px-7 py-3 text-sm font-bold text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
        >
          All services
        </Link>
        <a
          href={site.phoneHref}
          className="inline-flex items-center gap-2 rounded-full border-2 border-ink/10 px-7 py-3 text-sm font-bold text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
        >
          <Icon name="phone" className="h-4 w-4 text-brand-600" />
          {site.phone}
        </a>
      </div>
    </section>
  );
}
