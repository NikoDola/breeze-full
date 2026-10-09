import Link from "next/link";
import Icon from "./Icon";

/**
 * Shared banner for every interior page. Mirrors the live site's
 * "title + breadcrumb over an orange band" pattern, rebuilt on the
 * brand blue with an orange accent rule.
 */
export default function PageHero({
  title,
  tagline,
  eyebrow,
  icon,
  image,
}: {
  title: string;
  tagline?: string;
  eyebrow?: string;
  icon?: string;
  image?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-brand-950 pb-14 pt-16 lg:pb-20 lg:pt-20">
      {image && (
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${image})` }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-brand-950 via-brand-950/95 to-brand-900/70" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-brand-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-flame-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs font-semibold text-white/50"
        >
          <Link href="/" className="transition-colors hover:text-white">
            Home
          </Link>
          <span className="text-white/25">/</span>
          <span className="text-flame-400">{title}</span>
        </nav>

        <div className="mt-5 flex items-start gap-5">
          {icon && (
            <span className="hidden h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-flame-400 backdrop-blur sm:grid">
              <Icon name={icon} className="h-8 w-8" />
            </span>
          )}
          <div>
            {eyebrow && (
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-flame-400">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-1.5 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            {tagline && (
              <p className="mt-3 max-w-2xl text-lg font-medium text-brand-100/70">
                {tagline}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1 bg-linear-to-r from-flame-500 via-flame-400 to-brand-500" />
    </section>
  );
}
