import Link from "next/link";
import Icon from "./Icon";
import { site } from "@/lib/site";

/** The "Request Service" band the live site repeats above the footer. */
export default function CtaBand() {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-brand-700 via-brand-600 to-brand-800">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-flame-500/20 blur-3xl" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-8 px-5 py-14 text-center lg:flex-row lg:justify-between lg:px-8 lg:py-16 lg:text-left">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-flame-300">
            Request Service
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready when you are.
          </h2>
          <p className="mt-3 max-w-xl text-brand-100/80">
            Speak with a live person 24/7 — because personal service is our
            specialty. Tell us what&rsquo;s going on and we&rsquo;ll send a
            certified technician straight to your doorstep.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={site.phoneHref}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-flame-500 px-7 py-4 text-base font-bold text-white shadow-xl shadow-flame-900/25 transition-transform hover:-translate-y-0.5 hover:bg-flame-600"
          >
            <Icon name="phone" className="h-5 w-5" />
            {site.phone}
          </a>
          <Link
            href="/contact-us"
            className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-4 text-base font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            Schedule online
            <Icon
              name="arrow"
              className="h-5 w-5 transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
