import Link from "next/link";
import Icon from "./Icon";
import { site } from "@/lib/site";

/** Full-bleed orange strip: the site's one loud, unmissable emergency prompt. */
export default function EmergencyBar() {
  return (
    <section className="bg-flame-500">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-7 text-center sm:flex-row sm:text-left lg:px-8">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20 text-white">
            <Icon name="bolt" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-lg font-extrabold text-white">
              Service That Never Sleeps: So You Can!
            </p>
            <p className="text-sm text-white/85">
              Breeze technicians are on-call at all hours, 24/7/365.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-center gap-3">
          <a
            href={site.phoneHref}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-flame-600 shadow-lg transition-transform hover:-translate-y-0.5"
          >
            <Icon name="phone" className="h-4 w-4" />
            {site.phone}
          </a>
          <Link
            href="/emergency"
            className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/15"
          >
            Emergency service
          </Link>
        </div>
      </div>
    </section>
  );
}
