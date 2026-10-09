import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import CareersForm from "@/components/CareersForm";
import CtaBand from "@/components/CtaBand";
import Icon from "@/components/Icon";
import { careerExperience, careerBenefits } from "@/lib/company";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join Breeze Heating & Cooling. Competitive pay, guaranteed 40 hours, paid holidays, retirement matching and in-house training on new equipment.",
};

export default function Page() {
  return (
    <>
      <PageHero
        title="Careers"
        eyebrow="Join the team"
        tagline="Some of the perks and benefits we offer"
        icon="briefcase"
        image="/images/Guy-working.jpg"
      />

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="lg:sticky lg:top-32">
            <div className="rounded-4xl border border-slate-100 p-7">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <Icon name="wrench" className="h-5.5 w-5.5" />
              </span>
              <h2 className="mt-5 text-xl font-extrabold text-ink">
                Experience
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {careerExperience.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-slate-600">
                    <Icon
                      name="check"
                      className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brand-600"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 rounded-4xl bg-flame-50 p-7">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-flame-500 text-white shadow-lg shadow-flame-500/25">
                <Icon name="star" className="h-5.5 w-5.5" />
              </span>
              <h2 className="mt-5 text-xl font-extrabold text-ink">
                Benefits to Consider
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {careerBenefits.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-slate-600">
                    <Icon
                      name="check"
                      className="mt-0.5 h-4.5 w-4.5 shrink-0 text-flame-500"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <CareersForm />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
