import Link from "next/link";
import Icon from "./Icon";

export default function About() {
  return (
    <section className="relative overflow-hidden bg-ink py-20 text-white lg:py-28">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.06]"
        style={{ backgroundImage: "url(/images/bg_footer.jpg)" }}
      />
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-flame-400">
            About Breeze
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Nashville&rsquo;s Best Heating and Cooling Company
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-white/70">
            Residents of Nashville, Brentwood and surrounding areas have relied
            on the reliable services provided by Breeze for more than two
            decades. When our loyal customers call us for a furnace repair on a
            cold winter&rsquo;s night or a hot summer&rsquo;s day, we know that
            they need our help right away, not next week.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <article className="rounded-4xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-flame-500/15 text-flame-400">
              <Icon name="briefcase" className="h-5.5 w-5.5" />
            </span>
            <h3 className="mt-5 text-xl font-extrabold">Company History</h3>
            <p className="mt-3 leading-relaxed text-white/65">
              Our company has been family owned and operated on both residential
              and commercial jobs for more than two decades. You can count on us
              to stand behind our work and provide the solid result you expect.
              Our commitment to ensuring our customer&rsquo;s comfort all
              throughout the years garnered the respect and loyalty of residents
              all around the middle Tennessee area.
            </p>
          </article>

          <article className="rounded-4xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/20 text-brand-300">
              <Icon name="star" className="h-5.5 w-5.5" />
            </span>
            <h3 className="mt-5 text-xl font-extrabold">Our Philosophy</h3>
            <p className="mt-3 leading-relaxed text-white/65">
              Our mission is to provide the highest quality HVAC service to all
              our customers. We proudly serve our customers in a timely manner
              at a reasonable price. All of our services are matched by quality
              workmanship, trusted results, and long term peace of mind.
            </p>
          </article>
        </div>

        <div className="mt-10">
          <Link
            href="/about-us"
            className="group inline-flex items-center gap-2 rounded-full bg-flame-500 px-7 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-flame-600"
          >
            More about us
            <Icon
              name="arrow"
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
