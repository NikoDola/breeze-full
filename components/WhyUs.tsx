import Image from "next/image";
import Link from "next/link";
import Icon from "./Icon";

const points = [
  {
    icon: "users",
    title: "Family owned & operated",
    body: "Our company has been family owned and operated on both residential and commercial jobs for more than two decades. You can count on us to stand behind our work.",
  },
  {
    icon: "tag",
    title: "Low, competitive prices",
    body: "We work hard to keep prices low and extremely competitive with other companies while staying on top of the latest technology and standards.",
  },
  {
    icon: "shield",
    title: "NATE-certified technicians",
    body: "Each of our team members is certified by the North American Technician Excellence organization, known for its rigorous coursework and certification.",
  },
  {
    icon: "clock",
    title: "Service that never sleeps",
    body: "In the event of an emergency, a Breeze representative is available 24/7/365 to answer your call — a real, live person, not electronic prompts.",
  },
];

export default function WhyUs() {
  return (
    <section className="relative overflow-hidden bg-slate-50 py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
        <div className="relative order-2 lg:order-1">
          <div className="overflow-hidden rounded-4xl shadow-2xl shadow-brand-900/10">
            <Image
              src="/images/Why-We-Should-At-Home.jpg"
              alt="A family at home, comfortable year-round"
              width={1200}
              height={800}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 right-4 max-w-[15rem] rounded-3xl bg-flame-500 p-5 text-white shadow-xl sm:-right-6">
            <p className="text-xl font-extrabold leading-tight">
              BEST IN TOWN, HANDS DOWN!
            </p>
            <p className="mt-2 text-sm text-white/85">
              Owner Kam Heidari started in HVAC at a young age.
            </p>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-flame-500">
            Why choose Breeze
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Service the way it oughta be.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Our core values of honesty, integrity, and service guide us in our
            mission to provide the very best to you and the local community.
          </p>

          <div className="mt-9 grid gap-5 sm:grid-cols-2">
            {points.map((p) => (
              <div key={p.title}>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-100">
                  <Icon name={p.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-3.5 font-extrabold text-ink">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {p.body}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/why-choose-breeze"
            className="group mt-9 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
          >
            Why Choose Breeze
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
