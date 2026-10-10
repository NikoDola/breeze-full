import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import CareersForm from "@/components/sections/CareersForm";
import CtaBand from "@/components/sections/CtaBand";
import Icon from "@/components/ui/Icon";
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

      <section className="careers-section-1">
        <div className="careers-layout-1">
          <div className="careers-block-1">
            <div className="careers-card-1">
              <span className="careers-badge-1">
                <Icon name="wrench" className="careers-icon-1" />
              </span>
              <h2 className="careers-heading-1">
                Experience
              </h2>
              <ul className="careers-ul-1">
                {careerExperience.map((item) => (
                  <li key={item} className="careers-li-1">
                    <Icon
                      name="check"
                      className="careers-icon-2"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="careers-card-2">
              <span className="careers-badge-2">
                <Icon name="star" className="careers-icon-3" />
              </span>
              <h2 className="careers-heading-2">
                Benefits to Consider
              </h2>
              <ul className="careers-ul-2">
                {careerBenefits.map((item) => (
                  <li key={item} className="careers-li-2">
                    <Icon
                      name="check"
                      className="careers-icon-4"
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
