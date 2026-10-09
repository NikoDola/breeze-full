import Image from "next/image";
import Link from "next/link";
import Icon from "./Icon";
import { bestInTown, sayYesToTheBest, longAndShort } from "@/lib/company";

/**
 * /why-choose-breeze, /meet-the-hvac-experts and /going-green publish identical
 * body copy on the live site, so they render this shared block.
 */
export default function ExpertsContent({
  related,
}: {
  related: { label: string; href: string }[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            <div className="overflow-hidden rounded-4xl shadow-xl shadow-brand-900/10">
              <Image
                src="/images/Guy-working.jpg"
                alt="A Breeze technician at work"
                width={1000}
                height={800}
                className="h-64 w-full object-cover lg:h-80"
              />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                {bestInTown.heading}
              </h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                {bestInTown.body}
              </p>
            </div>
          </div>

          <div className="mt-14">
            <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {sayYesToTheBest.heading}
            </h2>
            <div className="prose-breeze mt-4 max-w-none">
              {sayYesToTheBest.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>

          <div className="mt-12 overflow-hidden rounded-4xl bg-brand-50 p-8 sm:p-10">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/25">
              <Icon name="check" className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-xl font-extrabold text-ink">
              {longAndShort.heading}
            </h3>
            {longAndShort.paragraphs.map((p, i) => (
              <p
                key={p}
                className={`mt-3 leading-relaxed ${
                  i === longAndShort.paragraphs.length - 1
                    ? "text-lg font-bold text-brand-700"
                    : "text-slate-600"
                }`}
              >
                {p}
              </p>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Keep reading
          </h2>
          <nav className="mt-4 flex flex-col gap-1.5">
            {related.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3 transition-all hover:border-brand-200 hover:bg-brand-50"
              >
                <span className="text-sm font-semibold text-slate-600 transition-colors group-hover:text-brand-700">
                  {r.label}
                </span>
                <Icon
                  name="arrow"
                  className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-600"
                />
              </Link>
            ))}
          </nav>
        </aside>
      </div>
    </section>
  );
}
