import Link from "next/link";
import Icon from "./Icon";
import { featuredReviews } from "@/lib/reviews";

export default function Reviews() {
  const shown = featuredReviews.slice(0, 6);

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-flame-500">
          Client reviews
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl lg:text-5xl">
          Loved by Middle Tennessee
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          Our commitment to ensuring our customers&rsquo; comfort has garnered
          the respect and loyalty of residents all around the area.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((r) => (
          <figure
            key={r.name}
            className="flex flex-col rounded-4xl border border-slate-100 bg-white p-7 shadow-sm transition-shadow hover:shadow-lg hover:shadow-brand-900/5"
          >
            <Icon name="quote" className="h-7 w-7 fill-brand-100 stroke-none" />
            <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">
              {r.text}
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-extrabold text-white">
                {r.name.charAt(0)}
              </span>
              <span>
                <span className="block text-sm font-bold text-ink">
                  {r.name}
                </span>
                <span className="mt-0.5 flex items-center gap-0.5 text-flame-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon key={i} name="star" className="h-3 w-3 fill-current" />
                  ))}
                </span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/reviews"
          className="group inline-flex items-center gap-2 rounded-full border-2 border-ink/10 px-7 py-3.5 text-sm font-bold text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
        >
          Read all reviews
          <Icon
            name="arrow"
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
          />
        </Link>
      </div>
    </section>
  );
}
